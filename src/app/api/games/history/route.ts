import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const results = await db.gameResult.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(results);
}
