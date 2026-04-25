import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const { id } = await params;

    const body = await req.json();
    const { position, reasoning, confidence } = body;

    if (!position || !['support', 'oppose', 'abstain'].includes(position)) {
      return NextResponse.json({ error: 'Position must be support, oppose, or abstain' }, { status: 400 });
    }

    // Verify legislation exists
    const legislation = await db.legislation.findUnique({ where: { id } });
    if (!legislation) return NextResponse.json({ error: 'Legislation not found' }, { status: 404 });

    // Check if user already voted
    const existingVote = await db.legislationVote.findUnique({
      where: { legislationId_userId: { legislationId: id, userId: session.id } },
    });

    if (existingVote) {
      // Update existing vote
      const oldPosition = existingVote.position;
      const vote = await db.legislationVote.update({
        where: { id: existingVote.id },
        data: {
          position,
          reasoning: reasoning || null,
          confidence: confidence || null,
        },
      });

      // Update counts on legislation if position changed
      if (oldPosition !== position) {
        // Decrement old position count
        if (oldPosition === 'support') {
          await db.legislation.update({ where: { id }, data: { supportCount: { decrement: 1 } } });
        } else if (oldPosition === 'oppose') {
          await db.legislation.update({ where: { id }, data: { opposeCount: { decrement: 1 } } });
        }
        // Increment new position count
        if (position === 'support') {
          await db.legislation.update({ where: { id }, data: { supportCount: { increment: 1 } } });
        } else if (position === 'oppose') {
          await db.legislation.update({ where: { id }, data: { opposeCount: { increment: 1 } } });
        }
      }

      return NextResponse.json({ vote, updated: true });
    }

    // Create new vote
    const vote = await db.legislationVote.create({
      data: {
        legislationId: id,
        userId: session.id,
        position,
        reasoning: reasoning || null,
        confidence: confidence || null,
      },
    });

    // Update counts on legislation
    if (position === 'support') {
      await db.legislation.update({ where: { id }, data: { supportCount: { increment: 1 } } });
    } else if (position === 'oppose') {
      await db.legislation.update({ where: { id }, data: { opposeCount: { increment: 1 } } });
    }

    return NextResponse.json({ vote }, { status: 201 });
  } catch (error) {
    console.error('Error voting on legislation:', error);
    return NextResponse.json({ error: 'Failed to vote on legislation' }, { status: 500 });
  }
}
