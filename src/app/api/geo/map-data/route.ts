import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── Types ───────────────────────────────────────────────────────────────────

type ActivityType = 'proposal' | 'process' | 'assembly' | 'initiative' | 'meeting' | 'debate';
type FilterType = 'proposals' | 'processes' | 'assemblies' | 'initiatives' | 'meetings' | 'debates' | 'all';

interface MapMarker {
  id: string;
  type: ActivityType;
  title: string;
  status: string;
  category: string | null;
  latitude: number;
  longitude: number;
  countryName: string | null;
  cityName: string | null;
  participantCount: number;
  createdAt: string;
  url: string;
}

interface MapStats {
  totalMarkers: number;
  byType: Record<string, number>;
  byCountry: Record<string, number>;
}

interface MapDataResponse {
  markers: MapMarker[];
  stats: MapStats;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Haversine distance in km between two lat/lng points */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Check if a point is within map bounds */
function isInBounds(
  lat: number,
  lng: number,
  swLat: number,
  swLng: number,
  neLat: number,
  neLng: number
): boolean {
  return lat >= swLat && lat <= neLat && lng >= swLng && lng <= neLng;
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

/** Get CSC city data by ID (lazy loaded) */
let _csc: any = null;
function getCsc() {
  if (!_csc) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _csc = require('countries-states-cities/dist').default;
  }
  return _csc;
}

/** Look up coordinates from CSC package by cityId */
function getCityCoordinates(cityId: string | null): { latitude: number; longitude: number } | null {
  if (!cityId) return null;
  try {
    const csc = getCsc();
    const city = csc.getCityById(Number(cityId));
    if (city && city.latitude && city.longitude) {
      const lat = parseFloat(city.latitude);
      const lng = parseFloat(city.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { latitude: lat, longitude: lng };
      }
    }
  } catch {
    // City not found, skip
  }
  return null;
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

// ─── Main Handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const typeParam = (searchParams.get('type') || 'all') as FilterType;
    const countryId = searchParams.get('countryId');
    const boundsParam = searchParams.get('bounds');
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    const radiusParam = searchParams.get('radius');

    const requestedTypes = filterToTypes(typeParam);

    // Parse bounds if provided
    let bounds: { swLat: number; swLng: number; neLat: number; neLng: number } | null = null;
    if (boundsParam) {
      const parts = boundsParam.split(',').map(Number);
      if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
        bounds = { swLat: parts[0], swLng: parts[1], neLat: parts[2], neLng: parts[3] };
      }
    }

    // Parse proximity params
    let centerLat: number | null = null;
    let centerLng: number | null = null;
    let radiusKm = 50;

