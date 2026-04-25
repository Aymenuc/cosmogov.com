import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { id } = await params;

  const proposal = await db.proposal.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true, slug: true } },
      votes: { include: { voter: { select: { id: true, name: true } } } },
      comments: { include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
    },
  });

  if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(proposal);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { id } = await params;

  const data = await req.json();
  const proposal = await db.proposal.update({ where: { id }, data });
  return NextResponse.json(proposal);
}
