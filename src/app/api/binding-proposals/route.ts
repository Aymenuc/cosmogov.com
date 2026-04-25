import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const type = searchParams.get('type');

    const where: Record<string, unknown> = {};
    if (status && status !== 'all') where.status = status;
    if (category && category !== 'all') where.category = category;
    if (type && type !== 'all') where.type = type;

    const proposals = await db.bindingProposal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        signatures: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            comment: true,
            createdAt: true,
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        _count: { select: { signatures: true } },
      },
    });

    const stats = {
      activeProposals: await db.bindingProposal.count({
        where: { status: { in: ['collecting', 'threshold_reached', 'government_review', 'government_response', 'scheduled_vote'] } },
      }),
      totalSignatures: await db.bindingProposalSignature.count(),
      governmentResponses: await db.bindingProposal.count({
        where: { status: { in: ['government_response', 'scheduled_vote', 'passed', 'enacted'] } },
      }),
      enacted: await db.bindingProposal.count({ where: { status: 'enacted' } }),
    };

    return NextResponse.json({ proposals, stats });
  } catch (error) {
    console.error('Error fetching binding proposals:', error);
    return NextResponse.json({ error: 'Failed to fetch binding proposals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await request.json();
    const {
      title,
      description,
      category,
      type,
      signatureGoal,
      legalReference,
      impactAssessment,
      responseDeadline,
      closesAt,
      processId,
    } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const proposal = await db.bindingProposal.create({
      data: {
        title,
        description,
        category: category || null,
        type: type || 'binding_proposal',
        signatureGoal: signatureGoal || 5000,
        legalReference: legalReference || null,
        impactAssessment: impactAssessment || null,
        responseDeadline: responseDeadline ? new Date(responseDeadline) : null,
        closesAt: closesAt ? new Date(closesAt) : null,
        processId: processId || null,
        isBinding: true,
        createdBy: session.id,
      },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ proposal }, { status: 201 });
  } catch (error) {
    console.error('Error creating binding proposal:', error);
    return NextResponse.json({ error: 'Failed to create binding proposal' }, { status: 500 });
  }
}
