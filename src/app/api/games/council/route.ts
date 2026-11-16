import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { db } from '@/lib/db';
import { ApiError, apiFailure, apiUser, rateLimit } from '@/lib/api-server';
import { GROUPS, replay, verdict, yearOf, type Group } from '@/lib/games/townhall';

/**
 * Council rooms for "A year at the town hall". Up to four neighbours, one per
 * resident group. Each player privately sees how options affect their own
 * group, can speak up (good / ok / bad per option), and votes; the majority
 * decides. The room is polled every couple of seconds, so it works on
 * serverless hosting without a live connection.
 */
type Player = { userId: string; name: string; group: Group };
type Decision = { choice: number; asked: boolean };
type Reactions = Record<string, Record<string, Record<string, 'good' | 'ok' | 'bad'>>>;
type Votes = Record<string, Record<string, number>>;

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () => Array.from({ length: 6 }, () => CODE_CHARS[randomInt(0, CODE_CHARS.length)]).join('');
const ROOM_TTL_MS = 24 * 60 * 60 * 1000;

function parse(room: { players: string; decisions: string; reactions: string; votes: string }) {
  return {
    players: JSON.parse(room.players) as Player[],
    decisions: JSON.parse(room.decisions) as Decision[],
    reactions: JSON.parse(room.reactions) as Reactions,
    votes: JSON.parse(room.votes) as Votes,
  };
}

async function loadRoom(code: string) {
  const room = await db.councilRoom.findUnique({ where: { code: code.toUpperCase() } });
  if (!room || Date.now() - room.updatedAt.getTime() > ROOM_TTL_MS) throw new ApiError(404, 'No open council with that code.');
  return room;
}

/** What one player sees: everything public, plus their own group's private effects. */
function view(room: Awaited<ReturnType<typeof loadRoom>>, userId: string) {
  const { players, decisions, reactions, votes } = parse(room);
  const me = players.find((p) => p.userId === userId) ?? null;
  const month = decisions.length;
  const year = yearOf(room.seed);
  const state = replay(room.seed, decisions);
  const current = room.status === 'playing' && month < 12 ? year[month] : null;
  return {
    code: room.code,
    status: room.status,
    isHost: room.hostId === userId,
    me,
    players: players.map((p) => ({ name: p.name, group: p.group, voted: votes[month]?.[p.userId] !== undefined, isHost: p.userId === room.hostId })),
    missing: GROUPS.filter((g) => !players.some((p) => p.group === g)),
    month,
    state,
    dilemma: current
      ? {
          id: current.id,
          title: current.title,
          text: current.text,
          options: current.options.map((o) => ({
            label: o.label,
            budget: o.effect.budget ?? 0,
            env: o.effect.env ?? 0,
            trust: o.effect.trust ?? 0,
            mine: me ? o.effect.mood?.[me.group] ?? 0 : null,
          })),
        }
      : null,
    reactions: Object.fromEntries(
      Object.entries(reactions[month] ?? {}).map(([uid, r]) => [players.find((p) => p.userId === uid)?.group ?? 'unknown', r]),
    ),
    tally: current ? current.options.map((_, i) => Object.values(votes[month] ?? {}).filter((v) => v === i).length) : [],
    myVote: votes[month]?.[userId] ?? null,
    verdict: room.status === 'done' ? verdict(state) : null,
  };
}

const actionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('create') }),
  z.object({ type: z.literal('join'), code: z.string().min(4).max(8) }),
  z.object({ type: z.literal('start'), code: z.string().min(4).max(8) }),
  z.object({ type: z.literal('react'), code: z.string().min(4).max(8), option: z.number().int().min(0).max(2), value: z.enum(['good', 'ok', 'bad']) }),
  z.object({ type: z.literal('vote'), code: z.string().min(4).max(8), option: z.number().int().min(0).max(2) }),
  z.object({ type: z.literal('decide'), code: z.string().min(4).max(8) }),
]);

export async function GET(req: NextRequest) {
  try {
    const user = await apiUser();
    const code = req.nextUrl.searchParams.get('code') || '';
    const room = await loadRoom(code);
    const { players } = parse(room);
    if (!players.some((p) => p.userId === user.id)) throw new ApiError(403, 'Join this council first.');
    return NextResponse.json(view(room, user.id));
  } catch (error) {
    return apiFailure(error);
  }
}

