import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';

    const where: Record<string, unknown> = {};

    if (status && status !== 'all') {
      if (status === 'active') {
        where.status = { in: ['draft', 'review', 'public_comment', 'amendment', 'voting'] };
      } else {
        where.status = status;
      }
    }
    if (category && category !== 'all') where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { billNumber: { contains: search } },
      ];
    }

    const orderBy: Record<string, string> =
      sort === 'most_commented' ? { commentCount: 'desc' } :
      sort === 'most_voted' ? { supportCount: 'desc' } :
      { createdAt: 'desc' };

    const legislation = await db.legislation.findMany({
      where,
      orderBy,
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { comments: true, amendments: true, votes: true } },
        votes: { select: { position: true } },
      },
      take: 50,
    });

    // Compute support/oppose counts
    const legislationWithCounts = legislation.map((bill) => {
      const supportCount = bill.votes.filter((v) => v.position === 'support').length;
      const opposeCount = bill.votes.filter((v) => v.position === 'oppose').length;
      const { votes: _, ...rest } = bill;
      return { ...rest, voteSupportCount: supportCount, voteOpposeCount: opposeCount };
    });

    // Stats
    const stats = {
      totalBills: await db.legislation.count(),
      inPublicComment: await db.legislation.count({ where: { status: 'public_comment' } }),
      amendmentsSubmitted: await db.legislationAmendment.count(),
      enacted: await db.legislation.count({ where: { status: 'enacted' } }),
    };

    return NextResponse.json({ legislation: legislationWithCounts, stats });
  } catch (error) {
    console.error('Error fetching legislation:', error);
    return NextResponse.json({ error: 'Failed to fetch legislation' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await req.json();
    const {
      title,
      description,
      billNumber,
      category,
      sponsorName,
      fullText,
      processId,
      quorumRequired,
      votingOpensAt,
      votingClosesAt,
    } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const legislation = await db.legislation.create({
      data: {
        title,
        description,
        billNumber: billNumber || null,
        status: 'draft',
        category: category || null,
        sponsorName: sponsorName || session.name || null,
        sponsorId: session.id,
        fullText: fullText || null,
        processId: processId || null,
        quorumRequired: quorumRequired || 100,
        votingOpensAt: votingOpensAt ? new Date(votingOpensAt) : null,
        votingClosesAt: votingClosesAt ? new Date(votingClosesAt) : null,
        createdBy: session.id,
      },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ legislation }, { status: 201 });
  } catch (error) {
    console.error('Error creating legislation:', error);
    return NextResponse.json({ error: 'Failed to create legislation' }, { status: 500 });
  }
}
