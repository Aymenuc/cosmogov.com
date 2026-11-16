import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { ApiError, apiFailure, apiUser, rateLimit, tokenHash } from '@/lib/api-server';
import { readRun } from '@/lib/games/run-token';
import { replay, verdict } from '@/lib/games/townhall';

const schema = z.object({
  token: z.string().max(600),
  decisions: z.array(z.object({ choice: z.number().int().min(0).max(2), asked: z.boolean() })).length(12),
});

/** Replays the year on the server from the decisions, scores it and records it once. */
export async function POST(req: NextRequest) {
  try {
    const user = await apiUser();
    await rateLimit('townhall-finish', user.id, 60, 3600);
    const body = schema.parse(await req.json());
    const run = readRun(body.token, user.id);
    if (!run || run.g !== 'town-hall') throw new ApiError(400, 'This year has expired. Start a new one.');
    const hash = tokenHash(body.token);
    if (await db.gameResult.findFirst({ where: { userId: user.id, details: { contains: hash } } }))
      throw new ApiError(409, 'This year was already recorded.');
    const state = replay(run.s, body.decisions);
    const v = verdict(state);
    const best = await db.gameResult.findFirst({ where: { userId: user.id, gameSlug: 'town-hall' }, orderBy: { score: 'desc' }, select: { score: true } });
    const xpEarned = Math.round(v.score / 20);
    await db.$transaction([
      db.gameResult.create({
        data: {
          userId: user.id,
          gameSlug: 'town-hall',
          gameType: 'town_hall',
          score: v.score,
          xpEarned,
          accuracy: v.average / 100,
          duration: Math.round((Date.now() - run.t) / 1000),
          details: JSON.stringify({ run: hash, mode: 'solo', lowest: v.lowest }),
        },
      }),
      db.user.update({ where: { id: user.id }, data: { totalXp: { increment: xpEarned } } }),
    ]);
    return NextResponse.json({ ...v, xpEarned, personalBest: Math.max(v.score, best?.score ?? 0), newBest: !best || v.score > best.score });
  } catch (error) {
    return apiFailure(error);
  }
}
