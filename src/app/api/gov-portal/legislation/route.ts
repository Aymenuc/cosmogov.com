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

    const where: Record<string, unknown> = {};

    if (status === 'review') {
      where.status = 'review';
    } else if (status === 'public_comment') {
      where.status = 'public_comment';
    } else if (status === 'amendment') {
      where.status = 'amendment';
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { billNumber: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const legislation = await db.legislation.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true } },
        _count: { select: { comments: true, amendments: true, votes: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ legislation });
  } catch (error) {
    console.error('Error fetching gov legislation:', error);
    return NextResponse.json({ error: 'Failed to fetch legislation' }, { status: 500 });
  }
}
