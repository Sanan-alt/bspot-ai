// Daily refresh of country_live_data — pulls FX (open.er-api.com), inflation & policy rate (World Bank).
// Triggered by pg_cron via pg_net once per day.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// Every country listed in src/lib/countries-data.ts that the upstream sources support.
// country_code (ISO alpha-2) -> { currency, wb_iso3 }
const COUNTRIES: Record<string, { currency: string; wb: string }> = {
  // Americas
  US: { currency: "USD", wb: "USA" },
  CA: { currency: "CAD", wb: "CAN" },
  MX: { currency: "MXN", wb: "MEX" },
  BR: { currency: "BRL", wb: "BRA" },
  AR: { currency: "ARS", wb: "ARG" },
  CL: { currency: "CLP", wb: "CHL" },
  // Europe
  GB: { currency: "GBP", wb: "GBR" },
  DE: { currency: "EUR", wb: "DEU" },
  FR: { currency: "EUR", wb: "FRA" },
  ES: { currency: "EUR", wb: "ESP" },
  IT: { currency: "EUR", wb: "ITA" },
  NL: { currency: "EUR", wb: "NLD" },
  CH: { currency: "CHF", wb: "CHE" },
  SE: { currency: "SEK", wb: "SWE" },
  NO: { currency: "NOK", wb: "NOR" },
  PL: { currency: "PLN", wb: "POL" },
  TR: { currency: "TRY", wb: "TUR" },
  RU: { currency: "RUB", wb: "RUS" },
  UA: { currency: "UAH", wb: "UKR" },
  BE: { currency: "EUR", wb: "BEL" },
  AT: { currency: "EUR", wb: "AUT" },
  IE: { currency: "EUR", wb: "IRL" },
  PT: { currency: "EUR", wb: "PRT" },
  DK: { currency: "DKK", wb: "DNK" },
  FI: { currency: "EUR", wb: "FIN" },
  CZ: { currency: "CZK", wb: "CZE" },
  GR: { currency: "EUR", wb: "GRC" },
  HU: { currency: "HUF", wb: "HUN" },
  RO: { currency: "RON", wb: "ROU" },
  // Asia
  CN: { currency: "CNY", wb: "CHN" },
  JP: { currency: "JPY", wb: "JPN" },
  KR: { currency: "KRW", wb: "KOR" },
  IN: { currency: "INR", wb: "IND" },
  SG: { currency: "SGD", wb: "SGP" },
  HK: { currency: "HKD", wb: "HKG" },
  ID: { currency: "IDR", wb: "IDN" },
  TH: { currency: "THB", wb: "THA" },
  VN: { currency: "VND", wb: "VNM" },
  PK: { currency: "PKR", wb: "PAK" },
  MY: { currency: "MYR", wb: "MYS" },
  PH: { currency: "PHP", wb: "PHL" },
  BD: { currency: "BDT", wb: "BGD" },
  LK: { currency: "LKR", wb: "LKA" },
  KZ: { currency: "KZT", wb: "KAZ" },
  // Taiwan: FX is available, World Bank has no TWN series — macro stays null by design.
  TW: { currency: "TWD", wb: "" },
  // MENA
  AE: { currency: "AED", wb: "ARE" },
  SA: { currency: "SAR", wb: "SAU" },
  IR: { currency: "IRR", wb: "IRN" },
  EG: { currency: "EGP", wb: "EGY" },
  // Africa
  ZA: { currency: "ZAR", wb: "ZAF" },
  NG: { currency: "NGN", wb: "NGA" },
  KE: { currency: "KES", wb: "KEN" },
  // Oceania
  AU: { currency: "AUD", wb: "AUS" },
  NZ: { currency: "NZD", wb: "NZL" },
};

async function wbLatest(iso3: string, indicator: string): Promise<number | null> {
  if (!iso3) return null;
  try {
    const r = await fetch(`https://api.worldbank.org/v2/country/${iso3}/indicator/${indicator}?format=json&per_page=5&MRV=5`);
    if (!r.ok) return null;
    const j = await r.json();
    const rows = j?.[1] as Array<{ value: number | null }> | undefined;
    if (!rows) return null;
    for (const row of rows) if (row.value !== null && Number.isFinite(row.value)) return row.value;
    return null;
  } catch {
    return null;
  }
}

/** Run tasks with a small concurrency cap so the World Bank API is not hammered. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    for (;;) {
      const idx = i++;
      if (idx >= items.length) return;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // Accept either the shared cron secret or the project apikey/anon key (the
  // documented pg_cron pattern). The job is idempotent and only writes public macro data.
  const cronSecret = Deno.env.get("CRON_SECRET");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const provided =
    req.headers.get("x-cron-secret") ||
    req.headers.get("apikey") ||
    (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const ok =
    (!!cronSecret && provided === cronSecret) ||
    (!!anon && provided === anon) ||
    (!!service && provided === service);
  if (!ok) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401,
      headers: { ...CORS, "content-type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 1) FX
  let fx: Record<string, number> = {};
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/USD");
    if (r.ok) fx = ((await r.json()) as { rates?: Record<string, number> }).rates ?? {};
  } catch (e) {
    console.error("FX fetch failed", e);
  }

  // 2) Macro indicators, 6 countries in flight at a time
  const entries = Object.entries(COUNTRIES);
  const rows = await mapLimit(entries, 6, async ([code, meta]) => {
    const [inflation, policy] = await Promise.all([
      wbLatest(meta.wb, "FP.CPI.TOTL.ZG"),
      wbLatest(meta.wb, "FR.INR.RINR"),
    ]);
    return {
      country_code: code,
      currency_code: meta.currency,
      fx_rate_usd: fx[meta.currency] ?? null,
      inflation_pct: inflation,
      policy_rate_pct: policy,
      source: "open.er-api.com + World Bank",
      fetched_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase.from("country_live_data").upsert(rows, { onConflict: "country_code" });
  if (error) {
    console.error("upsert error", error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { ...CORS, "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, updated: rows.length }), {
    headers: { ...CORS, "content-type": "application/json" },
  });
});
