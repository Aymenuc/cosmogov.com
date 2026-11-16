import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiFailure, apiUser } from '@/lib/api-server';
import { GAME_ORDER } from '@/lib/games/catalogue';

/** Personal bests, plays and whether today's challenge is done, per game. */
export async function GET() {
  try {
    const user = await apiUser();
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const rows = await db.gameResult.findMany({
      where: { userId: user.id, gameSlug: { in: GAME_ORDER } },
      select: { gameSlug: true, score: true, xpEarned: true, createdAt: true, details: true },
    });
    const games = Object.fromEntries(
      GAME_ORDER.map((slug) => {
        const mine = rows.filter((r) => r.gameSlug === slug);
        return [
          slug,
          {
            plays: mine.length,
            best: mine.reduce((m, r) => Math.max(m, r.score), 0),
            dailyDone: mine.some((r) => r.createdAt >= today && r.details.includes('"daily":true')),
          },
        ];
      }),
    );
    const xp = rows.reduce((s, r) => s + r.xpEarned, 0);
    return NextResponse.json({ games, xp, plays: rows.length });
  } catch (error) {
    return apiFailure(error);
  }
}
