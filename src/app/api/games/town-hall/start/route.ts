import { NextResponse } from 'next/server';
import { randomInt } from 'node:crypto';
import { apiFailure, apiUser, rateLimit } from '@/lib/api-server';
import { signRun } from '@/lib/games/run-token';

/** Starts a solo year: a fresh seed, signed so the finish can be replayed and trusted. */
export async function POST() {
  try {
    const user = await apiUser();
    await rateLimit('townhall-start', user.id, 60, 3600);
    const seed = randomInt(1, 2 ** 31);
    return NextResponse.json({ seed, token: signRun({ u: user.id, g: 'town-hall', s: seed, d: 0, t: Date.now() }) });
  } catch (error) {
    return apiFailure(error);
  }
}
