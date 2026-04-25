import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const orgId = searchParams.get('orgId');
  const search = searchParams.get('search');
  const category = searchParams.get('category');

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (orgId) where.organizationId = orgId;
  if (search) where.title = { contains: search };
  if (category) where.category = category;

  const proposals = await db.proposal.findMany({
    where,
    include: {
      creator: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true, slug: true } },
      votes: { select: { id: true, option: true, voterId: true } },
      _count: { select: { votes: true, comments: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(proposals);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { title, description, category, votingType, options, organizationId, isAnonymous, quorum, closesAt,
      countryId, countryName, stateId, stateName, cityId, cityName, latitude, longitude } = await req.json();

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const proposal = await db.proposal.create({
      data: {
        title, description, category: category || 'general',
        votingType: votingType || 'yes_no',
        options: JSON.stringify(options || ['For', 'Against']),
        organizationId: organizationId || null,
        isAnonymous: isAnonymous || false,
        quorum: quorum || 10,
        closesAt: closesAt ? new Date(closesAt) : null,
        countryId: countryId || null,
        countryName: countryName || null,
        stateId: stateId || null,
        stateName: stateName || null,
        cityId: cityId || null,
        cityName: cityName || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        createdBy: session.id,
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    console.error('Create proposal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
