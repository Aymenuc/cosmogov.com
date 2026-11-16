import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiError, apiFailure, apiUser, rateLimit } from '@/lib/api-server';
import { buildRun, isGameSlug, type Answer } from '@/lib/games/catalogue';
import { readRun } from '@/lib/games/run-token';
import { answerSchema } from '@/lib/games/answer-schema';


/** Checks one answer and returns the explanation. Scoring is redone at the finish. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const user = await apiUser();
    const { slug } = await params;
    if (!isGameSlug(slug)) throw new ApiError(404, 'Game not found.');
    await rateLimit('game-check', user.id, 900, 3600);
    const body = z.object({ token: z.string().max(600), index: z.number().int().min(0).max(20), answer: answerSchema }).parse(await req.json());
    const run = readRun(body.token, user.id);
    if (!run || run.g !== slug) throw new ApiError(400, 'This game has expired. Start a new one.');
    const round = buildRun(slug, run.s)[body.index];
    if (!round) throw new ApiError(400, 'No such round.');
    return NextResponse.json(round.check(body.answer as Answer));
  } catch (error) {
    return apiFailure(error);
  }
}
