import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();

    const meeting = await db.meeting.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        assembly: { select: { id: true, name: true, slug: true } },
        attendees: {
          select: {
            id: true,
            role: true,
            attended: true,
            rsvpAt: true,
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { rsvpAt: 'desc' },
        },
        _count: { select: { attendees: true } },
      },
    });

    if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });

    let agenda: { item: string; duration: number; presenter?: string }[] = [];
    try { agenda = JSON.parse(meeting.agenda); } catch { agenda = []; }

    const attendeeRecord = session
      ? await db.meetingAttendee.findUnique({ where: { meetingId_userId: { meetingId: id, userId: session.id } } })
      : null;

    return NextResponse.json({
      meeting: { ...meeting, agendaParsed: agenda },
      rsvpStatus: attendeeRecord ? { role: attendeeRecord.role, attended: attendeeRecord.attended } : null,
    });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    return NextResponse.json({ error: 'Failed to fetch meeting' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const meeting = await db.meeting.findUnique({ where: { id } });
    if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });

    const attendeeRecord = await db.meetingAttendee.findUnique({
      where: { meetingId_userId: { meetingId: id, userId: session.id } },
    });

    const isOrganizer = attendeeRecord?.role === 'organizer';
    const isAdmin = session.role === 'admin' || session.role === 'super_admin';
    if (!isOrganizer && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const updated = await db.meeting.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.type && { type: body.type }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.videoUrl !== undefined && { videoUrl: body.videoUrl }),
        ...(body.startsAt && { startsAt: new Date(body.startsAt) }),
        ...(body.endsAt !== undefined && { endsAt: body.endsAt ? new Date(body.endsAt) : null }),
        ...(body.maxAttendees !== undefined && { maxAttendees: body.maxAttendees }),
        ...(body.agenda && { agenda: JSON.stringify(body.agenda) }),
        ...(body.status && { status: body.status }),
        ...(body.minutes !== undefined && { minutes: body.minutes }),
        ...(body.recordingUrl !== undefined && { recordingUrl: body.recordingUrl }),
      },
    });

    return NextResponse.json({ meeting: updated });
  } catch (error) {
    console.error('Error updating meeting:', error);
    return NextResponse.json({ error: 'Failed to update meeting' }, { status: 500 });
  }
}
