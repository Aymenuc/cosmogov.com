import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const processId = searchParams.get('processId');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (processId) where.processId = processId;
    if (status) where.status = status;
    if (category) where.category = category;

    const [proposals, total] = await Promise.all([
      db.processProposal.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true, avatarUrl: true } },
          process: { select: { id: true, title: true, slug: true, currentPhase: true } },
          _count: { select: { endorsements: true, comments: true, milestones: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.processProposal.count({ where }),
    ]);

    // Get endorsement breakdown for each proposal
    const proposalIds = proposals.map((p) => p.id);
    const endorsements = await db.proposalEndorsement.groupBy({
      by: ['proposalId', 'type'],
      where: { proposalId: { in: proposalIds } },
      _count: { id: true },
    });

    const endorsementMap = new Map<string, { support: number; oppose: number; neutral: number }>();
    endorsements.forEach((e) => {
      if (!endorsementMap.has(e.proposalId)) {
        endorsementMap.set(e.proposalId, { support: 0, oppose: 0, neutral: 0 });
      }
      const map = endorsementMap.get(e.proposalId)!;
      map[e.type as keyof typeof map] = e._count.id;
    });

    const enriched = proposals.map((p) => ({
      ...p,
      endorsementBreakdown: endorsementMap.get(p.id) || { support: 0, oppose: 0, neutral: 0 },
    }));

    return NextResponse.json({ proposals: enriched, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { processId, title, description, category, budgetRequested, mapLatitude, mapLongitude, mapAddress } = body;

    if (!processId || !title || !description) {
      return NextResponse.json({ error: 'Process ID, title, and description are required' }, { status: 400 });
    }

    // Check if process allows proposals
    const process = await db.participatoryProcess.findUnique({
      where: { id: processId },
      select: { allowProposals: true, currentPhase: true },
    });

    if (!process) {
      return NextResponse.json({ error: 'Process not found' }, { status: 404 });
    }

    if (!process.allowProposals) {
      return NextResponse.json({ error: 'This process does not accept proposals' }, { status: 403 });
    }

    if (process.currentPhase === 'closed') {
      return NextResponse.json({ error: 'This process is closed' }, { status: 403 });
    }

    const proposal = await db.processProposal.create({
      data: {
        processId,
        title,
        description,
        category,
        budgetRequested: budgetRequested || null,
        mapLatitude: mapLatitude || null,
        mapLongitude: mapLongitude || null,
        mapAddress: mapAddress || null,
        status: 'published',
        createdBy: session.id,
      },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ proposal }, { status: 201 });
  } catch (error) {
    console.error('Error creating proposal:', error);
    return NextResponse.json({ error: 'Failed to create proposal' }, { status: 500 });
  }
}
