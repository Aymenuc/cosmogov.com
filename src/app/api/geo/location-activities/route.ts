import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── Types ───────────────────────────────────────────────────────────────────

type ActivityType = 'proposal' | 'process' | 'assembly' | 'initiative' | 'meeting' | 'debate';
type FilterType = 'proposals' | 'processes' | 'assemblies' | 'initiatives' | 'meetings' | 'debates' | 'all';

interface LocationInfo {
  countryId: string;
  countryName: string | null;
  stateId: string | null;
  stateName: string | null;
  cityId: string | null;
  cityName: string | null;
}

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  status: string;
  category: string | null;
  participantCount: number;
  createdAt: string;
  creator: { name: string | null; avatarUrl: string | null } | null;
  url: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface LocationStats {
  totalActivities: number;
  activeProposals: number;
  activeProcesses: number;
  activeAssemblies: number;
  totalParticipants: number;
}

interface LocationActivitiesResponse {
  location: LocationInfo;
  activities: ActivityItem[];
  pagination: PaginationInfo;
  stats: LocationStats;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Lazy-loaded CSC module (cached after first load) */
let _csc: any = null;
function getCsc() {
  if (!_csc) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _csc = require('countries-states-cities/dist').default;
  }
  return _csc;
}

/** Map the plural filter param to the singular ActivityType */
function filterToTypes(filter: FilterType): ActivityType[] {
  if (filter === 'all') {
    return ['proposal', 'process', 'assembly', 'initiative', 'meeting', 'debate'];
  }
  const mapping: Record<string, ActivityType> = {
    proposals: 'proposal',
    processes: 'process',
    assemblies: 'assembly',
    initiatives: 'initiative',
    meetings: 'meeting',
    debates: 'debate',
  };
  const mapped = mapping[filter];
  return mapped ? [mapped] : ['proposal', 'process', 'assembly', 'initiative', 'meeting', 'debate'];
}

/** Build URL path for each activity type */
function buildUrl(type: ActivityType, id: string): string {
  switch (type) {
    case 'proposal':
      return `/dashboard/proposals/${id}`;
    case 'process':
      return `/dashboard/processes/${id}`;
    case 'assembly':
      return `/dashboard/assemblies/${id}`;
    case 'initiative':
      return `/dashboard/initiatives/${id}`;
    case 'meeting':
      return `/dashboard/meetings/${id}`;
    case 'debate':
      return `/dashboard/debates/${id}`;
  }
}

/** Resolve all location names at once */
function resolveLocationNames(
  countryId: string,
  stateId: string | null,
  cityId: string | null
): { countryName: string | null; stateName: string | null; cityName: string | null } {
  let countryName: string | null = null;
  let stateName: string | null = null;
  let cityName: string | null = null;

  try {
    const csc = getCsc();

    const country = csc.getCountryById(Number(countryId));
    countryName = country?.name || null;

    if (stateId) {
      const state = csc.getStateById(Number(stateId));
      stateName = state?.name || null;
    }

    if (cityId) {
      const city = csc.getCityById(Number(cityId));
      cityName = city?.name || null;
    }
  } catch {
    // Location lookup failed, return nulls
  }

  return { countryName, stateName, cityName };
}

