import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const purpose = searchParams.get('purpose');
    const scope = searchParams.get('scope');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (purpose && purpose !== 'all') where.purpose = purpose;
    if (scope && scope !== 'all') where.scope = scope;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const assemblies = await db.assembly.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        members: {
          take: 8,
          select: {
            id: true,
            role: true,
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { joinedAt: 'desc' },
        },
        _count: { select: { members: true, meetings: true } },
        meetings: {
          where: { startsAt: { gte: new Date() }, status: 'scheduled' },
          take: 1,
          orderBy: { startsAt: 'asc' },
          select: { id: true, title: true, startsAt: true, type: true },
        },
      },
    });

    return NextResponse.json({ assemblies });
  } catch (error) {
    console.error('Error fetching assemblies:', error);
    return NextResponse.json({ error: 'Failed to fetch assemblies' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await request.json();
    const { name, description, purpose, scope, meetingCadence, isPublic, processId } = body;

    if (!name || !description) {
      return NextResponse.json({ error: 'Name and description are required' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

    const assembly = await db.assembly.create({
      data: {
        name,
        slug,
        description,
        purpose: purpose || 'deliberation',
        scope: scope || 'general',
        meetingCadence: meetingCadence || 'monthly',
        isPublic: isPublic !== undefined ? isPublic : true,
        processId: processId || null,
        createdBy: session.id,
        memberCount: 1,
        members: {
          create: {
            userId: session.id,
            role: 'coordinator',
          },
        },
      },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ assembly }, { status: 201 });
  } catch (error) {
    console.error('Error creating assembly:', error);
    return NextResponse.json({ error: 'Failed to create assembly' }, { status: 500 });
  }
}
