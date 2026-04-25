import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'upcoming';
    const type = searchParams.get('type');
    const assemblyId = searchParams.get('assemblyId');
    const processId = searchParams.get('processId');

    const where: Record<string, unknown> = {};

    if (type && type !== 'all') where.type = type;
    if (assemblyId) where.assemblyId = assemblyId;
    if (processId) where.processId = processId;

    if (timeframe === 'upcoming') {
      where.startsAt = { gte: new Date() };
      where.status = { in: ['scheduled', 'live'] };
    } else if (timeframe === 'past') {
      where.OR = [
        { startsAt: { lt: new Date() } },
        { status: 'completed' },
      ];
    }

    const meetings = await db.meeting.findMany({
      where,
      orderBy: { startsAt: timeframe === 'upcoming' ? 'asc' : 'desc' },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        assembly: { select: { id: true, name: true, slug: true } },
        attendees: {
          take: 6,
          select: {
            id: true,
            role: true,
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        _count: { select: { attendees: true } },
      },
    });

    return NextResponse.json({ meetings });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await request.json();
    const { title, description, type, address, videoUrl, startsAt, endsAt, maxAttendees, agenda, assemblyId, processId } = body;

    if (!title || !startsAt) {
      return NextResponse.json({ error: 'Title and start time are required' }, { status: 400 });
    }

    const meeting = await db.meeting.create({
      data: {
        title,
        description: description || null,
        type: type || 'hybrid',
        address: address || null,
        videoUrl: videoUrl || null,
        startsAt: new Date(startsAt),
        endsAt: endsAt ? new Date(endsAt) : null,
        maxAttendees: maxAttendees || null,
        agenda: agenda ? JSON.stringify(agenda) : '[]',
        assemblyId: assemblyId || null,
        processId: processId || null,
        createdBy: session.id,
        attendees: {
          create: {
            userId: session.id,
            role: 'organizer',
          },
        },
      },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        assembly: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ meeting }, { status: 201 });
  } catch (error) {
    console.error('Error creating meeting:', error);
    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 });
  }
}
