import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { ApiError, apiFailure, apiUser, rateLimit, tokenHash } from '@/lib/api-server';
import { buildRun, isGameSlug, type Answer } from '@/lib/games/catalogue';
import { readRun } from '@/lib/games/run-token';
import { answerSchema } from '@/lib/games/answer-schema';

/**
 * Scores the whole run on the server from the answers, records it once and
 * returns the result with the person's best. Streaks of correct answers add
 * a bonus of up to 30%. XP comes only from the server's score.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const user = await apiUser();
    const { slug } = await params;
    if (!isGameSlug(slug)) throw new ApiError(404, 'Game not found.');
    await rateLimit('game-finish', user.id, 120, 3600);
    const body = z.object({ token: z.string().max(600), answers: z.array(answerSchema).max(20) }).parse(await req.json());
    const run = readRun(body.token, user.id);
    if (!run || run.g !== slug) throw new ApiError(400, 'This game has expired. Start a new one.');
    const hash = tokenHash(body.token);
    if (await db.gameResult.findFirst({ where: { userId: user.id, details: { contains: hash } } }))
      throw new ApiError(409, 'This game was already recorded.');

    const rounds = buildRun(slug, run.s);
    const results = rounds.map((r, i) => (body.answers[i] === undefined ? { points: 0, correct: false } : r.check(body.answers[i] as Answer)));
    let streak = 0;
    let bestStreak = 0;
    let bonus = 0;
    for (const r of results) {
      streak = r.correct ? streak + 1 : 0;
      bestStreak = Math.max(bestStreak, streak);
      if (streak >= 2) bonus += Math.min(30, (streak - 1) * 10) / 100 * r.points;
    }
    const base = results.reduce((s, r) => s + r.points, 0);
    const max = rounds.length * 100;
    const score = Math.round(base + bonus);
    const accuracy = Math.round((base / max) * 100) / 100;
    const xpEarned = Math.round(base / 10);
    const previousBest = await db.gameResult.findFirst({
      where: { userId: user.id, gameSlug: slug },
      orderBy: { score: 'desc' },
      select: { score: true },
    });

    await db.$transaction([
      db.gameResult.create({
        data: {
          userId: user.id,
          gameSlug: slug,
          gameType: slug.replace(/-/g, '_'),
          score,
          xpEarned,
          accuracy,
          duration: Math.round((Date.now() - run.t) / 1000),
          details: JSON.stringify({ run: hash, daily: run.d === 1, rounds: results.map((r) => r.points), bestStreak }),
        },
      }),
      db.user.update({ where: { id: user.id }, data: { totalXp: { increment: xpEarned } } }),
    ]);

    return NextResponse.json({
      score,
      max,
      base,
      bonus: Math.round(bonus),
      accuracy,
      xpEarned,
      bestStreak,
      rounds: results.map((r) => r.points),
      personalBest: Math.max(score, previousBest?.score ?? 0),
      newBest: !previousBest || score > previousBest.score,
    });
  } catch (error) {
    return apiFailure(error);
  }
}
