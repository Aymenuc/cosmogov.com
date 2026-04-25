import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SetLocationBody {
  countryId: string;
  countryName?: string;
  stateId?: string;
  stateName?: string;
  cityId?: string;
  cityName?: string;
}

interface UpdatedLocationInfo {
  countryId: string;
  countryName: string | null;
  stateId: string | null;
  stateName: string | null;
  cityId: string | null;
  cityName: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface SetLocationResponse {
  success: boolean;
  location: UpdatedLocationInfo;
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

/** Look up city coordinates and name from CSC package */
function getCityInfo(cityId: string): { latitude: number; longitude: number; name: string } | null {
  try {
    const csc = getCsc();
    const city = csc.getCityById(Number(cityId));
    if (city && city.latitude && city.longitude) {
      const lat = parseFloat(city.latitude);
      const lng = parseFloat(city.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { latitude: lat, longitude: lng, name: city.name };
      }
    }
  } catch {
    // City not found
  }
  return null;
}

/** Look up state name from CSC package */
function getStateName(stateId: string): string | null {
  try {
    const csc = getCsc();
    const state = csc.getStateById(Number(stateId));
    return state?.name || null;
  } catch {
    return null;
  }
}

/** Look up country name from CSC package */
function getCountryName(countryId: string): string | null {
  try {
    const csc = getCsc();
    const country = csc.getCountryById(Number(countryId));
    return country?.name || null;
  } catch {
    return null;
  }
}

// ─── Main Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: SetLocationBody = await request.json();
    const { countryId, countryName, stateId, stateName, cityId, cityName } = body;

    // Validate required field
    if (!countryId) {
      return NextResponse.json(
        { error: 'countryId is required' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      countryId,
    };

    // Resolve country name: prefer provided value, then CSC lookup
    if (countryName) {
      updateData.countryName = countryName;
    } else {
      const resolved = getCountryName(countryId);
      if (resolved) updateData.countryName = resolved;
    }

    // Handle state fields
    if (stateId) {
      updateData.stateId = stateId;
      // Resolve state name
      if (stateName) {
        updateData.stateName = stateName;
      } else {
        const resolved = getStateName(stateId);
        if (resolved) updateData.stateName = resolved;
      }
    } else {
      // Clear state if not provided
      updateData.stateId = null;
      updateData.stateName = null;
    }

    // Handle city fields
    if (cityId) {
      updateData.cityId = cityId;
      // Resolve city name and coordinates
      const cityInfo = getCityInfo(cityId);
      if (cityName) {
        updateData.cityName = cityName;
      } else if (cityInfo) {
        updateData.cityName = cityInfo.name;
      }
      // Update coordinates from city data
      if (cityInfo) {
        updateData.latitude = cityInfo.latitude;
        updateData.longitude = cityInfo.longitude;
      }
    } else {
      // Clear city if not provided
      updateData.cityId = null;
      updateData.cityName = null;
      // Clear coordinates when no city
      updateData.latitude = null;
      updateData.longitude = null;
    }

    // Update the user record
    const updatedUser = await db.user.update({
      where: { id: session.id },
      data: updateData,
      select: {
        countryId: true,
        countryName: true,
        stateId: true,
        stateName: true,
        cityId: true,
        cityName: true,
        latitude: true,
        longitude: true,
      },
    });

    const location: UpdatedLocationInfo = {
      countryId: updatedUser.countryId || countryId,
      countryName: updatedUser.countryName,
      stateId: updatedUser.stateId,
      stateName: updatedUser.stateName,
      cityId: updatedUser.cityId,
      cityName: updatedUser.cityName,
      latitude: updatedUser.latitude,
      longitude: updatedUser.longitude,
    };

    const response: SetLocationResponse = {
      success: true,
      location,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[GEO_SET_LOCATION_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}
