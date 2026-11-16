import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { slug } = await params;

  const org = await db.organization.findUnique({
    where: { slug },
    include: {
      memberships: { orderBy: { joinedAt: 'asc' }, include: { user: { select: { id: true, name: true } } } },
      proposals: { include: { _count: { select: { votes: true } } }, orderBy: { createdAt: 'desc' }, take: 10 },
      _count: { select: { memberships: true, proposals: true } },
    },
  });

  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  // Who belongs to a community is personal (it can reveal beliefs or where
  // someone lives): only its own members get the list.
  const myRole = org.memberships.find((m) => m.userId === session.id)?.role ?? null;
  const isMember = Boolean(myRole);
  return NextResponse.json({ ...org, isMember, myRole, memberships: isMember ? org.memberships : [] });
}
