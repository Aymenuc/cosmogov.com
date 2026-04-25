import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const processId = searchParams.get('processId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (processId) where.processId = processId;
    if (status) where.status = status;

    const [milestones, total] = await Promise.all([
      db.implementationMilestone.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true, avatarUrl: true } },
          process: { select: { id: true, title: true, currentPhase: true } },
          proposal: { select: { id: true, title: true } },
          project: { select: { id: true, title: true, budgetRequested: true } },
        },
        orderBy: { dueDate: 'asc' },
        skip,
        take: limit,
      }),
      db.implementationMilestone.count({ where }),
    ]);

    // Compute transparency and on-time stats
    const allMilestones = await db.implementationMilestone.findMany({
      where: processId ? { processId } : {},
      select: {
        id: true,
        status: true,
        progress: true,
        evidence: true,
        dueDate: true,
        completedAt: true,
      },
    });

    const totalMilestones = allMilestones.length;
    const completedMilestones = allMilestones.filter((m) => m.status === 'completed').length;
    const delayedMilestones = allMilestones.filter((m) => m.status === 'delayed').length;
    const withEvidence = allMilestones.filter((m) => {
      try {
        const ev = JSON.parse(m.evidence);
        return Array.isArray(ev) && ev.length > 0;
      } catch {
        return false;
      }
    }).length;

    const onTimeCompleted = allMilestones.filter((m) => {
      if (m.status !== 'completed' || !m.dueDate || !m.completedAt) return false;
      return new Date(m.completedAt) <= new Date(m.dueDate);
    }).length;

    const transparencyScore = totalMilestones > 0 ? Math.round((withEvidence / totalMilestones) * 100) : 0;
    const onTimeRate = completedMilestones > 0 ? Math.round((onTimeCompleted / completedMilestones) * 100) : 0;
    const overallProgress = totalMilestones > 0
      ? Math.round(allMilestones.reduce((sum, m) => sum + m.progress, 0) / totalMilestones)
      : 0;

    // Group by parent entity (proposal/project)
    const entities = new Map<string, {
      id: string;
      title: string;
      type: 'proposal' | 'project';
      milestones: typeof milestones;
      overallProgress: number;
      status: string;
    }>();

    // Fetch related proposals and projects with milestones
    const proposalsWithMilestones = await db.processProposal.findMany({
      where: processId ? { processId, status: { in: ['accepted', 'implemented'] } } : { status: { in: ['accepted', 'implemented'] } },
      include: {
        milestones: {
          orderBy: { dueDate: 'asc' },
          include: {
            creator: { select: { id: true, name: true } },
          },
        },
      },
    });

    const budgetProjectsWithMilestones = await db.budgetProject.findMany({
      where: processId ? { processId, status: { in: ['approved', 'implementing', 'completed'] } } : { status: { in: ['approved', 'implementing', 'completed'] } },
      include: {
        milestones: {
          orderBy: { dueDate: 'asc' },
          include: {
            creator: { select: { id: true, name: true } },
          },
        },
      },
    });

    proposalsWithMilestones.forEach((p) => {
      const avgProgress = p.milestones.length > 0
        ? Math.round(p.milestones.reduce((s, m) => s + m.progress, 0) / p.milestones.length)
        : 0;
      const hasDelayed = p.milestones.some((m) => m.status === 'delayed');
      const allCompleted = p.milestones.length > 0 && p.milestones.every((m) => m.status === 'completed');
      entities.set(`proposal-${p.id}`, {
        id: p.id,
        title: p.title,
        type: 'proposal',
        milestones: p.milestones as unknown as typeof milestones,
        overallProgress: avgProgress,
        status: allCompleted ? 'completed' : hasDelayed ? 'delayed' : 'on_track',
      });
    });

    budgetProjectsWithMilestones.forEach((p) => {
      const avgProgress = p.milestones.length > 0
        ? Math.round(p.milestones.reduce((s, m) => s + m.progress, 0) / p.milestones.length)
        : 0;
      const hasDelayed = p.milestones.some((m) => m.status === 'delayed');
      const allCompleted = p.milestones.length > 0 && p.milestones.every((m) => m.status === 'completed');
      entities.set(`project-${p.id}`, {
        id: p.id,
        title: p.title,
        type: 'project',
        milestones: p.milestones as unknown as typeof milestones,
        overallProgress: avgProgress,
        status: allCompleted ? 'completed' : hasDelayed ? 'delayed' : 'on_track',
      });
    });

    return NextResponse.json({
      milestones,
      entities: Array.from(entities.values()),
      stats: {
        totalMilestones,
        completedMilestones,
        delayedMilestones,
        transparencyScore,
        onTimeRate,
        overallProgress,
      },
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching accountability data:', error);
    return NextResponse.json({ error: 'Failed to fetch accountability data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { processId, proposalId, projectId, title, description, dueDate } = body;

    if (!processId || !title) {
      return NextResponse.json({ error: 'Process ID and title are required' }, { status: 400 });
    }

    // Verify authorization
    const process = await db.participatoryProcess.findUnique({
      where: { id: processId },
      select: { createdBy: true },
    });

    if (!process) {
      return NextResponse.json({ error: 'Process not found' }, { status: 404 });
    }

    const isAdmin = session.role === 'admin' || session.role === 'super_admin';
    if (process.createdBy !== session.id && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const milestone = await db.implementationMilestone.create({
      data: {
        processId,
        proposalId: proposalId || null,
        projectId: projectId || null,
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdBy: session.id,
      },
      include: {
        creator: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ milestone }, { status: 201 });
  } catch (error) {
    console.error('Error creating milestone:', error);
    return NextResponse.json({ error: 'Failed to create milestone' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, progress, evidence, completedAt } = body;

    if (!id) {
      return NextResponse.json({ error: 'Milestone ID is required' }, { status: 400 });
    }

    const milestone = await db.implementationMilestone.findUnique({
      where: { id },
      include: { process: { select: { createdBy: true } } },
    });

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    const isAdmin = session.role === 'admin' || session.role === 'super_admin';
    if (milestone.process.createdBy !== session.id && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (progress !== undefined) data.progress = Math.min(100, Math.max(0, progress));
    if (evidence) data.evidence = JSON.stringify(evidence);
    if (completedAt) data.completedAt = new Date(completedAt);
    if (status === 'completed') {
      data.progress = 100;
      data.completedAt = new Date();
    }

    const updated = await db.implementationMilestone.update({
      where: { id },
      data,
      include: {
        creator: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ milestone: updated });
  } catch (error) {
    console.error('Error updating milestone:', error);
    return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 });
  }
}
