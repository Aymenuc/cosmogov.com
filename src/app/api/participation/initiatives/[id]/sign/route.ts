import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { comment } = body;

    const initiative = await db.citizenInitiative.findUnique({ where: { id } });
    if (!initiative) return NextResponse.json({ error: 'Initiative not found' }, { status: 404 });

    if (initiative.status === 'enacted' || initiative.status === 'rejected' || initiative.status === 'expired') {
      return NextResponse.json({ error: 'This initiative is no longer accepting signatures' }, { status: 400 });
    }

    const existing = await db.initiativeSignature.findUnique({
      where: { initiativeId_userId: { initiativeId: id, userId: session.id } },
    });

    if (existing) return NextResponse.json({ error: 'You have already signed this initiative' }, { status: 409 });

    const signature = await db.initiativeSignature.create({
      data: {
        initiativeId: id,
        userId: session.id,
        comment: comment || null,
      },
    });

    const newCount = initiative.signatureCount + 1;
    const newStatus = newCount >= initiative.signatureGoal && initiative.status === 'collecting'
      ? 'threshold_reached'
      : initiative.status;

    await db.citizenInitiative.update({
      where: { id },
      data: { signatureCount: newCount, status: newStatus },
    });

    return NextResponse.json({
      signature,
      signatureCount: newCount,
      thresholdReached: newStatus === 'threshold_reached',
    }, { status: 201 });
  } catch (error) {
    console.error('Error signing initiative:', error);
    return NextResponse.json({ error: 'Failed to sign initiative' }, { status: 500 });
  }
}
