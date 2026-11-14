import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiUser, apiFailure } from '@/lib/api-server';

export async function GET() {
  try {
    await apiUser();
    const leaderboard = await db.cosmicReputation.findMany({
      orderBy: { score: 'desc' },
      take: 50,
      include: {
        user: {
          select: { id: true, name: true, level: true, totalXp: true, streak: true },
        },
      },
    });

    const result = leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      name: entry.user?.name || 'Community member',
      level: entry.user?.level || 1,
      streak: entry.user?.streak || 0,
      score: entry.score,
      tier: entry.tier,
    }));

    return NextResponse.json({ leaderboard: result });
  } catch (error) {
    return apiFailure(error);
  }
}
