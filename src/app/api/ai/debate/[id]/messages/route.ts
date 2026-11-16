import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ApiError, apiFailure, rateLimit } from '@/lib/api-server';
import { debateVisibility } from '@/lib/visibility';

// ─── Simple Sentiment Analysis ───

function analyzeSentiment(content: string): string {
  const negativeWords = ['angry', 'hate', 'terrible', 'awful', 'stupid', 'idiot', 'worst', 'disgusting', 'outrageous', 'unacceptable', 'ridiculous'];
  const positiveWords = ['great', 'excellent', 'love', 'wonderful', 'amazing', 'fantastic', 'agree', 'support', 'brilliant', 'perfect'];
  const lowerContent = content.toLowerCase();

  const negCount = negativeWords.filter(w => lowerContent.includes(w)).length;
  const posCount = positiveWords.filter(w => lowerContent.includes(w)).length;

  if (negCount > posCount) return 'negative';
  if (posCount > negCount) return 'positive';
  return 'neutral';
}

// ─── GET: Fetch paginated messages ───

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const visible = await db.debateSession.findFirst({
      where: { id, ...debateVisibility(session.id) },
      select: { id: true },
    });
    if (!visible) {
      return NextResponse.json({ error: 'Debate session not found' }, { status: 404 });
    }

    const messages = await db.debateMessage.findMany({
      where: { sessionId: id },
      include: {
        participant: { select: { id: true, displayName: true, role: true, agentType: true } },
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Reverse to chronological order
    return NextResponse.json([...messages].reverse());
  } catch (error) {
    console.error('Debate messages fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST: Send a message and trigger AI agent responses ───

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const { content, type } = body;

    if (typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }
    if (content.length > 2000) {
      return NextResponse.json({ error: 'Please keep messages under 2,000 characters.' }, { status: 400 });
    }
    // Each message can wake several AI helpers, so cap how often one person posts.
    await rateLimit('debate-message', session.id, 40, 3600);

    // Only debates this person may see: public ones, their own, or ones they are in.
    const debate = await db.debateSession.findFirst({
      where: { id, ...debateVisibility(session.id) },
    });

    if (!debate) {
      return NextResponse.json({ error: 'Debate session not found' }, { status: 404 });
    }

    // Ensure user is a participant; create if not
    let participant = await db.debateParticipant.findUnique({
      where: {
        sessionId_userId: {
          sessionId: id,
          userId: session.id,
        },
      },
    });

    if (!participant) {
      const user = await db.user.findUnique({
        where: { id: session.id },
        select: { name: true, avatarUrl: true },
      });

      participant = await db.debateParticipant.create({
        data: {
          sessionId: id,
          userId: session.id,
          displayName: user?.name || 'A neighbour',
          avatarUrl: user?.avatarUrl || null,
          role: 'participant',
          stance: 'neutral',
        },
      });

      // Update participant count
      await db.debateSession.update({
        where: { id },
        data: { participantCount: { increment: 1 } },
      });
    }

    // Create the user's message
    const sentiment = analyzeSentiment(content);

    const userMessage = await db.debateMessage.create({
      data: {
        sessionId: id,
        participantId: participant.id,
        userId: session.id,
        content: content.trim(),
        type: type || 'statement',
        sentiment,
        metadata: '{}',
      },
      include: {
        participant: { select: { id: true, displayName: true, role: true, agentType: true } },
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Helpers no longer reply on their own: people call them from the
    // "Ask a helper" panel (POST /api/ai/debate/[id]/helper).

    // Update debate energy level based on activity
    const newEnergyLevel = Math.min(1, debate.energyLevel + 0.05);
    await db.debateSession.update({
      where: { id },
      data: {
        energyLevel: newEnergyLevel,
        status: debate.status === 'waiting' ? 'active' : debate.status,
      },
    });

    return NextResponse.json({ userMessage, aiResponses: [] }, { status: 201 });
  } catch (error) {
    return apiFailure(error);
  }
}
