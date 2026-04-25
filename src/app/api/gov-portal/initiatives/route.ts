import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (session.role !== 'gov_official' && session.role !== 'admin' && session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Government portal access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'newest';

    const where: Record<string, unknown> = {};

    if (status === 'pending') {
      where.status = 'threshold_reached';
      where.governmentResponse = null;
    } else if (status === 'responded') {
      where.governmentResponse = { not: null };
    } else if (status === 'all_pending') {
      where.status = { in: ['threshold_reached', 'government_response'] };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const orderBy: Record<string, string> = sort === 'most_signed'
      ? { signatureCount: 'desc' }
      : sort === 'oldest'
      ? { createdAt: 'asc' }
      : { createdAt: 'desc' };

    const initiatives = await db.citizenInitiative.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { signatures: true } },
      },
      orderBy,
      take: 50,
    });

    return NextResponse.json({ initiatives });
  } catch (error) {
    console.error('Error fetching gov initiatives:', error);
    return NextResponse.json({ error: 'Failed to fetch initiatives' }, { status: 500 });
  }
}
