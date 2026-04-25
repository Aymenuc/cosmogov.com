import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const memberships = await db.membership.findMany({
    where: { userId: session.id },
    include: {
      organization: {
        include: {
          _count: { select: { memberships: true, proposals: true } },
        },
      },
    },
  });

  const orgs = memberships.map(m => ({
    ...m.organization,
    role: m.role,
    memberCount: m.organization._count.memberships,
    proposalCount: m.organization._count.proposals,
  }));

  return NextResponse.json(orgs);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { name, slug, description } = await req.json();
    if (!name || !slug) return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });

    const existing = await db.organization.findUnique({ where: { slug } });
    if (existing) return NextResponse.json({ error: 'Slug already taken' }, { status: 409 });

    const org = await db.organization.create({
      data: { name, slug, description: description || null, createdBy: session.id },
    });

    await db.membership.create({
      data: { userId: session.id, organizationId: org.id, role: 'admin' },
    });

    return NextResponse.json(org, { status: 201 });
  } catch (error) {
    console.error('Create org error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
