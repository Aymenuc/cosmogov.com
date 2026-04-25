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
      memberships: { include: { user: { select: { id: true, name: true, email: true, totalXp: true, level: true } } } },
      proposals: { include: { _count: { select: { votes: true } } }, orderBy: { createdAt: 'desc' }, take: 10 },
      _count: { select: { memberships: true, proposals: true } },
    },
  });

  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(org);
}
