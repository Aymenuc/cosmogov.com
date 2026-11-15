import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiFailure, apiUser } from '@/lib/api-server';
import { proposalVisibility } from '@/lib/proposals-server';

const DAY = 24 * 60 * 60 * 1000;

/**
 * The community's pulse, counted from real records the person may see.
 * Totals only: no individual ballot choice leaves the server, and nothing
 * here is simulated.
 */
export async function GET() {
  try {
    const user = await apiUser();
    const visible = proposalVisibility(user.id);
    const now = Date.now();
    const since24h = new Date(now - DAY);
    const since7d = new Date(now - 7 * DAY);

    const [activeCount, activeProposals, ballotsLast24h, leaning, voters, recentBallots, recentlyClosed] =
      await Promise.all([
        db.proposal.count({ where: { ...visible, status: 'active' } }),
        db.proposal.findMany({
          where: { ...visible, status: 'active' },
          select: { id: true, title: true, status: true, createdAt: true, _count: { select: { votes: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        db.vote.count({ where: { createdAt: { gte: since24h }, proposal: visible } }),
        db.vote.groupBy({
          by: ['option'],
          where: { proposal: { ...visible, status: 'active' } },
          _count: { _all: true },
        }),
        db.vote.findMany({
          where: { createdAt: { gte: since7d }, proposal: visible },
          distinct: ['voterId'],
          select: { voterId: true },
        }),
        db.vote.groupBy({
          by: ['proposalId'],
          where: { createdAt: { gte: since24h }, proposal: visible },
          _count: { _all: true },
          _max: { createdAt: true },
          orderBy: { _max: { createdAt: 'desc' } },
          take: 8,
        }),
        db.proposal.findMany({
          where: { ...visible, status: 'closed', updatedAt: { gte: since7d } },
          select: { id: true, title: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
          take: 4,
        }),
      ]);

    // Leaning on open proposals: share of "for" among their ballots.
    let forVotes = 0;
    let againstVotes = 0;
    let otherVotes = 0;
    for (const row of leaning) {
      const n = row._count._all;
      if (row.option === 'yes' || row.option === 'for') forVotes += n;
      else if (row.option === 'no' || row.option === 'against') againstVotes += n;
      else otherVotes += n;
    }
    const totalOpen = forVotes + againstVotes + otherVotes;
    const score = totalOpen > 0 ? Math.round((forVotes / totalOpen) * 100) : 50;
    const mood =
      totalOpen === 0 ? 'No ballots yet' : score >= 60 ? 'Mostly for' : score <= 40 ? 'Mostly against' : 'Split';

    const titles = new Map(
      (
        await db.proposal.findMany({
          where: { id: { in: recentBallots.map((r) => r.proposalId) } },
          select: { id: true, title: true },
        })
      ).map((p) => [p.id, p.title]),
    );

    const activityFeed = [
      ...recentBallots.map((r) => ({
        id: `ballots-${r.proposalId}`,
        type: 'vote' as const,
        description: `${r._count._all} ${r._count._all === 1 ? 'ballot' : 'ballots'} cast on "${titles.get(r.proposalId) ?? 'a proposal'}" today`,
        detail: `+${r._count._all}`,
        timestamp: (r._max.createdAt ?? new Date()).toISOString(),
      })),
      ...activeProposals.slice(0, 4).map((p) => ({
        id: `proposal-${p.id}`,
        type: 'proposal' as const,
        description: `"${p.title}" is open for votes`,
        detail: `${p._count.votes} ${p._count.votes === 1 ? 'ballot' : 'ballots'}`,
        timestamp: p.createdAt.toISOString(),
      })),
      ...recentlyClosed.map((p) => ({
        id: `closed-${p.id}`,
        type: 'pass' as const,
        description: `"${p.title}" closed`,
        detail: 'Closed',
        timestamp: p.updatedAt.toISOString(),
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      sentiment: { score, mood },
      metrics: {
        activeProposals: activeCount,
        ballotsLast24h,
        votersLast7d: voters.length,
      },
      proposals: activeProposals.map((p) => ({
        id: p.id,
        title: p.title,
        voteCount: p._count.votes,
        status: p.status,
      })),
      activityFeed,
    });
  } catch (error) {
    return apiFailure(error);
  }
}
