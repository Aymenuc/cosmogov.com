import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();

    const assembly = await db.assembly.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        members: {
          orderBy: { joinedAt: 'desc' },
          select: {
            id: true,
            role: true,
            joinedAt: true,
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        meetings: {
          orderBy: { startsAt: 'desc' },
          take: 10,
          select: {
            id: true,
            title: true,
            startsAt: true,
            endsAt: true,
            type: true,
            status: true,
            attendeeCount: true,
          },
        },
        _count: { select: { members: true, meetings: true } },
      },
    });

    if (!assembly) return NextResponse.json({ error: 'Assembly not found' }, { status: 404 });

    const isMember = session
      ? await db.assemblyMember.findUnique({ where: { assemblyId_userId: { assemblyId: id, userId: session.id } } })
      : null;

    return NextResponse.json({ assembly, isMember: !!isMember, memberRole: isMember?.role || null });
  } catch (error) {
    console.error('Error fetching assembly:', error);
    return NextResponse.json({ error: 'Failed to fetch assembly' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const assembly = await db.assembly.findUnique({ where: { id } });
    if (!assembly) return NextResponse.json({ error: 'Assembly not found' }, { status: 404 });

    const membership = await db.assemblyMember.findUnique({
      where: { assemblyId_userId: { assemblyId: id, userId: session.id } },
    });

    const isCoordinator = membership?.role === 'coordinator';
    const isAdmin = session.role === 'admin' || session.role === 'super_admin';
    if (!isCoordinator && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const updated = await db.assembly.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description && { description: body.description }),
        ...(body.purpose && { purpose: body.purpose }),
        ...(body.scope && { scope: body.scope }),
        ...(body.meetingCadence && { meetingCadence: body.meetingCadence }),
        ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
      },
    });

    return NextResponse.json({ assembly: updated });
  } catch (error) {
    console.error('Error updating assembly:', error);
    return NextResponse.json({ error: 'Failed to update assembly' }, { status: 500 });
  }
}
