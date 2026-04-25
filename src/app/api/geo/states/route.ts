import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get('countryId');

    if (!countryId) {
      return NextResponse.json(
        { error: 'countryId query parameter is required' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const csc = require('countries-states-cities/dist').default;
    const states = csc.getStatesOfCountry(Number(countryId));

    const mappedStates = states.map((s: any) => ({
      id: s.id,
      name: s.name,
      country_id: s.country_id,
      country_code: s.country_code,
      state_code: s.state_code,
    }));

    // Sort states alphabetically by name
    mappedStates.sort((a: any, b: any) => a.name.localeCompare(b.name));

    return NextResponse.json(mappedStates);
  } catch (error) {
    console.error('[GEO_STATES_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch states' },
      { status: 500 }
    );
  }
}
