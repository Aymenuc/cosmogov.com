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
      memberships: { include: { user: { select: { id: true, name: true } } } },
      proposals: { include: { _count: { select: { votes: true } } }, orderBy: { createdAt: 'desc' }, take: 10 },
      _count: { select: { memberships: true, proposals: true } },
    },
  });

  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  // Who belongs to a community is personal (it can reveal beliefs or where
  // someone lives): only its own members get the list.
  const isMember = org.memberships.some((m) => m.userId === session.id);
  return NextResponse.json({ ...org, isMember, memberships: isMember ? org.memberships : [] });
}
