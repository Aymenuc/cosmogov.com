import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Signed-in members only: these lists include names and community activity.
  const viewer = await getSession();
  if (!viewer) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

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

    // Volunteering is personal. Organisers see the list; everyone else sees
    // the group mix (for the balance chart), their own entry and the people
    // actually picked, never the other volunteers' names.
    const canManage =
      pool.createdBy === viewer.id || viewer.role === 'admin' || viewer.role === 'super_admin';
    const candidates = canManage
      ? pool.candidates
      : pool.candidates.map((c) =>
          c.userId === viewer.id || c.status === 'selected'
            ? c
            : {
                ...c,
                userId: '',
                motivation: null,
                user: { id: '', name: null, avatarUrl: null, ageGroup: c.user.ageGroup },
              },
        );

    return NextResponse.json({ pool: { ...pool, candidates }, canManage });
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
    // Only the organiser or an admin may change a pool, and the people picked
    // can only come from the server-side draw (POST /select), never from here.
    const isAdmin = session.role === 'admin' || session.role === 'super_admin';
    if (existing.createdBy !== session.id && !isAdmin) {
      return NextResponse.json({ error: 'Only the organiser can change this pool.' }, { status: 403 });
    }
    if (selectedMembers !== undefined) {
      return NextResponse.json({ error: 'The panel is chosen by the draw, not set by hand.' }, { status: 400 });
    }
    // After the draw a panel can start work and later finish; it can't go
    // back to recruiting (that would allow re-drawing until a result suits).
    const NEXT: Record<string, string[]> = { selected: ['active', 'completed'], active: ['completed'] };
    if (status !== undefined && !(NEXT[existing.status] ?? []).includes(status)) {
      return NextResponse.json({ error: 'That change is not allowed at this stage.' }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (status) data.status = status;

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
