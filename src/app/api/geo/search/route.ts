import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.toLowerCase().trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ countries: [], states: [], cities: [] });
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const csc = require('countries-states-cities/dist').default;
    const countries = csc.getAllCountries();

    // Search countries by name or native name
    const matchedCountries = countries
      .filter(
        (c: any) =>
          c.name.toLowerCase().includes(q) ||
          (c.native && c.native.toLowerCase().includes(q))
      )
      .slice(0, 10)
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        iso2: c.iso2,
        emoji: c.emoji,
        region: c.region,
      }));

    // Search states — need to load from JSON directly since there's no getAllStates()
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const states: any[] = require('countries-states-cities/dist/lib/states.json');
    const matchedStates = states
      .filter((s: any) => s.name.toLowerCase().includes(q))
      .slice(0, 20)
      .map((s: any) => {
        const country = countries.find(
          (c: any) => String(c.id) === String(s.country_id)
        );
        return {
          id: s.id,
          name: s.name,
          country_id: s.country_id,
          country_code: s.country_code,
          state_code: s.state_code,
          countryName: country?.name || '',
          countryEmoji: country?.emoji || '',
        };
      });

    // Search cities — need to load from JSON directly since there's no getAllCities()
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cities: any[] = require('countries-states-cities/dist/lib/cities.json');
    const matchedCities = cities
      .filter((c: any) => c.name.toLowerCase().includes(q))
      .slice(0, 50)
      .map((c: any) => {
        const country = countries.find(
          (co: any) => String(co.id) === String(c.country_id)
        );
        const state = states.find(
          (s: any) => String(s.id) === String(c.state_id)
        );
        return {
          id: c.id,
          name: c.name,
          state_id: c.state_id,
          state_code: c.state_code,
          country_id: c.country_id,
          country_code: c.country_code,
          latitude: c.latitude,
          longitude: c.longitude,
          countryName: country?.name || '',
          countryEmoji: country?.emoji || '',
          stateName: state?.name || '',
        };
      });

    return NextResponse.json({
      countries: matchedCountries,
      states: matchedStates,
      cities: matchedCities,
    });
  } catch (error) {
    console.error('[GEO_SEARCH_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to search geographic data' },
      { status: 500 }
    );
  }
}
