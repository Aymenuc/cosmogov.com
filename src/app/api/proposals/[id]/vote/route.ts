import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { id } = await params;

  const { option, confidence, reasoning } = await req.json();
  if (!option) return NextResponse.json({ error: 'Option is required' }, { status: 400 });

  // Check if already voted
  const existing = await db.vote.findUnique({ where: { proposalId_voterId: { proposalId: id, voterId: session.id } } });
  if (existing) {
    // Update vote
    const vote = await db.vote.update({ where: { id: existing.id }, data: { option, confidence, reasoning } });
    return NextResponse.json(vote);
  }

  const vote = await db.vote.create({
    data: { proposalId: id, voterId: session.id, option, confidence, reasoning },
  });

  // Award XP
  await db.user.update({ where: { id: session.id }, data: { totalXp: { increment: 10 } } });

  return NextResponse.json(vote, { status: 201 });
}
