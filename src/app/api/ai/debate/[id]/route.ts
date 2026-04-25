import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;

    const debate = await db.debateSession.findUnique({
      where: { id },
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
            language: true,
            complexityPref: true,
            handRaised: true,
            speaking: true,
          },
        },
        messages: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            participant: { select: { id: true, displayName: true, role: true, agentType: true } },
          },
        },
        interventions: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!debate) {
      return NextResponse.json({ error: 'Debate session not found' }, { status: 404 });
    }

    // Reverse messages so they are in chronological order
    const debateWithOrderedMessages = {
      ...debate,
      messages: [...debate.messages].reverse(),
    };

    return NextResponse.json(debateWithOrderedMessages);
  } catch (error) {
    console.error('Debate session fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;

    // Verify the debate exists and user is the creator
    const existing = await db.debateSession.findUnique({
      where: { id },
      select: { createdBy: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Debate session not found' }, { status: 404 });
    }

    if (existing.createdBy !== session.id) {
      return NextResponse.json({ error: 'Only the creator can update this debate' }, { status: 403 });
    }

    const body = await request.json();
    const { status, phase, consensusLevel, energyLevel } = body;

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (phase !== undefined) updateData.phase = phase;
    if (consensusLevel !== undefined) updateData.consensusLevel = consensusLevel;
    if (energyLevel !== undefined) updateData.energyLevel = energyLevel;

    const updated = await db.debateSession.update({
      where: { id },
      data: updateData,
      include: {
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update debate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
