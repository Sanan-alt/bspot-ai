import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const COST = 5;

const CountryInput = z.object({
  country_code: z.string().min(2).max(3),
  country_name: z.string().min(1).max(80),
});

const CityInput = z.object({
  country_code: z.string().min(2).max(3),
  country_name: z.string().min(1).max(80),
  city_name: z.string().min(1).max(80),
});

export type Dossier = {
  scope: "country" | "city";
  headline: string;
  overall_score: number;       // 0-10
  political_stability: number; // 0-10
  investment_climate: number;  // 0-10
  business_friendliness: number; // 0-10
  safety_score: number;         // 0-10 (higher = safer)
  corruption_score: number;     // 0-10 (higher = cleaner)
  infrastructure_score: number; // 0-10
  cost_of_living_score: number; // 0-10 (higher = cheaper for foreigners)
  current_government: {
    head_of_state: string;
    head_of_government: string;
    ruling_party: string;
    in_power_since: string;
    next_election: string;
    system: string; // "Federal republic", "Constitutional monarchy", etc.
  };
  key_stats: {
    population: string;
    gdp_usd: string;
    gdp_growth_pct: string;
    inflation_pct: string;
    unemployment_pct: string;
    currency: string;
  };
  geopolitical_role: string;
  latest_political_events: { title: string; date_hint: string; impact: string }[];
  recent_economic_events: { title: string; date_hint: string; impact: string }[];
  politics_to_investment: string;
  taxes: {
    corporate_pct: string;
    personal_pct: string;
    capital_gains_pct: string;
    vat_pct: string;
    notes: string;
  };
  top_sectors: string[];        // 3-6 booming sectors
  profit_margins: string;
  risks: string[];
  opportunities: string[];
  world_role: string;
  bottom_line: string;
};

const dossierTool = {
  type: "function",
  function: {
    name: "investment_dossier",
    description: "Comprehensive investment, political & economic dossier for a country or city.",
    parameters: {
      type: "object",
      properties: {
        headline: { type: "string", description: "One-sentence headline." },
        overall_score: { type: "number", description: "0-10 overall attractiveness for foreign investors." },
        political_stability: { type: "number", description: "0-10." },
        investment_climate: { type: "number", description: "0-10." },
        business_friendliness: { type: "number", description: "0-10." },
        safety_score: { type: "number", description: "0-10, higher = safer for people & assets." },
        corruption_score: { type: "number", description: "0-10, higher = cleaner (less corruption)." },
        infrastructure_score: { type: "number", description: "0-10 for transport, power, internet, logistics." },
        cost_of_living_score: { type: "number", description: "0-10, higher = cheaper for a foreign professional." },
        current_government: {
          type: "object",
          properties: {
            head_of_state: { type: "string", description: "e.g. 'King Charles III'." },
            head_of_government: { type: "string", description: "PM/President actually running the country." },
            ruling_party: { type: "string" },
            in_power_since: { type: "string", description: "Year or date the current leadership took office." },
            next_election: { type: "string", description: "Approximate year/date of next major election." },
            system: { type: "string", description: "Political system in a few words." },
          },
          required: ["head_of_state", "head_of_government", "ruling_party", "in_power_since", "next_election", "system"],
          additionalProperties: false,
        },
        key_stats: {
          type: "object",
          properties: {
            population: { type: "string", description: "e.g. '84.6M'." },
            gdp_usd: { type: "string", description: "Nominal GDP, e.g. '$514B'." },
            gdp_growth_pct: { type: "string", description: "Latest annual real GDP growth, e.g. '3.2%'." },
            inflation_pct: { type: "string", description: "Latest CPI inflation, e.g. '4.1%'." },
            unemployment_pct: { type: "string", description: "Latest unemployment, e.g. '5.4%'." },
            currency: { type: "string", description: "Currency name + ISO code, e.g. 'UAE Dirham (AED)'." },
          },
          required: ["population", "gdp_usd", "gdp_growth_pct", "inflation_pct", "unemployment_pct", "currency"],
          additionalProperties: false,
        },
        geopolitical_role: { type: "string", description: "Short paragraph about role in regional/global politics." },
        latest_political_events: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              date_hint: { type: "string", description: "Approximate date or period." },
              impact: { type: "string", description: "How this affects investors/business." },
            },
            required: ["title", "date_hint", "impact"],
            additionalProperties: false,
          },
        },
        recent_economic_events: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              date_hint: { type: "string" },
              impact: { type: "string" },
            },
            required: ["title", "date_hint", "impact"],
            additionalProperties: false,
          },
        },
        politics_to_investment: { type: "string", description: "How current politics impact taxes, FDI, ease of doing business." },
        taxes: {
          type: "object",
          properties: {
            corporate_pct: { type: "string" },
            personal_pct: { type: "string" },
            capital_gains_pct: { type: "string" },
            vat_pct: { type: "string" },
            notes: { type: "string" },
          },
          required: ["corporate_pct", "personal_pct", "capital_gains_pct", "vat_pct", "notes"],
          additionalProperties: false,
        },
        top_sectors: { type: "array", items: { type: "string" }, description: "3-6 sectors currently booming or well-funded." },
        profit_margins: { type: "string", description: "Typical profit/loss margin reality for foreign businesses here." },
        risks: { type: "array", items: { type: "string" } },
        opportunities: { type: "array", items: { type: "string" } },
        world_role: { type: "string", description: "Role on world politics & stability." },
        bottom_line: { type: "string", description: "2-3 sentence verdict for an investor." },
      },
      required: [
        "headline", "overall_score", "political_stability", "investment_climate",
        "business_friendliness", "safety_score", "corruption_score", "infrastructure_score",
        "cost_of_living_score", "current_government", "key_stats", "geopolitical_role",
        "latest_political_events", "recent_economic_events", "politics_to_investment",
        "taxes", "top_sectors", "profit_margins", "risks", "opportunities",
        "world_role", "bottom_line",
      ],
      additionalProperties: false,
    },
  },
} as const;

