import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { role } = body;

    const meeting = await db.meeting.findUnique({ where: { id } });
    if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });

    if (meeting.status === 'completed' || meeting.status === 'cancelled') {
      return NextResponse.json({ error: 'This meeting is no longer accepting RSVPs' }, { status: 400 });
    }

    if (meeting.maxAttendees && meeting.attendeeCount >= meeting.maxAttendees) {
      const existing = await db.meetingAttendee.findUnique({
        where: { meetingId_userId: { meetingId: id, userId: session.id } },
      });
      if (!existing) {
        return NextResponse.json({ error: 'This meeting has reached its maximum capacity' }, { status: 400 });
      }
    }

    const existing = await db.meetingAttendee.findUnique({
      where: { meetingId_userId: { meetingId: id, userId: session.id } },
    });

    if (existing) return NextResponse.json({ error: 'You have already RSVPed to this meeting' }, { status: 409 });

    const attendee = await db.meetingAttendee.create({
      data: {
        meetingId: id,
        userId: session.id,
        role: role || 'attendee',
      },
    });

    await db.meeting.update({
      where: { id },
      data: { attendeeCount: { increment: 1 } },
    });

    return NextResponse.json({ attendee }, { status: 201 });
  } catch (error) {
    console.error('Error RSVPing to meeting:', error);
    return NextResponse.json({ error: 'Failed to RSVP' }, { status: 500 });
  }
}