// ─── Main Handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Required parameter
    const countryId = searchParams.get('countryId');
    if (!countryId) {
      return NextResponse.json(
        { error: 'countryId query parameter is required' },
        { status: 400 }
      );
    }

    // Optional parameters
    const stateId = searchParams.get('stateId');
    const cityId = searchParams.get('cityId');
    const typeParam = (searchParams.get('type') || 'all') as FilterType;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    const requestedTypes = filterToTypes(typeParam);

    // Resolve location names in a single pass
    const locationNames = resolveLocationNames(countryId, stateId, cityId);

    const location: LocationInfo = {
      countryId,
      countryName: locationNames.countryName,
      stateId: stateId || null,
      stateName: locationNames.stateName,
      cityId: cityId || null,
      cityName: locationNames.cityName,
    };

    // Build location filter for Prisma queries
    const locationFilter: Record<string, unknown> = { countryId };
    if (stateId) locationFilter.stateId = stateId;
    if (cityId) locationFilter.cityId = cityId;

    // Collect all activities across types
    const allActivities: ActivityItem[] = [];
    let totalParticipants = 0;
    let activeProposalCount = 0;
    let activeProcessCount = 0;
    let activeAssemblyCount = 0;

    // ─── Proposals ────────────────────────────────────────────────────────
    if (requestedTypes.includes('proposal')) {
      const proposals = await db.proposal.findMany({
        where: locationFilter,
        include: {
          _count: { select: { votes: true } },
          creator: { select: { name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      activeProposalCount = await db.proposal.count({
        where: { ...locationFilter, status: 'active' },
      });

      for (const p of proposals) {
        allActivities.push({
          id: p.id,
          type: 'proposal',
          title: p.title,
          description: p.description,
          status: p.status,
          category: p.category,
          participantCount: p._count.votes,
          createdAt: p.createdAt.toISOString(),
          creator: { name: p.creator.name, avatarUrl: p.creator.avatarUrl },
          url: buildUrl('proposal', p.id),
        });
        totalParticipants += p._count.votes;
      }
    }

    // ─── Participatory Processes ──────────────────────────────────────────
    if (requestedTypes.includes('process')) {
      const processes = await db.participatoryProcess.findMany({
        where: locationFilter,
        include: {
          _count: { select: { processProposals: true } },
          creator: { select: { name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      activeProcessCount = await db.participatoryProcess.count({
        where: { ...locationFilter, currentPhase: { notIn: ['closed', 'evaluation'] } },
      });

      for (const proc of processes) {
        allActivities.push({
          id: proc.id,
          type: 'process',
          title: proc.title,
          description: proc.shortDescription || proc.description,
          status: proc.currentPhase,
          category: proc.category,
          participantCount: proc._count.processProposals,
          createdAt: proc.createdAt.toISOString(),
          creator: { name: proc.creator.name, avatarUrl: proc.creator.avatarUrl },
          url: buildUrl('process', proc.id),
        });
        totalParticipants += proc._count.processProposals;
      }
    }

    // ─── Assemblies ───────────────────────────────────────────────────────
    if (requestedTypes.includes('assembly')) {
      const assemblies = await db.assembly.findMany({
        where: locationFilter,
        include: {
          creator: { select: { name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      activeAssemblyCount = await db.assembly.count({
        where: { ...locationFilter, isPublic: true },
      });

      for (const asm of assemblies) {
        allActivities.push({
          id: asm.id,
          type: 'assembly',
          title: asm.name,
          description: asm.description,
          status: asm.purpose,
          category: asm.scope,
          participantCount: asm.memberCount,
          createdAt: asm.createdAt.toISOString(),
          creator: { name: asm.creator.name, avatarUrl: asm.creator.avatarUrl },
          url: buildUrl('assembly', asm.id),
        });
        totalParticipants += asm.memberCount;
      }
    }

    // ─── Citizen Initiatives ──────────────────────────────────────────────
    if (requestedTypes.includes('initiative')) {
      const initiatives = await db.citizenInitiative.findMany({
        where: locationFilter,
        include: {
          creator: { select: { name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      for (const init of initiatives) {
        allActivities.push({
          id: init.id,
          type: 'initiative',
          title: init.title,
          description: init.description,
          status: init.status,
          category: init.type,
          participantCount: init.signatureCount,
          createdAt: init.createdAt.toISOString(),
          creator: { name: init.creator.name, avatarUrl: init.creator.avatarUrl },
          url: buildUrl('initiative', init.id),
        });
        totalParticipants += init.signatureCount;
      }
    }

    // ─── Meetings ─────────────────────────────────────────────────────────
    if (requestedTypes.includes('meeting')) {
      const meetings = await db.meeting.findMany({
        where: locationFilter,
        include: {
          creator: { select: { name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      for (const mtg of meetings) {
        allActivities.push({
          id: mtg.id,
          type: 'meeting',
          title: mtg.title,
          description: mtg.description || '',
          status: mtg.status,
          category: mtg.type,
          participantCount: mtg.attendeeCount,
          createdAt: mtg.createdAt.toISOString(),
          creator: { name: mtg.creator.name, avatarUrl: mtg.creator.avatarUrl },
          url: buildUrl('meeting', mtg.id),
        });
        totalParticipants += mtg.attendeeCount;
      }
    }

    // ─── Debate Sessions ──────────────────────────────────────────────────
    if (requestedTypes.includes('debate')) {
      const debates = await db.debateSession.findMany({
        where: locationFilter,
        include: {
          creator: { select: { name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      for (const deb of debates) {
        allActivities.push({
          id: deb.id,
          type: 'debate',
          title: deb.title,
          description: deb.description || '',
          status: deb.status,
          category: deb.phase,
          participantCount: deb.participantCount,
          createdAt: deb.createdAt.toISOString(),
          creator: { name: deb.creator.name, avatarUrl: deb.creator.avatarUrl },
          url: buildUrl('debate', deb.id),
        });
        totalParticipants += deb.participantCount;
      }
    }

    // ─── Sort all activities by createdAt (newest first) ──────────────────
    allActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // ─── Pagination ───────────────────────────────────────────────────────
    const total = allActivities.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const startIndex = (page - 1) * limit;
    const paginatedActivities = allActivities.slice(startIndex, startIndex + limit);

    // ─── Build Response ───────────────────────────────────────────────────
    const response: LocationActivitiesResponse = {
      location,
      activities: paginatedActivities,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
      },
      stats: {
        totalActivities: total,
        activeProposals: activeProposalCount,
        activeProcesses: activeProcessCount,
        activeAssemblies: activeAssemblyCount,
        totalParticipants,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[GEO_LOCATION_ACTIVITIES_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch location activities' },
      { status: 500 }
    );
  }
}
