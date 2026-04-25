import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const purpose = searchParams.get('purpose');

    const where: Record<string, unknown> = {};
    if (status && status !== 'all') where.status = status;
    if (purpose && purpose !== 'all') where.purpose = purpose;

    const pools = await db.sortitionPool.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        candidates: {
          select: { id: true, status: true, userId: true, demographics: true },
        },
      },
    });

    const stats = {
      activePools: await db.sortitionPool.count({ where: { status: { in: ['recruiting', 'selection', 'selected', 'active'] } } }),
      totalCandidates: await db.sortitionCandidate.count(),
      selectedCitizens: await db.sortitionCandidate.count({ where: { status: 'selected' } }),
      activeAssemblies: await db.sortitionPool.count({ where: { status: 'active' } }),
    };

    return NextResponse.json({ pools, stats });
  } catch (error) {
    console.error('Error fetching sortition pools:', error);
    return NextResponse.json({ error: 'Failed to fetch sortition pools' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await request.json();
    const { name, description, purpose, selectionSize, criteria, demographicTargets, selectionMethod, termStartsAt, termEndsAt } = body;

    if (!name || !description) {
      return NextResponse.json({ error: 'Name and description are required' }, { status: 400 });
    }

    const pool = await db.sortitionPool.create({
      data: {
        name,
        description,
        purpose: purpose || 'citizen_assembly',
        selectionSize: selectionSize || 25,
        criteria: criteria ? JSON.stringify(criteria) : '{}',
        demographicTargets: demographicTargets ? JSON.stringify(demographicTargets) : '{}',
        selectionMethod: selectionMethod || 'stratified_random',
        termStartsAt: termStartsAt ? new Date(termStartsAt) : null,
        termEndsAt: termEndsAt ? new Date(termEndsAt) : null,
        createdBy: session.id,
      },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ pool }, { status: 201 });
  } catch (error) {
    console.error('Error creating sortition pool:', error);
    return NextResponse.json({ error: 'Failed to create sortition pool' }, { status: 500 });
  }
}
