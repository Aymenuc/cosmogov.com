import { NextRequest, NextResponse } from 'next/server';
import { ApiError, apiFailure, rateLimit } from '@/lib/api-server';
import { debateVisibility } from '@/lib/visibility';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

const ALL_AGENT_TYPES = ['moderator', 'facilitator', 'summarizer', 'consensus', 'translator', 'accessibility'];

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = { AND: [debateVisibility(session.id)] };
    if (status) where.status = status;

    const debates = await db.debateSession.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
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
    await rateLimit('debate-create', session.id, 10, 3600);
    const body = await request.json().catch(() => ({}));
    const { assemblyId, isPublic, maxParticipants } = body;
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const topic = typeof body.topic === 'string' ? body.topic.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    if (title.length < 3 || title.length > 120 || topic.length < 3 || topic.length > 300) {
      return NextResponse.json(
        { error: 'Give the debate a title (up to 120 characters) and a one-line question (up to 300).' },
        { status: 400 }
      );
    }
    if (description.length > 2000) {
      return NextResponse.json({ error: 'Keep the background under 2,000 characters.' }, { status: 400 });
    }

    // Create debate session with all 6 AI agents active
    const debate = await db.debateSession.create({
      data: {
        title,
        description: description || null,
        topic,
        assemblyId: assemblyId || null,
        isPublic: isPublic !== undefined ? isPublic : true,
        maxParticipants: Math.min(500, Math.max(2, Number(maxParticipants) || 50)),
        aiAgentsActive: JSON.stringify(ALL_AGENT_TYPES),
        createdBy: session.id,
        status: 'waiting',
        phase: 'opening',
        consensusLevel: 0,
        energyLevel: 0.5,
      },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        assembly: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json(debate, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) return apiFailure(error);
    console.error('Create debate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
