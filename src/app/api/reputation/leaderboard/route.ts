import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const leaderboard = await db.cosmicReputation.findMany({
      orderBy: { score: 'desc' },
      take: 50,
      include: {
        user: {
          select: { id: true, name: true, email: true, level: true, totalXp: true, streak: true },
        },
      },
    });

    const result = leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      name: entry.user?.name || entry.user?.email?.split('@')[0] || 'Anonymous',
      level: entry.user?.level || 1,
      streak: entry.user?.streak || 0,
      score: entry.score,
      tier: entry.tier,
    }));

    return NextResponse.json({ leaderboard: result });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 });
  }
}
