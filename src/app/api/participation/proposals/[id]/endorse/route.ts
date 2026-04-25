import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { type, reason } = body;

    if (!type || !['support', 'oppose', 'neutral'].includes(type)) {
      return NextResponse.json({ error: 'Type must be support, oppose, or neutral' }, { status: 400 });
    }

    // Check proposal exists
    const proposal = await db.processProposal.findUnique({
      where: { id },
      select: { id: true, processId: true, status: true },
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Upsert endorsement
    const existing = await db.proposalEndorsement.findUnique({
      where: { proposalId_userId: { proposalId: id, userId: session.id } },
    });

    if (existing) {
      if (existing.type === type) {
        // Remove endorsement (toggle off)
        await db.proposalEndorsement.delete({
          where: { id: existing.id },
        });

        // Update counts
        const supportDelta = type === 'support' ? -1 : 0;
        const oppositionDelta = type === 'oppose' ? -1 : 0;
        await db.processProposal.update({
          where: { id },
          data: {
            supportCount: { increment: supportDelta },
            oppositionCount: { increment: oppositionDelta },
          },
        });

        return NextResponse.json({ action: 'removed', type });
      } else {
        // Change endorsement type
        const oldType = existing.type;
        await db.proposalEndorsement.update({
          where: { id: existing.id },
          data: { type, reason: reason || null },
        });

        // Update counts
        const supportDelta = (type === 'support' ? 1 : 0) - (oldType === 'support' ? 1 : 0);
        const oppositionDelta = (type === 'oppose' ? 1 : 0) - (oldType === 'oppose' ? 1 : 0);
        await db.processProposal.update({
          where: { id },
          data: {
            supportCount: { increment: supportDelta },
            oppositionCount: { increment: oppositionDelta },
          },
        });

        return NextResponse.json({ action: 'updated', from: oldType, to: type });
      }
    } else {
      // Create new endorsement
      await db.proposalEndorsement.create({
        data: {
          proposalId: id,
          userId: session.id,
          type,
          reason: reason || null,
        },
      });

      const supportDelta = type === 'support' ? 1 : 0;
      const oppositionDelta = type === 'oppose' ? 1 : 0;
      await db.processProposal.update({
        where: { id },
        data: {
          supportCount: { increment: supportDelta },
          oppositionCount: { increment: oppositionDelta },
        },
      });

      return NextResponse.json({ action: 'created', type }, { status: 201 });
    }
  } catch (error) {
    console.error('Error endorsing proposal:', error);
    return NextResponse.json({ error: 'Failed to endorse proposal' }, { status: 500 });
  }
}
