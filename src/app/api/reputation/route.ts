import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

function getTier(score: number): string {
  if (score <= 200) return 'Stardust';
  if (score <= 400) return 'Nova';
  if (score <= 600) return 'Pulsar';
  if (score <= 800) return 'Quasar';
  return 'Nebula';
}

function getTierColor(tier: string): string {
  switch (tier) {
    case 'Stardust': return '#A7B3D6';
    case 'Nova': return '#2EE6C7';
    case 'Pulsar': return '#9B5CFF';
    case 'Quasar': return '#FFB547';
    case 'Nebula': return '#FF5E8A';
    default: return '#A7B3D6';
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const userId = session.id;

    // Gather user activity data
    const [votes, proposals, comments, gameResults, user] = await Promise.all([
      db.vote.findMany({ where: { voterId: userId }, include: { proposal: { include: { votes: true } } } }),
      db.proposal.findMany({ where: { createdBy: userId } }),
      db.comment.findMany({ where: { authorId: userId } }),
      db.gameResult.findMany({ where: { userId } }),
      db.user.findUnique({ where: { id: userId }, select: { streak: true, totalXp: true, level: true, createdAt: true } }),
    ]);

    // --- Calculate Scores ---

    // 1. Participation Score (0-100): based on votes, proposals, comments
    const voteCount = votes.length;
    const proposalCount = proposals.length;
    const commentCount = comments.length;
    const participationRaw = Math.min(100, (voteCount * 3) + (proposalCount * 10) + (commentCount * 2));
    const participationScore = Math.round(participationRaw * 100) / 100;

    // 2. Quality Score (0-100): how often votes align with majority
    let majorityAlignCount = 0;
    for (const vote of votes) {
      const proposalVotes = vote.proposal.votes;
      if (proposalVotes.length < 2) continue;
      // Count votes per option
      const optionCounts: Record<string, number> = {};
      for (const v of proposalVotes) {
        optionCounts[v.option] = (optionCounts[v.option] || 0) + 1;
      }
      // Find majority option
      const majorityOption = Object.entries(optionCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      if (vote.option === majorityOption) majorityAlignCount++;
    }
    const qualityScore = votes.length > 0 ? Math.round((majorityAlignCount / votes.length) * 100 * 100) / 100 : 0;

    // 3. Consistency Score (0-100): based on streak and account age
    const streak = user?.streak || 0;
    const accountAgeDays = user ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const consistencyRaw = Math.min(100, (streak * 5) + (Math.min(accountAgeDays, 90) / 90 * 50));
    const consistencyScore = Math.round(consistencyRaw * 100) / 100;

    // 4. Influence Score (0-100): proposals that passed
    const passedProposals = proposals.filter(p => p.status === 'closed').length;
    const influenceRaw = Math.min(100, passedProposals * 20);
    const influenceScore = Math.round(influenceRaw * 100) / 100;

    // 5. Expertise Score (0-100): game XP and accuracy
    const totalGameXp = gameResults.reduce((sum, g) => sum + g.xpEarned, 0);
    const avgAccuracy = gameResults.length > 0
      ? gameResults.reduce((sum, g) => sum + (g.accuracy || 0), 0) / gameResults.length
      : 0;
    const expertiseRaw = Math.min(100, (totalGameXp / 10) + (avgAccuracy * 0.5));
    const expertiseScore = Math.round(expertiseRaw * 100) / 100;

    // --- Calculate Overall Score ---
    const overallScore = Math.round(
      (participationScore * 0.25 +
       qualityScore * 0.25 +
       consistencyScore * 0.20 +
       influenceScore * 0.15 +
       expertiseScore * 0.15) * 10
    );
    const clampedScore = Math.max(0, Math.min(1000, overallScore));
    const tier = getTier(clampedScore);
    const tierColor = getTierColor(tier);

    // --- Calculate Badges ---
    const badges: { id: string; name: string; description: string; icon: string; earned: boolean }[] = [
      { id: 'first_vote', name: 'First Vote', description: 'Cast your first vote', icon: 'vote', earned: voteCount >= 1 },
      { id: 'ten_votes', name: '10 Votes', description: 'Cast 10 votes in proposals', icon: 'vote', earned: voteCount >= 10 },
      { id: 'hundred_votes', name: '100 Votes', description: 'Cast 100 votes in proposals', icon: 'vote', earned: voteCount >= 100 },
      { id: 'week_streak', name: 'Week Streak', description: 'Maintain a 7-day login streak', icon: 'flame', earned: streak >= 7 },
      { id: 'month_streak', name: 'Month Streak', description: 'Maintain a 30-day login streak', icon: 'flame', earned: streak >= 30 },
      { id: 'oracle', name: 'Oracle', description: '5 correct predictions in Oracle Protocol', icon: 'eye', earned: gameResults.filter(g => g.gameSlug === 'oracle-protocol' && (g.accuracy || 0) > 0.7).length >= 5 },
      { id: 'consensus_builder', name: 'Consensus Builder', description: '80%+ alignment with majority votes', icon: 'users', earned: qualityScore >= 80 && voteCount >= 5 },
      { id: 'strategic_mind', name: 'Strategic Mind', description: 'High scores in Strategic Command', icon: 'shield', earned: gameResults.filter(g => g.gameSlug === 'strategic-command' && g.score >= 80).length >= 3 },
      { id: 'bias_hunter', name: 'Bias Hunter', description: 'Cognitive Warfare mastery', icon: 'alert-triangle', earned: gameResults.filter(g => g.gameSlug === 'cognitive-warfare' && g.score >= 80).length >= 3 },
      { id: 'governance_guru', name: 'Governance Guru', description: 'Reach the highest reputation tier (Nebula)', icon: 'crown', earned: tier === 'Nebula' },
    ];

    // --- Calculate percentile ---
    const totalUsers = await db.user.count();
    const usersBelow = await db.cosmicReputation.count({
      where: { score: { lt: clampedScore } },
    });
    const percentile = totalUsers > 1 ? Math.round((usersBelow / totalUsers) * 100) : 50;

    // --- Create/Update CosmicReputation record ---
    await db.cosmicReputation.upsert({
      where: { userId },
      create: {
        userId,
        score: clampedScore,
        tier,
        participationScore,
        qualityScore,
        consistencyScore,
        influenceScore,
        expertiseScore,
        badges: JSON.stringify(badges.filter(b => b.earned).map(b => b.id)),
      },
      update: {
        score: clampedScore,
        tier,
        participationScore,
        qualityScore,
        consistencyScore,
        influenceScore,
        expertiseScore,
        badges: JSON.stringify(badges.filter(b => b.earned).map(b => b.id)),
      },
    });

    return NextResponse.json({
      score: clampedScore,
      tier,
      tierColor,
      participationScore,
      qualityScore,
      consistencyScore,
      influenceScore,
      expertiseScore,
      badges,
      percentile,
      totalUsers,
    });
  } catch (error) {
    console.error('Reputation error:', error);
    return NextResponse.json({ error: 'Failed to calculate reputation' }, { status: 500 });
  }
}
