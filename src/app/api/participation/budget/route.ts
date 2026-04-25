import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const processId = searchParams.get('processId');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (processId) where.processId = processId;
    if (category) where.category = category;
    if (status) where.status = status;

    const [projects, total] = await Promise.all([
      db.budgetProject.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true, avatarUrl: true } },
          process: { select: { id: true, title: true, totalBudget: true, currency: true, currentPhase: true } },
          budgetVotes: {
            select: { amount: true, userId: true },
          },
          _count: { select: { budgetVotes: true, milestones: true } },
        },
        orderBy: { voteCount: 'desc' },
        skip,
        take: limit,
      }),
      db.budgetProject.count({ where }),
    ]);

    // Compute total allocated per project
    const enriched = projects.map((p) => {
      const totalAllocated = p.budgetVotes.reduce((sum, v) => sum + v.amount, 0);
      return {
        ...p,
        totalAllocated,
        voterCount: p._count.budgetVotes,
      };
    });

    // Compute overall budget pool if processId specified
    let budgetPool = null;
    if (processId) {
      const process = await db.participatoryProcess.findUnique({
        where: { id: processId },
        select: { totalBudget: true, currency: true },
      });
      if (process) {
        const allProjects = await db.budgetProject.findMany({
          where: { processId },
          include: { budgetVotes: { select: { amount: true } } },
        });
        const totalAllocated = allProjects.reduce(
          (sum, bp) => sum + bp.budgetVotes.reduce((s, v) => s + v.amount, 0),
          0
        );
        budgetPool = {
          total: process.totalBudget,
          currency: process.currency,
          allocated: totalAllocated,
          remaining: process.totalBudget - totalAllocated,
        };
      }
    }

    return NextResponse.json({
      projects: enriched,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      budgetPool,
    });
  } catch (error) {
    console.error('Error fetching budget projects:', error);
    return NextResponse.json({ error: 'Failed to fetch budget projects' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, amount } = body;

    if (!projectId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Project ID and positive amount are required' }, { status: 400 });
    }

    // Check project exists and is open for voting
    const project = await db.budgetProject.findUnique({
      where: { id: projectId },
      include: {
        process: { select: { id: true, totalBudget: true, currentPhase: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.process.currentPhase !== 'voting' && project.process.currentPhase !== 'proposal') {
      return NextResponse.json({ error: 'Voting is not open for this process' }, { status: 403 });
    }

    // Upsert vote
    const existing = await db.budgetVote.findUnique({
      where: { projectId_userId: { projectId, userId: session.id } },
    });

    if (existing) {
      const diff = amount - existing.amount;
      await db.budgetVote.update({
        where: { id: existing.id },
        data: { amount },
      });

      // Update project vote count only if this is a new voter (shouldn't happen due to unique constraint)
      return NextResponse.json({ vote: { ...existing, amount }, action: 'updated', diff });
    } else {
      const vote = await db.budgetVote.create({
        data: {
          projectId,
          userId: session.id,
          amount,
        },
      });

      // Update project vote count
      await db.budgetProject.update({
        where: { id: projectId },
        data: { voteCount: { increment: 1 } },
      });

      return NextResponse.json({ vote, action: 'created' }, { status: 201 });
    }
  } catch (error) {
    console.error('Error casting budget vote:', error);
    return NextResponse.json({ error: 'Failed to cast budget vote' }, { status: 500 });
  }
}
