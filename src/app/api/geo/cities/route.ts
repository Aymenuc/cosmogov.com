import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stateId = searchParams.get('stateId');
    const search = searchParams.get('search')?.toLowerCase().trim();

    if (!stateId) {
      return NextResponse.json(
        { error: 'stateId query parameter is required' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const csc = require('countries-states-cities/dist').default;
    const cities = csc.getCitiesOfState(Number(stateId));

    let mappedCities = cities.map((c: any) => ({
      id: c.id,
      name: c.name,
      state_id: c.state_id,
      state_code: c.state_code,
      country_id: c.country_id,
      country_code: c.country_code,
      latitude: c.latitude,
      longitude: c.longitude,
    }));

    // Filter by search term if provided
    if (search) {
      mappedCities = mappedCities.filter((c: any) =>
        c.name.toLowerCase().includes(search)
      );
    }

    // Sort cities alphabetically by name
    mappedCities.sort((a: any, b: any) => a.name.localeCompare(b.name));

    // Limit to 100 results max
    const limitedCities = mappedCities.slice(0, 100);

    return NextResponse.json(limitedCities);
  } catch (error) {
    console.error('[GEO_CITIES_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch cities' },
      { status: 500 }
    );
  }
}
