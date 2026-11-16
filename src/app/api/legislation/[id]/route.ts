import { NextRequest, NextResponse } from 'next/server';
import { inVisibleProcess, processVisibility } from '@/lib/visibility';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Signed-in members only.
  const viewer = await getSession();
  if (!viewer) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

  try {
    const { id } = await params;

    const legislation = await db.legislation.findFirst({
      where: { id, ...inVisibleProcess(viewer.id) },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        },
        amendments: {
          orderBy: { createdAt: 'desc' },
          include: { proposer: { select: { id: true, name: true, avatarUrl: true } } },
        },
        votes: {
          select: { id: true, position: true, reasoning: true, createdAt: true, userId: true },
        },
      },
    });

    if (!legislation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Compute vote tallies
    const supportCount = legislation.votes.filter((v) => v.position === 'support').length;
    const opposeCount = legislation.votes.filter((v) => v.position === 'oppose').length;
    const abstainCount = legislation.votes.filter((v) => v.position === 'abstain').length;

    // Check if current user has voted
    const mine = legislation.votes.find((v) => v.userId === viewer.id);
    const userVote = mine ? { id: mine.id, position: mine.position } : null;
    // Individual ballots stay on the server: only totals and your own vote go out.
    const { votes: _votes, ...publicLegislation } = legislation;
    void _votes;

    return NextResponse.json({
      legislation: publicLegislation,
      voteCounts: { support: supportCount, oppose: opposeCount, abstain: abstainCount, total: legislation.votes.length },
      userVote,
    });
  } catch (error) {
    console.error('Error fetching legislation:', error);
    return NextResponse.json({ error: 'Failed to fetch legislation' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const { id } = await params;

    // Only admin or sponsor can update status
    const existing = await db.legislation.findUnique({ where: { id }, select: { sponsorId: true, createdBy: true } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isAdmin = session.role === 'admin' || session.role === 'super_admin';
    const isSponsor = existing.sponsorId === session.id || existing.createdBy === session.id;
    if (!isAdmin && !isSponsor) {
      return NextResponse.json({ error: 'Only admins or sponsors can update legislation status' }, { status: 403 });
    }

    const body = await req.json();
    const { status, sponsorName, fullText, votingOpensAt, votingClosesAt } = body;

    const data: Record<string, unknown> = {};
    if (status) {
      data.status = status;
      if (status === 'enacted') data.enactedAt = new Date();
    }
    if (sponsorName !== undefined) data.sponsorName = sponsorName;
    if (fullText !== undefined) data.fullText = fullText;
    if (votingOpensAt !== undefined) data.votingOpensAt = votingOpensAt ? new Date(votingOpensAt) : null;
    if (votingClosesAt !== undefined) data.votingClosesAt = votingClosesAt ? new Date(votingClosesAt) : null;

    const legislation = await db.legislation.update({
      where: { id },
      data,
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ legislation });
  } catch (error) {
    console.error('Error updating legislation:', error);
    return NextResponse.json({ error: 'Failed to update legislation' }, { status: 500 });
  }
}
