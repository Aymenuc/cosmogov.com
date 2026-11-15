import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { tierFor, tierColor } from '@/lib/tiers';

function getTier(score: number): string {
  return tierFor(score).name;
}

function getTierColor(tier: string): string {
  return tierColor(tier);
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const userId = session.id;

    // Gather the person's own helpful actions. Votes and signatures are
    // deliberately not counted: CosmoGov never rewards voting or signing,
    // and how someone votes must never raise or lower their standing.
    const [
      proposalCount,
      commentCount,
      tasksDone,
      contributionsAdded,
      formsAnswered,
      communitiesJoined,
      communitiesStarted,
      gameResults,
      user,
    ] = await Promise.all([
      db.proposal.count({ where: { createdBy: userId } }),
      db.comment.count({ where: { authorId: userId } }),
      db.missionTask.count({ where: { assignedToId: userId, status: 'done' } }),
      db.missionContribution.count({
        where: { authorId: userId, kind: { in: ['source', 'perspective', 'constraint'] } },
      }),
      db.missionToolResponse.count({ where: { authorId: userId } }),
      db.membership.count({ where: { userId } }),
      db.organization.count({ where: { createdBy: userId } }),
      db.gameResult.findMany({ where: { userId } }),
      db.user.findUnique({ where: { id: userId }, select: { streak: true, totalXp: true, level: true, createdAt: true } }),
    ]);

    // --- Calculate Scores (each 0-100) ---
    // Stored in the existing columns: participation = contributing,
    // quality = helping, influence = community.

    // 1. Contributing: proposals opened and comments written
    const participationScore = Math.min(100, proposalCount * 10 + commentCount * 3);

    // 2. Helping: mission tasks finished, sources and points of view added, forms answered
    const qualityScore = Math.min(100, tasksDone * 15 + contributionsAdded * 5 + formsAnswered * 3);

    // 3. Showing up: login streak and account age
    const streak = user?.streak || 0;
    const accountAgeDays = user ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const consistencyRaw = Math.min(100, (streak * 5) + (Math.min(accountAgeDays, 90) / 90 * 50));
    const consistencyScore = Math.round(consistencyRaw * 100) / 100;

    // 4. Community: communities joined and started
    const influenceScore = Math.min(100, communitiesJoined * 15 + communitiesStarted * 30);

    // 5. Expertise: game XP and accuracy
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
      { id: 'first_proposal', name: 'First Question', description: 'Open your first proposal', icon: 'vote', earned: proposalCount >= 1 },
      { id: 'ten_comments', name: 'Good Listener', description: 'Write 10 comments on proposals', icon: 'users', earned: commentCount >= 10 },
      { id: 'five_tasks', name: 'Helping Hand', description: 'Finish 5 mission tasks', icon: 'shield', earned: tasksDone >= 5 },
      { id: 'week_streak', name: 'Week Streak', description: 'Maintain a 7-day login streak', icon: 'flame', earned: streak >= 7 },
      { id: 'month_streak', name: 'Month Streak', description: 'Maintain a 30-day login streak', icon: 'flame', earned: streak >= 30 },
      { id: 'oracle', name: 'Oracle', description: '5 correct predictions in Oracle Protocol', icon: 'eye', earned: gameResults.filter(g => g.gameSlug === 'oracle-protocol' && (g.accuracy || 0) > 0.7).length >= 5 },
      { id: 'community_host', name: 'Community Host', description: 'Start a community of your own', icon: 'users', earned: communitiesStarted >= 1 },
      { id: 'strategic_mind', name: 'Strategic Mind', description: 'High scores in Strategic Command', icon: 'shield', earned: gameResults.filter(g => g.gameSlug === 'strategic-command' && g.score >= 80).length >= 3 },
      { id: 'bias_hunter', name: 'Bias Hunter', description: 'Cognitive Warfare mastery', icon: 'alert-triangle', earned: gameResults.filter(g => g.gameSlug === 'cognitive-warfare' && g.score >= 80).length >= 3 },
      { id: 'governance_guru', name: 'Governance Guru', description: 'Reach the highest reputation tier (Cornerstone)', icon: 'crown', earned: tier === 'Cornerstone' },
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