    if (latParam && lngParam) {
      const parsedLat = parseFloat(latParam);
      const parsedLng = parseFloat(lngParam);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        centerLat = parsedLat;
        centerLng = parsedLng;
      }
    }
    if (radiusParam) {
      const parsedRadius = parseFloat(radiusParam);
      if (!isNaN(parsedRadius) && parsedRadius > 0) {
        radiusKm = parsedRadius;
      }
    }

    const markers: MapMarker[] = [];
    const byType: Record<string, number> = {
      proposals: 0,
      processes: 0,
      assemblies: 0,
      initiatives: 0,
      meetings: 0,
      debates: 0,
    };
    const byCountry: Record<string, number> = {};

    // ─── Proposals ──────────────────────────────────────────────────────────
    if (requestedTypes.includes('proposal')) {
      const where: Record<string, unknown> = {};
      if (countryId) where.countryId = countryId;

      const proposals = await db.proposal.findMany({
        where,
        include: {
          _count: { select: { votes: true } },
        },
      });

      for (const p of proposals) {
        // Use stored lat/lng first, fall back to CSC lookup
        let lat: number | null = p.latitude;
        let lng: number | null = p.longitude;

        if (lat === null || lng === null) {
          const coords = getCityCoordinates(p.cityId);
          if (!coords) continue;
          lat = coords.latitude;
          lng = coords.longitude;
        }

        // Apply bounds filter
        if (bounds && !isInBounds(lat, lng, bounds.swLat, bounds.swLng, bounds.neLat, bounds.neLng)) {
          continue;
        }

        // Apply proximity filter
        if (centerLat !== null && centerLng !== null) {
          const dist = haversineKm(centerLat, centerLng, lat, lng);
          if (dist > radiusKm) continue;
        }

        const marker: MapMarker = {
          id: p.id,
          type: 'proposal',
          title: p.title,
          status: p.status,
          category: p.category,
          latitude: lat,
          longitude: lng,
          countryName: p.countryName,
          cityName: p.cityName,
          participantCount: p._count.votes,
          createdAt: p.createdAt.toISOString(),
          url: buildUrl('proposal', p.id),
        };

        markers.push(marker);
        byType.proposals++;
        const cn = p.countryName || 'Unknown';
        byCountry[cn] = (byCountry[cn] || 0) + 1;
      }
    }

    // ─── Participatory Processes ────────────────────────────────────────────
    if (requestedTypes.includes('process')) {
      const where: Record<string, unknown> = {
        latitude: { not: null },
        longitude: { not: null },
      };
      if (countryId) where.countryId = countryId;

      const processes = await db.participatoryProcess.findMany({
        where,
        include: {
          _count: { select: { processProposals: true } },
        },
      });

      for (const proc of processes) {
        if (proc.latitude === null || proc.longitude === null) continue;
        const lat = proc.latitude;
        const lng = proc.longitude;

        if (bounds && !isInBounds(lat, lng, bounds.swLat, bounds.swLng, bounds.neLat, bounds.neLng)) {
          continue;
        }
        if (centerLat !== null && centerLng !== null) {
          const dist = haversineKm(centerLat, centerLng, lat, lng);
          if (dist > radiusKm) continue;
        }

        const marker: MapMarker = {
          id: proc.id,
          type: 'process',
          title: proc.title,
          status: proc.currentPhase,
          category: proc.category,
          latitude: lat,
          longitude: lng,
          countryName: proc.countryName,
          cityName: proc.cityName,
          participantCount: proc._count.processProposals,
          createdAt: proc.createdAt.toISOString(),
          url: buildUrl('process', proc.id),
        };

        markers.push(marker);
        byType.processes++;
        const cn = proc.countryName || 'Unknown';
        byCountry[cn] = (byCountry[cn] || 0) + 1;
      }
    }

    // ─── Assemblies ─────────────────────────────────────────────────────────
    if (requestedTypes.includes('assembly')) {
      const where: Record<string, unknown> = {
        latitude: { not: null },
        longitude: { not: null },
      };
      if (countryId) where.countryId = countryId;

      const assemblies = await db.assembly.findMany({ where });

      for (const asm of assemblies) {
        if (asm.latitude === null || asm.longitude === null) continue;
        const lat = asm.latitude;
        const lng = asm.longitude;

        if (bounds && !isInBounds(lat, lng, bounds.swLat, bounds.swLng, bounds.neLat, bounds.neLng)) {
          continue;
        }
        if (centerLat !== null && centerLng !== null) {
          const dist = haversineKm(centerLat, centerLng, lat, lng);
          if (dist > radiusKm) continue;
        }

        const marker: MapMarker = {
          id: asm.id,
          type: 'assembly',
          title: asm.name,
          status: asm.purpose,
          category: asm.scope,
          latitude: lat,
          longitude: lng,
          countryName: asm.countryName,
          cityName: asm.cityName,
          participantCount: asm.memberCount,
          createdAt: asm.createdAt.toISOString(),
          url: buildUrl('assembly', asm.id),
        };

        markers.push(marker);
        byType.assemblies++;
        const cn = asm.countryName || 'Unknown';
        byCountry[cn] = (byCountry[cn] || 0) + 1;
      }
    }

    // ─── Citizen Initiatives ────────────────────────────────────────────────
    if (requestedTypes.includes('initiative')) {
      const where: Record<string, unknown> = {
        latitude: { not: null },
        longitude: { not: null },
      };
      if (countryId) where.countryId = countryId;

      const initiatives = await db.citizenInitiative.findMany({ where });

      for (const init of initiatives) {
        if (init.latitude === null || init.longitude === null) continue;
        const lat = init.latitude;
        const lng = init.longitude;

        if (bounds && !isInBounds(lat, lng, bounds.swLat, bounds.swLng, bounds.neLat, bounds.neLng)) {
          continue;
        }
        if (centerLat !== null && centerLng !== null) {
          const dist = haversineKm(centerLat, centerLng, lat, lng);
          if (dist > radiusKm) continue;
        }

        const marker: MapMarker = {
          id: init.id,
          type: 'initiative',
          title: init.title,
          status: init.status,
          category: init.type,
          latitude: lat,
          longitude: lng,
          countryName: init.countryName,
          cityName: init.cityName,
          participantCount: init.signatureCount,
          createdAt: init.createdAt.toISOString(),
          url: buildUrl('initiative', init.id),
        };

        markers.push(marker);
        byType.initiatives++;
        const cn = init.countryName || 'Unknown';
        byCountry[cn] = (byCountry[cn] || 0) + 1;
      }
    }

    // ─── Meetings ───────────────────────────────────────────────────────────
    if (requestedTypes.includes('meeting')) {
      const where: Record<string, unknown> = {
        latitude: { not: null },
        longitude: { not: null },
      };
      if (countryId) where.countryId = countryId;

      const meetings = await db.meeting.findMany({ where });

      for (const mtg of meetings) {
        if (mtg.latitude === null || mtg.longitude === null) continue;
        const lat = mtg.latitude;
        const lng = mtg.longitude;

        if (bounds && !isInBounds(lat, lng, bounds.swLat, bounds.swLng, bounds.neLat, bounds.neLng)) {
          continue;
        }
        if (centerLat !== null && centerLng !== null) {
          const dist = haversineKm(centerLat, centerLng, lat, lng);
          if (dist > radiusKm) continue;
        }

        const marker: MapMarker = {
          id: mtg.id,
          type: 'meeting',
          title: mtg.title,
          status: mtg.status,
          category: mtg.type,
          latitude: lat,
          longitude: lng,
          countryName: mtg.countryName,
          cityName: mtg.cityName,
          participantCount: mtg.attendeeCount,
          createdAt: mtg.createdAt.toISOString(),
          url: buildUrl('meeting', mtg.id),
        };

        markers.push(marker);
        byType.meetings++;
        const cn = mtg.countryName || 'Unknown';
        byCountry[cn] = (byCountry[cn] || 0) + 1;
      }
    }

    // ─── Debate Sessions ────────────────────────────────────────────────────
    if (requestedTypes.includes('debate')) {
      const where: Record<string, unknown> = {
        latitude: { not: null },
        longitude: { not: null },
      };
      if (countryId) where.countryId = countryId;

      const debates = await db.debateSession.findMany({ where });

      for (const deb of debates) {
        if (deb.latitude === null || deb.longitude === null) continue;
        const lat = deb.latitude;
        const lng = deb.longitude;

        if (bounds && !isInBounds(lat, lng, bounds.swLat, bounds.swLng, bounds.neLat, bounds.neLng)) {
          continue;
        }
        if (centerLat !== null && centerLng !== null) {
          const dist = haversineKm(centerLat, centerLng, lat, lng);
          if (dist > radiusKm) continue;
        }

        const marker: MapMarker = {
          id: deb.id,
          type: 'debate',
          title: deb.title,
          status: deb.status,
          category: deb.phase,
          latitude: lat,
          longitude: lng,
          countryName: deb.countryName,
          cityName: deb.cityName,
          participantCount: deb.participantCount,
          createdAt: deb.createdAt.toISOString(),
          url: buildUrl('debate', deb.id),
        };

        markers.push(marker);
        byType.debates++;
        const cn = deb.countryName || 'Unknown';
        byCountry[cn] = (byCountry[cn] || 0) + 1;
      }
    }

    // ─── Build Response ─────────────────────────────────────────────────────
    const stats: MapStats = {
      totalMarkers: markers.length,
      byType,
      byCountry,
    };

    const response: MapDataResponse = {
      markers,
      stats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[GEO_MAP_DATA_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch map data' },
      { status: 500 }
    );
  }
}
