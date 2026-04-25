import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (session.role !== 'gov_official' && session.role !== 'admin' && session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Government portal access required' }, { status: 403 });
    }

    const initiativesPending = await db.citizenInitiative.count({
      where: { status: 'threshold_reached', governmentResponse: null },
    });
    const initiativesResponded = await db.citizenInitiative.count({
      where: { governmentResponse: { not: null } },
    });
    const bindingPending = await db.bindingProposal.count({
      where: { status: { in: ['threshold_reached', 'government_review'] }, governmentResponse: null },
    });
    const bindingResponded = await db.bindingProposal.count({
      where: { governmentResponse: { not: null } },
    });
    const legislationPending = await db.legislation.count({ where: { status: 'review' } });
    const legislationPublicComment = await db.legislation.count({ where: { status: 'public_comment' } });
    const overdueResponses = await db.bindingProposal.count({
      where: {
        responseDeadline: { lt: new Date() },
        governmentResponse: null,
        status: { in: ['threshold_reached', 'government_review'] },
      },
    });

    const respondedWithDates = await db.bindingProposal.findMany({
      where: { governmentResponse: { not: null }, responseDate: { not: null }, createdAt: { not: null } },
      select: { createdAt: true, responseDate: true },
      take: 50,
    });
    const avgResponseDays = respondedWithDates.length > 0
      ? respondedWithDates.reduce((acc, p) => acc + (p.responseDate!.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24), 0) / respondedWithDates.length
      : 0;

    const recentInitiatives = await db.citizenInitiative.findMany({
      where: { status: 'threshold_reached', governmentResponse: null },
      include: { creator: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const recentBinding = await db.bindingProposal.findMany({
      where: { status: { in: ['threshold_reached', 'government_review'] }, governmentResponse: null },
      include: { creator: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      stats: {
        initiativesPending, initiativesResponded,
        bindingPending, bindingResponded,
        legislationPending, legislationPublicComment,
        overdueResponses,
        avgResponseDays: Math.round(avgResponseDays * 10) / 10,
      },
      recentInitiatives,
      recentBinding,
    });
  } catch (error) {
    console.error('Error fetching gov portal dashboard:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
