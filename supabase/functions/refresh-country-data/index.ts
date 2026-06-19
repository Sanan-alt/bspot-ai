// Daily refresh of country_live_data — pulls FX (open.er-api.com), inflation & policy rate (World Bank).
// Triggered by pg_cron via pg_net once per day.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// country_code (ISO alpha-2) -> { currency, wb_iso3 }
const COUNTRIES: Record<string, { currency: string; wb: string }> = {
  AE: { currency: "AED", wb: "ARE" },
  GB: { currency: "GBP", wb: "GBR" },
  CA: { currency: "CAD", wb: "CAN" },
  SG: { currency: "SGD", wb: "SGP" },
  SA: { currency: "SAR", wb: "SAU" },
  DE: { currency: "EUR", wb: "DEU" },
  US: { currency: "USD", wb: "USA" },
  TR: { currency: "TRY", wb: "TUR" },
  PT: { currency: "EUR", wb: "PRT" },
  AU: { currency: "AUD", wb: "AUS" },
  PK: { currency: "PKR", wb: "PAK" },
  IN: { currency: "INR", wb: "IND" },
  EG: { currency: "EGP", wb: "EGY" },
  NG: { currency: "NGN", wb: "NGA" },
  BR: { currency: "BRL", wb: "BRA" },
  CL: { currency: "CLP", wb: "CHL" },
};

async function wbLatest(iso3: string, indicator: string): Promise<number | null> {
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // Require shared secret — this endpoint performs expensive multi-API refresh + DB writes.
  const expected = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");
  if (!expected || provided !== expected) {
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

  const rows: Array<Record<string, unknown>> = [];
  for (const [code, meta] of Object.entries(COUNTRIES)) {
    const inflation = await wbLatest(meta.wb, "FP.CPI.TOTL.ZG");
    const policy = await wbLatest(meta.wb, "FR.INR.RINR");
    rows.push({
      country_code: code,
      currency_code: meta.currency,
      fx_rate_usd: fx[meta.currency] ?? null,
      inflation_pct: inflation,
      policy_rate_pct: policy,
      source: "open.er-api.com + World Bank",
      fetched_at: new Date().toISOString(),
    });
  }

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
