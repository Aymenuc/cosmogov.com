import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const csc = require('countries-states-cities/dist').default;
    const allCountries = csc.getAllCountries();

    // Map each country to the required fields
    const countries = allCountries.map((c: any) => ({
      id: c.id,
      name: c.name,
      iso2: c.iso2,
      iso3: c.iso3,
      emoji: c.emoji,
      capital: c.capital,
      region: c.region,
      subregion: c.subregion,
      currency: c.currency,
      phone_code: c.phone_code,
      native: c.native,
    }));

    // Group countries by region
    const regionMap = new Map<string, typeof countries>();
    for (const country of countries) {
      const regionName = country.region || 'Other';
      if (!regionMap.has(regionName)) {
        regionMap.set(regionName, []);
      }
      regionMap.get(regionName)!.push(country);
    }

    // Build regions array, sort regions alphabetically and countries within each region alphabetically
    const regions = Array.from(regionMap.entries())
      .map(([name, regionCountries]) => ({
        name,
        countries: regionCountries.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ regions, countries });
  } catch (error) {
    console.error('[GEO_COUNTRIES_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    );
  }
}