async function callDossier(prompt: string): Promise<Omit<Dossier, "scope">> {
  const { aiToolCall } = await import("./ai-provider.server");
  const { result } = await aiToolCall<Omit<Dossier, "scope">>(
    {
      messages: [
        {
          role: "system",
          content:
            "You are a senior geopolitical & investment analyst. Produce realistic, sober, non-promotional analysis. Use concrete numbers where possible (population, GDP, inflation, tax rates). Name real current leaders and parties. Always return data via the investment_dossier tool. Never refuse — if data is uncertain, give best-effort current-knowledge estimates and flag them briefly in notes.",
        },
        { role: "user", content: prompt },
      ],
      tools: [dossierTool],
      tool_choice: { type: "function", function: { name: "investment_dossier" } },
    },
    "investment_dossier",
  );
  return result;
}


const CACHE_TTL_HOURS = 24;
const RATE_MAX = 10;        // 10 dossiers
const RATE_WINDOW = 3600;   // per hour

async function checkDossierRate(supabase: any) {
  const { data: rl, error: rlErr } = await supabase.rpc("check_ai_rate_limit", {
    p_feature: "dossier",
    p_max: RATE_MAX,
    p_window_seconds: RATE_WINDOW,
  });
  if (rlErr) throw new Error(rlErr.message);
  if (rl && rl.ok === false) {
    throw new Error(`Dossier limit reached (${RATE_MAX}/hour). Try again later.`);
  }
}

async function readCache(
  supabase: any,
  scope: "country" | "city",
  country_code: string,
  city_name: string | null,
): Promise<Dossier | null> {
  const q = supabase
    .from("dossier_cache")
    .select("data,created_at")
    .eq("scope", scope)
    .eq("country_code", country_code);
  const { data, error } = city_name
    ? await q.eq("city_name", city_name).maybeSingle()
    : await q.is("city_name", null).maybeSingle();
  if (error || !data) return null;
  const ageMs = Date.now() - new Date(data.created_at).getTime();
  if (ageMs > CACHE_TTL_HOURS * 3600 * 1000) return null;
  const parsed = data.data as Dossier;
  // Reject old schema cache entries missing the new enriched fields so users get fresh dossiers
  if (!parsed || !parsed.current_government || !parsed.key_stats) return null;
  return parsed;
}

