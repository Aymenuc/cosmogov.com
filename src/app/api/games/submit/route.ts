import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { gameType, score, accuracy, details } = await req.json();
    
    const xpEarned = Math.floor(score * 1.5);

    const result = await db.gameResult.create({
      data: {
        userId: session.id,
        gameType,
        score,
        xpEarned,
        accuracy: accuracy || null,
        details: JSON.stringify(details || {}),
      },
    });

    await db.user.update({
      where: { id: session.id },
      data: { totalXp: { increment: xpEarned } },
    });

    return NextResponse.json({ ...result, xpEarned }, { status: 201 });
  } catch (error) {
    console.error('Game submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
