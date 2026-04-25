import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pool = await db.sortitionPool.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true, role: true } },
        candidates: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true, ageGroup: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!pool) {
      return NextResponse.json({ error: 'Sortition pool not found' }, { status: 404 });
    }

    return NextResponse.json({ pool });
  } catch (error) {
    console.error('Error fetching sortition pool:', error);
    return NextResponse.json({ error: 'Failed to fetch sortition pool' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { status, selectedMembers } = body;

    const existing = await db.sortitionPool.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Sortition pool not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (selectedMembers) data.selectedMembers = JSON.stringify(selectedMembers);
    if (status === 'selected') data.selectionDate = new Date();

    const pool = await db.sortitionPool.update({
      where: { id },
      data,
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        candidates: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });

    return NextResponse.json({ pool });
  } catch (error) {
    console.error('Error updating sortition pool:', error);
    return NextResponse.json({ error: 'Failed to update sortition pool' }, { status: 500 });
  }
}
