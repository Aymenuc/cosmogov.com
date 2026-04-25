import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';

    const where: Record<string, unknown> = {};

    if (type && type !== 'all') where.type = type;
    if (status && status !== 'all') where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const orderBy: Record<string, string> =
      sort === 'most_signed' ? { signatureCount: 'desc' } :
      sort === 'closing_soon' ? { closesAt: 'asc' } :
      { createdAt: 'desc' };

    const initiatives = await db.citizenInitiative.findMany({
      where,
      orderBy,
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        signatures: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, comment: true, createdAt: true, user: { select: { id: true, name: true, avatarUrl: true } } },
        },
        _count: { select: { signatures: true } },
      },
    });

    const stats = {
      activeInitiatives: await db.citizenInitiative.count({ where: { status: { in: ['collecting', 'threshold_reached'] } } }),
      totalSignatures: await db.initiativeSignature.count(),
      thresholdsReached: await db.citizenInitiative.count({ where: { status: { in: ['threshold_reached', 'government_response', 'voting', 'enacted'] } } }),
      enactedPolicies: await db.citizenInitiative.count({ where: { status: 'enacted' } }),
    };

    return NextResponse.json({ initiatives, stats });
  } catch (error) {
    console.error('Error fetching initiatives:', error);
    return NextResponse.json({ error: 'Failed to fetch initiatives' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await request.json();
    const { title, description, type, signatureGoal, closesAt, processId } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const initiative = await db.citizenInitiative.create({
      data: {
        title,
        description,
        type: type || 'petition',
        signatureGoal: signatureGoal || 1000,
        closesAt: closesAt ? new Date(closesAt) : null,
        processId: processId || null,
        createdBy: session.id,
      },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ initiative }, { status: 201 });
  } catch (error) {
    console.error('Error creating initiative:', error);
    return NextResponse.json({ error: 'Failed to create initiative' }, { status: 500 });
  }
}
