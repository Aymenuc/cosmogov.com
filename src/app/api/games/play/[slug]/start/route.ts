import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'node:crypto';
import { ApiError, apiFailure, apiUser, rateLimit } from '@/lib/api-server';
import { GAMES, buildRun, dailySeed, isGameSlug } from '@/lib/games/catalogue';
import { signRun } from '@/lib/games/run-token';

/** Starts a run: returns the rounds (without answers) and a signed run token. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const user = await apiUser();
    const { slug } = await params;
    if (!isGameSlug(slug)) throw new ApiError(404, 'Game not found.');
    await rateLimit('game-start', user.id, 120, 3600);
    const body = await req.json().catch(() => ({}));
    const daily = body?.mode === 'daily';
    const seed = daily ? dailySeed(slug) : randomInt(1, 2 ** 31);
    const rounds = buildRun(slug, seed).map((r) => r.public);
    const token = signRun({ u: user.id, g: slug, s: seed, d: daily ? 1 : 0, t: Date.now() });
    return NextResponse.json({ token, daily, game: { name: GAMES[slug].name, how: GAMES[slug].how }, rounds });
  } catch (error) {
    return apiFailure(error);
  }
}
