import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

const ALL_AGENT_TYPES = ['moderator', 'facilitator', 'summarizer', 'consensus', 'translator', 'accessibility'];

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const debates = await db.debateSession.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
        assembly: { select: { id: true, name: true, slug: true } },
        meeting: { select: { id: true, title: true } },
        participants: {
          select: {
            id: true,
            displayName: true,
            role: true,
            agentType: true,
            stance: true,
            avatarUrl: true,
          },
        },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(debates);
  } catch (error) {
    console.error('Debate sessions fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { title, description, topic, assemblyId, isPublic, maxParticipants } = body;

    if (!title || !topic) {
      return NextResponse.json(
        { error: 'Title and topic are required' },
        { status: 400 }
      );
    }

    // Create debate session with all 6 AI agents active
    const debate = await db.debateSession.create({
      data: {
        title,
        description: description || null,
        topic,
        assemblyId: assemblyId || null,
        isPublic: isPublic !== undefined ? isPublic : true,
        maxParticipants: maxParticipants || 50,
        aiAgentsActive: JSON.stringify(ALL_AGENT_TYPES),
        createdBy: session.id,
        status: 'waiting',
        phase: 'opening',
        consensusLevel: 0,
        energyLevel: 0.5,
      },
      include: {
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
        assembly: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json(debate, { status: 201 });
  } catch (error) {
    console.error('Create debate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
