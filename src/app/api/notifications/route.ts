import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const notifications = await db.notification.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  return NextResponse.json(notifications);
}
