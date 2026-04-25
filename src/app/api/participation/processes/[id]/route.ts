import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const process = await db.participatoryProcess.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        organization: { select: { id: true, name: true, slug: true, avatarUrl: true } },
        processProposals: {
          include: {
            creator: { select: { id: true, name: true, avatarUrl: true } },
            _count: { select: { endorsements: true, comments: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        budgetProjects: {
          include: {
            creator: { select: { id: true, name: true, avatarUrl: true } },
            _count: { select: { budgetVotes: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        milestones: {
          orderBy: { dueDate: 'asc' },
        },
        meetings: {
          orderBy: { startsAt: 'desc' },
          take: 5,
        },
        assemblies: {
          include: {
            _count: { select: { members: true } },
          },
        },
        initiatives: {
          where: { status: 'collecting' },
          take: 5,
        },
      },
    });

    if (!process) {
      return NextResponse.json({ error: 'Process not found' }, { status: 404 });
    }

    // Compute participant stats
    const uniqueEndorsers = await db.proposalEndorsement.findMany({
      where: { proposal: { processId: id } },
      select: { userId: true },
    });
    const uniqueVoters = await db.budgetVote.findMany({
      where: { project: { processId: id } },
      select: { userId: true },
    });
    const uniqueCommenters = await db.processComment.findMany({
      where: { proposal: { processId: id } },
      select: { authorId: true },
    });

    const participantSet = new Set<string>();
    uniqueEndorsers.forEach((e) => participantSet.add(e.userId));
    uniqueVoters.forEach((v) => participantSet.add(v.userId));
    uniqueCommenters.forEach((c) => participantSet.add(c.authorId));

    const totalBudgetAllocated = process.budgetProjects.reduce(
      (sum, bp) => sum + bp.budgetApproved,
      0
    );

    return NextResponse.json({
      process: {
        ...process,
        participantCount: participantSet.size,
        totalBudgetAllocated,
      },
    });
  } catch (error) {
    console.error('Error fetching process:', error);
    return NextResponse.json(
      { error: 'Failed to fetch process' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await db.participatoryProcess.findUnique({
      where: { id },
      select: { createdBy: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Process not found' }, { status: 404 });
    }

    const isAdmin = session.role === 'admin' || session.role === 'super_admin';
    if (existing.createdBy !== session.id && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await req.json();
    const allowedFields = [
      'title', 'description', 'shortDescription', 'scope', 'category',
      'currentPhase', 'phases', 'totalBudget', 'currency', 'isPublic',
      'allowProposals', 'allowComments', 'bannerUrl', 'startsAt', 'endsAt',
    ];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'phases') {
          data[field] = JSON.stringify(body[field]);
        } else if (field === 'startsAt' || field === 'endsAt') {
          data[field] = body[field] ? new Date(body[field]) : null;
        } else {
          data[field] = body[field];
        }
      }
    }

    const updated = await db.participatoryProcess.update({
      where: { id },
      data,
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ process: updated });
  } catch (error) {
    console.error('Error updating process:', error);
    return NextResponse.json(
      { error: 'Failed to update process' },
      { status: 500 }
    );
  }
}