/** Applies the majority decision for the current month (ties: the earliest option with most votes). */
function decide(seed: number, decisions: Decision[], reactions: Reactions, votes: Votes, players: Player[]) {
  const month = decisions.length;
  const options = yearOf(seed)[month].options.length;
  const tally = Array.from({ length: options }, (_, i) => Object.values(votes[month] ?? {}).filter((v) => v === i).length);
  const choice = tally.indexOf(Math.max(...tally));
  // The council "asked residents first" when most groups spoke up before deciding.
  const asked = Object.keys(reactions[month] ?? {}).length >= Math.ceil(players.length / 2);
  return [...decisions, { choice, asked }];
}

export async function POST(req: NextRequest) {
  try {
    const user = await apiUser();
    await rateLimit('council', user.id, 600, 3600);
    const body = actionSchema.parse(await req.json());

    if (body.type === 'create') {
      const me = await db.user.findUnique({ where: { id: user.id }, select: { name: true } });
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = newCode();
        try {
          const room = await db.councilRoom.create({
            data: {
              code,
              seed: randomInt(1, 2 ** 31),
              hostId: user.id,
              players: JSON.stringify([{ userId: user.id, name: (me?.name || 'Host').slice(0, 30), group: GROUPS[0] }]),
            },
          });
          return NextResponse.json(view(room, user.id), { status: 201 });
        } catch {
          // code clash: try another
        }
      }
      throw new ApiError(503, 'Could not open a council. Please try again.');
    }

    // All other actions change an existing room. Retry on concurrent updates.
    for (let attempt = 0; attempt < 4; attempt++) {
      const room = await loadRoom(body.code);
      let { players, decisions, reactions, votes } = parse(room);
      let status = room.status;
      const me = players.find((p) => p.userId === user.id);

      if (body.type === 'join') {
        if (!me) {
          if (status !== 'lobby') throw new ApiError(409, 'This council has already started.');
          const free = GROUPS.find((g) => !players.some((p) => p.group === g));
          if (!free) throw new ApiError(409, 'This council is full: all four groups are taken.');
          const profile = await db.user.findUnique({ where: { id: user.id }, select: { name: true } });
          players = [...players, { userId: user.id, name: (profile?.name || 'Neighbour').slice(0, 30), group: free }];
        }
      } else {
        if (!me) throw new ApiError(403, 'Join this council first.');
        const month = String(decisions.length);
        if (body.type === 'start') {
          if (room.hostId !== user.id) throw new ApiError(403, 'Only the host can start.');
          if (status === 'lobby') status = 'playing';
        } else if (status !== 'playing') {
          throw new ApiError(409, 'This council is not in session.');
        } else if (body.type === 'react') {
          reactions = { ...reactions, [month]: { ...(reactions[month] ?? {}), [user.id]: { ...(reactions[month]?.[user.id] ?? {}), [body.option]: body.value } } };
        } else if (body.type === 'vote') {
          votes = { ...votes, [month]: { ...(votes[month] ?? {}), [user.id]: body.option } };
          if (Object.keys(votes[month]).length >= players.length) decisions = decide(room.seed, decisions, reactions, votes, players);
        } else if (body.type === 'decide') {
          if (room.hostId !== user.id) throw new ApiError(403, 'Only the host can close the vote early.');
          if (!Object.keys(votes[month] ?? {}).length) throw new ApiError(409, 'Nobody has voted yet.');
          decisions = decide(room.seed, decisions, reactions, votes, players);
        }
        if (decisions.length >= 12) status = 'done';
      }

      const updated = await db.councilRoom.updateMany({
        where: { id: room.id, version: room.version },
        data: {
          status,
          players: JSON.stringify(players),
          decisions: JSON.stringify(decisions),
          reactions: JSON.stringify(reactions),
          votes: JSON.stringify(votes),
          version: { increment: 1 },
        },
      });
      if (!updated.count) continue;

      const fresh = await loadRoom(body.code);
      if (status === 'done' && room.status !== 'done') {
        // Record the shared result once for every player.
        const v = verdict(replay(fresh.seed, decisions));
        await db.$transaction(
          players.flatMap((p) => [
            db.gameResult.create({
              data: {
                userId: p.userId,
                gameSlug: 'town-hall',
                gameType: 'town_hall',
                score: v.score,
                xpEarned: Math.round(v.score / 20),
                accuracy: v.average / 100,
                details: JSON.stringify({ mode: 'council', room: fresh.code, players: players.length }),
              },
            }),
            db.user.update({ where: { id: p.userId }, data: { totalXp: { increment: Math.round(v.score / 20) } } }),
          ]),
        );
      }
      return NextResponse.json(view(fresh, user.id));
    }
    throw new ApiError(409, 'The council was busy. Please try again.');
  } catch (error) {
    return apiFailure(error);
  }
}
