import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (session.role !== 'gov_official' && session.role !== 'admin' && session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Government portal access required' }, { status: 403 });
    }

    // Response rate metrics
    const totalInitiativesThreshold = await db.citizenInitiative.count({
      where: { status: { in: ['threshold_reached', 'government_response', 'voting', 'enacted'] } },
    });
    const respondedInitiatives = await db.citizenInitiative.count({
      where: { governmentResponse: { not: null } },
    });
    const initiativeResponseRate = totalInitiativesThreshold > 0
      ? Math.round((respondedInitiatives / totalInitiativesThreshold) * 100)
      : 0;

    const totalBindingThreshold = await db.bindingProposal.count({
      where: { status: { in: ['threshold_reached', 'government_review', 'government_response', 'scheduled_vote', 'passed', 'enacted'] } },
    });
    const respondedBinding = await db.bindingProposal.count({
      where: { governmentResponse: { not: null } },
    });
    const bindingResponseRate = totalBindingThreshold > 0
      ? Math.round((respondedBinding / totalBindingThreshold) * 100)
      : 0;

    // Category breakdown of initiatives
    const allInitiatives = await db.citizenInitiative.findMany({
      where: { status: { in: ['threshold_reached', 'government_response'] } },
      select: { type: true, status: true, governmentResponse: true },
    });

    const byType: Record<string, { total: number; responded: number }> = {};
    allInitiatives.forEach(i => {
      if (!byType[i.type]) byType[i.type] = { total: 0, responded: 0 };
      byType[i.type].total++;
      if (i.governmentResponse) byType[i.type].responded++;
    });

    // Binding proposals by category
    const allBinding = await db.bindingProposal.findMany({
      where: { status: { in: ['threshold_reached', 'government_review', 'government_response'] } },
      select: { category: true, status: true, governmentResponse: true },
    });

    const byCategory: Record<string, { total: number; responded: number }> = {};
    allBinding.forEach(b => {
      const cat = b.category || 'uncategorized';
      if (!byCategory[cat]) byCategory[cat] = { total: 0, responded: 0 };
      byCategory[cat].total++;
      if (b.governmentResponse) byCategory[cat].responded++;
    });

    return NextResponse.json({
      initiativeResponseRate,
      bindingResponseRate,
      totalInitiativesThreshold,
      respondedInitiatives,
      totalBindingThreshold,
      respondedBinding,
      byType,
      byCategory,
    });
  } catch (error) {
    console.error('Error fetching gov analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
