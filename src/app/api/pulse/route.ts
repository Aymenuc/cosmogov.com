import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  // Auth optional for pulse data, but we check if logged in

  try {
    // Get real proposals data
    const [activeProposals, recentVotes, totalVotes, totalUsers] = await Promise.all([
      db.proposal.findMany({
        where: { status: 'active' },
        select: { id: true, title: true, status: true, votes: { select: { option: true } }, createdAt: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      db.vote.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: { id: true, option: true, createdAt: true, proposal: { select: { title: true } } },
      }),
      db.vote.count(),
      db.user.count(),
    ]);

    // Calculate sentiment based on active proposals
    let positiveVotes = 0;
    let negativeVotes = 0;
    let neutralVotes = 0;

    for (const proposal of activeProposals) {
      for (const vote of proposal.votes) {
        if (vote.option === 'yes' || vote.option === 'for') positiveVotes++;
        else if (vote.option === 'no' || vote.option === 'against') negativeVotes++;
        else neutralVotes++;
      }
    }

    const totalProposalVotes = positiveVotes + negativeVotes + neutralVotes;
    const sentimentScore = totalProposalVotes > 0
      ? Math.round((positiveVotes / totalProposalVotes) * 100)
      : 50;

    // Determine mood
    let mood = 'Neutral';
    let moodColor = '#9B5CFF';
    if (sentimentScore >= 70) { mood = 'Optimistic'; moodColor = '#2EE6C7'; }
    else if (sentimentScore >= 55) { mood = 'Cautiously Positive'; moodColor = '#FFB547'; }
    else if (sentimentScore >= 45) { mood = 'Divided'; moodColor = '#9B5CFF'; }
    else if (sentimentScore >= 30) { mood = 'Cautious'; moodColor = '#FFB547'; }
    else { mood = 'Pessimistic'; moodColor = '#FF5E8A'; }

    // Voting velocity (votes in last hour - synthetic for demo)
    const votesPerHour = Math.max(1, Math.round(totalVotes / Math.max(1, totalUsers) * 2.5));

    // Participation rate
    const participationRate = totalUsers > 0 ? Math.min(100, Math.round((totalVotes / totalUsers) * 15)) : 0;

    // Generate mock activity feed
    const activityFeed = [
      ...(recentVotes.slice(0, 8).map((v, i) => ({
        id: `vote-${v.id}`,
        type: 'vote' as const,
        description: `Vote cast on "${v.proposal.title}"`,
        detail: v.option,
        timestamp: new Date(v.createdAt).toISOString(),
      }))),
      ...(activeProposals.slice(0, 4).map((p, i) => ({
        id: `proposal-${p.id}`,
        type: 'proposal' as const,
        description: `"${p.title}" is now active`,
        detail: `${p.votes.length} votes`,
        timestamp: new Date(p.createdAt).toISOString(),
      }))),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Add synthetic events for demo
    const syntheticEvents = [
      { id: 'synth-1', type: 'pass' as const, description: 'Proposal "Budget Allocation Q2" passed with 87% approval', detail: '87%', timestamp: new Date(Date.now() - 300000).toISOString() },
      { id: 'synth-2', type: 'streak' as const, description: 'New 7-day voting streak achieved!', detail: '🔥', timestamp: new Date(Date.now() - 600000).toISOString() },
      { id: 'synth-3', type: 'vote' as const, description: '5 new votes cast in the last hour', detail: '+5', timestamp: new Date(Date.now() - 900000).toISOString() },
    ];

    return NextResponse.json({
      sentiment: {
        score: sentimentScore,
        mood,
        moodColor,
      },
      metrics: {
        activeProposals: activeProposals.length,
        totalVotes,
        votesPerHour,
        participationRate,
        totalUsers,
      },
      proposals: activeProposals.map(p => ({
        id: p.id,
        title: p.title,
        voteCount: p.votes.length,
        status: p.status,
      })),
      activityFeed: [...syntheticEvents, ...activityFeed],
    });
  } catch (error) {
    console.error('Pulse error:', error);
    return NextResponse.json({ error: 'Failed to load pulse data' }, { status: 500 });
  }
}
