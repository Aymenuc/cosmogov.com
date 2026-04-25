import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { demographics, motivation } = body;

    const pool = await db.sortitionPool.findUnique({ where: { id } });
    if (!pool) {
      return NextResponse.json({ error: 'Sortition pool not found' }, { status: 404 });
    }

    if (pool.status !== 'recruiting') {
      return NextResponse.json({ error: 'This pool is no longer accepting volunteers' }, { status: 400 });
    }

    // Check if already volunteered
    const existing = await db.sortitionCandidate.findUnique({
      where: { poolId_userId: { poolId: id, userId: session.id } },
    });
    if (existing) {
      return NextResponse.json({ error: 'You have already volunteered for this pool' }, { status: 409 });
    }

    const candidate = await db.sortitionCandidate.create({
      data: {
        poolId: id,
        userId: session.id,
        demographics: demographics ? JSON.stringify(demographics) : '{}',
        motivation: motivation || null,
        status: 'volunteered',
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Update candidate count
    await db.sortitionPool.update({
      where: { id },
      data: { candidateCount: { increment: 1 } },
    });

    return NextResponse.json({ candidate }, { status: 201 });
  } catch (error) {
    console.error('Error volunteering for sortition:', error);
    return NextResponse.json({ error: 'Failed to volunteer' }, { status: 500 });
  }
}
