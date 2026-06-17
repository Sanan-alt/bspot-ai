// Static sector/region benchmark data for country comparison.
// Values are illustrative reference figures (annual %), curated from public
// IMF / World Bank ranges to give users immediate comparative context.

export type SectorRow = {
  sector: string;
  country: number; // % growth or yield in the country
  region: number; // regional benchmark
  global: number; // global benchmark
};

const REGION_OF: Record<string, string> = {
  AE: "Middle East", SA: "Middle East", TR: "Middle East",
  GB: "Europe", DE: "Europe", PT: "Europe",
  US: "Americas", CA: "Americas",
  SG: "Asia-Pacific", AU: "Asia-Pacific",
};

const REGIONAL_AVG: Record<string, Record<string, number>> = {
  "Middle East": { Technology: 9.2, Energy: 6.1, RealEstate: 7.4, Finance: 8.0, Tourism: 11.3 },
  "Europe": { Technology: 6.8, Energy: 3.2, RealEstate: 4.1, Finance: 5.2, Tourism: 6.4 },
  "Americas": { Technology: 10.1, Energy: 5.4, RealEstate: 5.6, Finance: 7.1, Tourism: 5.9 },
  "Asia-Pacific": { Technology: 11.4, Energy: 4.8, RealEstate: 6.2, Finance: 8.4, Tourism: 9.6 },
};

const GLOBAL_AVG: Record<string, number> = {
  Technology: 9.1, Energy: 4.6, RealEstate: 5.5, Finance: 7.0, Tourism: 7.8,
};

// Per-country tilt (relative to regional average) — keeps data realistic and
// distinct without faking precision we don't have.
const COUNTRY_TILT: Record<string, Partial<Record<keyof typeof GLOBAL_AVG, number>>> = {
  AE: { Technology: +2.4, Energy: +1.9, RealEstate: +3.1, Tourism: +4.2 },
  SA: { Energy: +3.6, Tourism: +2.8 },
  TR: { Tourism: +1.6, Finance: -1.1 },
  GB: { Finance: +2.4, Technology: +1.2 },
  DE: { Technology: +1.8, Finance: +0.8 },
  PT: { Tourism: +2.1, RealEstate: +1.3 },
  US: { Technology: +3.8, Finance: +1.6 },
  CA: { Energy: +1.4, RealEstate: +1.1 },
  SG: { Finance: +3.2, Technology: +2.4 },
  AU: { Energy: +1.6, Finance: +0.8 },
};

export function getSectorBenchmarks(countryCode: string): SectorRow[] | null {
  const region = REGION_OF[countryCode];
  if (!region) return null;
  const regional = REGIONAL_AVG[region];
  const tilt = COUNTRY_TILT[countryCode] ?? {};
  return (Object.keys(GLOBAL_AVG) as Array<keyof typeof GLOBAL_AVG>).map((sector) => {
    const r = regional[sector];
    const c = +(r + (tilt[sector] ?? 0)).toFixed(1);
    return {
      sector: sector === "RealEstate" ? "Real Estate" : sector,
      country: c,
      region: r,
      global: GLOBAL_AVG[sector],
    };
  });
}

export function getRegion(countryCode: string): string | null {
  return REGION_OF[countryCode] ?? null;
}