async function writeCache(
  supabase: any,
  scope: "country" | "city",
  country_code: string,
  city_name: string | null,
  dossier: Dossier,
) {
  await supabase.from("dossier_cache").upsert(
    { scope, country_code, city_name, data: dossier, created_at: new Date().toISOString() },
    { onConflict: "scope,country_code,city_name" },
  );
}

export const getCountryDossier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => CountryInput.parse(d))
  .handler(async ({ data, context }): Promise<Dossier> => {
    const { supabase } = context;
    const cached = await readCache(supabase, "country", data.country_code, null);
    if (cached) return cached;

    await checkDossierRate(supabase);

    const { error: creditErr } = await supabase.rpc("consume_credits", {
      p_amount: COST,
      p_feature: "country_dossier",
      p_description: `Dossier: ${data.country_name}`,
    });
    if (creditErr) {
      if (creditErr.message?.includes("INSUFFICIENT_CREDITS")) {
        throw new Error(`Not enough credits — dossier costs ${COST}.`);
      }
      throw new Error(creditErr.message || "Could not spend credits");
    }
    const body = await callDossier(
      `Produce a full investment & political dossier for ${data.country_name} (${data.country_code}).
Cover: current government (head of state, head of government / PM, ruling party, when they took power, next election, political system);
key macro stats (population, nominal GDP in USD, real GDP growth %, inflation %, unemployment %, currency);
political stability, safety, corruption cleanliness, infrastructure quality, cost of living for a foreign professional (all 0-10);
latest political events AND recent economic events (each with an approximate date and investor impact);
how current politics impact foreign investment & taxes; current corporate / personal / capital-gains / VAT rates;
top 3-6 booming sectors; realistic profit margins for foreign businesses; key risks & opportunities;
country's role in world politics & global stability; and a clear 2-3 sentence bottom-line verdict for a foreign investor.`,
    );
    const dossier: Dossier = { scope: "country", ...body };
    await writeCache(supabase, "country", data.country_code, null, dossier);
    return dossier;
  });

export const getCityDossier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => CityInput.parse(d))
  .handler(async ({ data, context }): Promise<Dossier> => {
    const { supabase } = context;
    const cached = await readCache(supabase, "city", data.country_code, data.city_name);
    if (cached) return cached;

    await checkDossierRate(supabase);

    const { error: creditErr } = await supabase.rpc("consume_credits", {
      p_amount: COST,
      p_feature: "city_dossier",
      p_description: `Dossier: ${data.city_name}, ${data.country_name}`,
    });
    if (creditErr) {
      if (creditErr.message?.includes("INSUFFICIENT_CREDITS")) {
        throw new Error(`Not enough credits — dossier costs ${COST}.`);
      }
      throw new Error(creditErr.message || "Could not spend credits");
    }
    const body = await callDossier(
      `Produce a full investment & political dossier for the city of ${data.city_name} in ${data.country_name} (${data.country_code}).
Focus on the city specifically. Cover: current national government (leader, party, since) plus local mayor/governor if relevant;
key stats for the city (metro population, city/metro GDP if known, main currency);
local political stability, safety, corruption cleanliness, infrastructure, cost of living for a foreign professional (all 0-10);
latest local political events AND recent local economic events (with approximate dates and investor impact);
how city/state politics impact business; local taxes & incentives (corporate, personal, capital gains, VAT — city/state if applicable, else national);
top 3-6 sectors booming in this city; realistic profit margins for foreign businesses operating here;
risks & opportunities specific to this city; the city's role in regional/world economy & politics;
and a clear 2-3 sentence bottom-line verdict for a foreign investor evaluating this city.`,
    );
    const dossier: Dossier = { scope: "city", ...body };
    await writeCache(supabase, "city", data.country_code, data.city_name, dossier);
    return dossier;
  });
