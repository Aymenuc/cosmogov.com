import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * Democratic Lottery Selection Algorithm
 *
 * 1. Get all verified/volunteered candidates
 * 2. Parse demographic stratification targets from the pool
 * 3. Group candidates by demographic categories
 * 4. For each category, allocate seats proportionally to targets
 * 5. Randomly select within each demographic group
 * 6. Fill remaining seats from the general pool
 * 7. Update pool status and selected members
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    // Admin only
    if (session.role !== 'admin' && session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    const pool = await db.sortitionPool.findUnique({
      where: { id },
      include: {
        candidates: {
          where: { status: { in: ['volunteered', 'verified'] } },
          include: {
            user: { select: { id: true, name: true, avatarUrl: true, ageGroup: true } },
          },
        },
      },
    });

    if (!pool) {
      return NextResponse.json({ error: 'Sortition pool not found' }, { status: 404 });
    }

    if (pool.status !== 'recruiting') {
      return NextResponse.json({ error: 'Selection can only be run on recruiting pools' }, { status: 400 });
    }

    if (pool.candidates.length === 0) {
      return NextResponse.json({ error: 'No candidates available for selection' }, { status: 400 });
    }

    // Parse demographic targets
    const demographicTargets: Record<string, Record<string, number>> =
      pool.demographicTargets ? JSON.parse(pool.demographicTargets) : {};

    const selectionSize = pool.selectionSize;
    const candidates = pool.candidates;
    const selectedIds: string[] = [];
    const alternateIds: string[] = [];

    if (Object.keys(demographicTargets).length > 0 && pool.selectionMethod === 'stratified_random') {
      // Stratified random selection
      // Parse each candidate's demographics
      const candidateDemographics = candidates.map((c) => ({
        ...c,
        demo: c.demographics ? JSON.parse(c.demographics) : {} as Record<string, string>,
      }));

      // For each demographic dimension with targets, allocate seats
      const selectedSet = new Set<string>();
      const remainingCandidates = [...candidateDemographics];

      // Process each demographic dimension
      for (const [dimension, targets] of Object.entries(demographicTargets)) {
        const targetEntries = Object.entries(targets);
        if (targetEntries.length === 0) continue;

        for (const [category, ratio] of targetEntries) {
          const seatsForCategory = Math.round(ratio * selectionSize);
          const matching = remainingCandidates.filter(
            (c) => c.demo[dimension] === category && !selectedSet.has(c.id)
          );

          // Shuffle matching candidates (Fisher-Yates)
          for (let i = matching.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [matching[i], matching[j]] = [matching[j], matching[i]];
          }

          const toSelect = matching.slice(0, seatsForCategory);
          for (const c of toSelect) {
            selectedSet.add(c.id);
            selectedIds.push(c.id);
          }
        }
      }

      // Fill remaining seats from all candidates not yet selected
      const unselected = candidateDemographics.filter((c) => !selectedSet.has(c.id));
      for (let i = unselected.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [unselected[i], unselected[j]] = [unselected[j], unselected[i]];
      }

      const remaining = selectionSize - selectedIds.length;
      for (const c of unselected.slice(0, remaining)) {
        selectedIds.push(c.id);
      }

      // Alternates from remaining unselected
      for (const c of unselected.slice(remaining)) {
        alternateIds.push(c.id);
      }
    } else {
      // Simple random selection (Fisher-Yates shuffle)
      const shuffled = [...candidates];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      for (const c of shuffled.slice(0, selectionSize)) {
        selectedIds.push(c.id);
      }

      // Remaining as alternates
      for (const c of shuffled.slice(selectionSize, selectionSize + 10)) {
        alternateIds.push(c.id);
      }
    }

    // Build selected members list with demographic info
    const selectedMembers = selectedIds.map((cid) => {
      const candidate = candidates.find((c) => c.id === cid);
      return {
        candidateId: cid,
        userId: candidate?.userId,
        name: candidate?.user?.name || 'Anonymous',
        avatarUrl: candidate?.user?.avatarUrl,
        demographics: candidate?.demographics ? JSON.parse(candidate.demographics) : {},
      };
    });

    // Update selected candidates
    await db.sortitionCandidate.updateMany({
      where: { id: { in: selectedIds } },
      data: { status: 'selected', verifiedAt: new Date() },
    });

    // Mark alternates
    if (alternateIds.length > 0) {
      await db.sortitionCandidate.updateMany({
        where: { id: { in: alternateIds } },
        data: { status: 'alternate' },
      });
    }

    // Update pool
    const updatedPool = await db.sortitionPool.update({
      where: { id },
      data: {
        status: 'selected',
        selectionDate: new Date(),
        selectedMembers: JSON.stringify(selectedMembers),
      },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        candidates: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true, ageGroup: true } },
          },
        },
      },
    });

    return NextResponse.json({
      pool: updatedPool,
      selectedCount: selectedIds.length,
      alternateCount: alternateIds.length,
      selectionMethod: pool.selectionMethod,
    });
  } catch (error) {
    console.error('Error running sortition selection:', error);
    return NextResponse.json({ error: 'Failed to run selection' }, { status: 500 });
  }
}
