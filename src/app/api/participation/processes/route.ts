import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const phase = searchParams.get('phase');
    const scope = searchParams.get('scope');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (phase) where.currentPhase = phase;
    if (scope) where.scope = scope;
    if (status === 'active') {
      where.currentPhase = { not: 'closed' };
      where.isPublic = true;
    } else if (status === 'closed') {
      where.currentPhase = 'closed';
    }

    const [processes, total] = await Promise.all([
      db.participatoryProcess.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true, avatarUrl: true } },
          organization: { select: { id: true, name: true, slug: true } },
          _count: {
            select: {
              processProposals: true,
              budgetProjects: true,
              milestones: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.participatoryProcess.count({ where }),
    ]);

    // Compute participant counts and stats
    const processIds = processes.map((p) => p.id);

    const proposalCounts = await db.processProposal.groupBy({
      by: ['processId'],
      where: { processId: { in: processIds } },
      _count: { id: true },
    });

    const endorsementCounts = await db.proposalEndorsement.groupBy({
      by: ['proposalId'],
      where: {
        proposal: { processId: { in: processIds } },
      },
      _count: { id: true },
    });

    const proposalEndorsementMap = new Map(
      endorsementCounts.map((e) => [e.proposalId, e._count.id])
    );

    // Get unique endorsers per process
    const uniqueEndorsers = await db.proposalEndorsement.findMany({
      where: { proposal: { processId: { in: processIds } } },
      select: { userId: true, proposal: { select: { processId: true } } },
    });

    const participantMap = new Map<string, Set<string>>();
    uniqueEndorsers.forEach((e) => {
      const pid = e.proposal.processId;
      if (!participantMap.has(pid)) participantMap.set(pid, new Set());
      participantMap.get(pid)!.add(e.userId);
    });

    // Get budget allocated per process
    const budgetVotes = await db.budgetVote.findMany({
      where: { project: { processId: { in: processIds } } },
      select: { amount: true, project: { select: { processId: true } } },
    });

    const budgetMap = new Map<string, number>();
    budgetVotes.forEach((v) => {
      const pid = v.project.processId;
      budgetMap.set(pid, (budgetMap.get(pid) || 0) + v.amount);
    });

    const enriched = processes.map((p) => {
      const proposalCount =
        proposalCounts.find((c) => c.processId === p.id)?._count.id || 0;
      const participants = participantMap.get(p.id)?.size || 0;
      const budgetAllocated = budgetMap.get(p.id) || 0;

      return {
        ...p,
        proposalCount,
        participantCount: participants,
        budgetAllocated,
      };
    });

    return NextResponse.json({
      processes: enriched,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching processes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch processes' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      shortDescription,
      organizationId,
      scope,
      category,
      totalBudget,
      currency,
      startsAt,
      endsAt,
      phases,
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') +
      '-' + Date.now().toString(36);

    const defaultPhases = phases || [
      { id: 'information', name: 'Information', status: 'active', startAt: startsAt || null, endAt: null },
      { id: 'proposal', name: 'Proposal', status: 'upcoming', startAt: null, endAt: null },
      { id: 'deliberation', name: 'Deliberation', status: 'upcoming', startAt: null, endAt: null },
      { id: 'voting', name: 'Voting', status: 'upcoming', startAt: null, endAt: null },
      { id: 'implementation', name: 'Implementation', status: 'upcoming', startAt: null, endAt: null },
      { id: 'evaluation', name: 'Evaluation', status: 'upcoming', startAt: null, endAt: null },
    ];

    const process = await db.participatoryProcess.create({
      data: {
        slug,
        title,
        description,
        shortDescription,
        organizationId,
        scope: scope || 'city',
        category,
        currentPhase: 'information',
        phases: JSON.stringify(defaultPhases),
        totalBudget: totalBudget || 0,
        currency: currency || 'USD',
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        createdBy: session.id,
      },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        organization: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ process }, { status: 201 });
  } catch (error) {
    console.error('Error creating process:', error);
    return NextResponse.json(
      { error: 'Failed to create process' },
      { status: 500 }
    );
  }
}
