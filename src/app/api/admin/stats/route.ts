import { planId } from "@/lib/plans";
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const totalUsers = await db.user.count();
  const totalOrgs = await db.organization.count();
  const activeProposals = await db.proposal.count({ where: { status: 'active' } });
  const totalVotes = await db.vote.count();
  const totalGamesPlayed = await db.gameResult.count();
  const unreadMessages = await db.contactMessage.count({ where: { status: 'new' } });
  const totalRevenue = await db.billingRecord.aggregate({ where: { status: 'paid' }, _sum: { amount: true } });
  const recentUsers = await db.user.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, email: true, plan: true, role: true, createdAt: true } });
  const recentMessages = await db.contactMessage.findMany({ take: 5, orderBy: { createdAt: 'desc' } });

  // Older plan names are counted under today's plans (see lib/plans.ts).
  const byPlan = await db.user.groupBy({ by: ['plan'], _count: { _all: true } });
  const planDistribution = { community: 0, pro: 0, government: 0 };
  for (const row of byPlan) planDistribution[planId(row.plan)] += row._count._all;

  return NextResponse.json({
    totalUsers, totalOrgs, activeProposals, totalVotes, totalGamesPlayed, unreadMessages,
    totalRevenue: totalRevenue._sum.amount || 0,
    planDistribution,
    recentUsers, recentMessages,
  });
}
