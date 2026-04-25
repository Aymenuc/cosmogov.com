import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { comment } = body;

    const proposal = await db.bindingProposal.findUnique({ where: { id } });
    if (!proposal) {
      return NextResponse.json({ error: 'Binding proposal not found' }, { status: 404 });
    }

    if (proposal.status !== 'collecting') {
      return NextResponse.json({ error: 'This proposal is no longer collecting signatures' }, { status: 400 });
    }

    // Check if already signed — one signature per user
    const existing = await db.bindingProposalSignature.findUnique({
      where: { proposalId_userId: { proposalId: id, userId: session.id } },
    });
    if (existing) {
      return NextResponse.json({ error: 'You have already signed this proposal' }, { status: 409 });
    }

    // Create signature
    const signature = await db.bindingProposalSignature.create({
      data: {
        proposalId: id,
        userId: session.id,
        comment: comment || null,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Increment signature count
    const updated = await db.bindingProposal.update({
      where: { id },
      data: { signatureCount: { increment: 1 } },
    });

    // Auto-update status to threshold_reached if signatureGoal met
    let thresholdReached = false;
    if (updated.signatureCount >= updated.signatureGoal && updated.status === 'collecting') {
      await db.bindingProposal.update({
        where: { id },
        data: { status: 'threshold_reached' },
      });
      thresholdReached = true;
    }

    return NextResponse.json({ signature, thresholdReached }, { status: 201 });
  } catch (error) {
    console.error('Error signing binding proposal:', error);
    return NextResponse.json({ error: 'Failed to sign proposal' }, { status: 500 });
  }
}
