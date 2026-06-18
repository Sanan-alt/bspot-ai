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
  geopolitical_role: string;
  latest_political_events: { title: string; date_hint: string; impact: string }[];
  politics_to_investment: string;
  taxes: {
    corporate_pct: string;
    personal_pct: string;
    capital_gains_pct: string;
    vat_pct: string;
    notes: string;
  };
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
    description: "Comprehensive investment & political dossier for a country or city.",
    parameters: {
      type: "object",
      properties: {
        headline: { type: "string", description: "One-sentence headline." },
        overall_score: { type: "number", description: "0-10 overall attractiveness for foreign investors." },
        political_stability: { type: "number", description: "0-10." },
        investment_climate: { type: "number", description: "0-10." },
        business_friendliness: { type: "number", description: "0-10." },
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
        profit_margins: { type: "string", description: "Typical profit/loss margin reality for foreign businesses here." },
        risks: { type: "array", items: { type: "string" } },
        opportunities: { type: "array", items: { type: "string" } },
        world_role: { type: "string", description: "Role on world politics & stability." },
        bottom_line: { type: "string", description: "2-3 sentence verdict for an investor." },
      },
      required: [
        "headline", "overall_score", "political_stability", "investment_climate",
        "business_friendliness", "geopolitical_role", "latest_political_events",
        "politics_to_investment", "taxes", "profit_margins", "risks",
        "opportunities", "world_role", "bottom_line",
      ],
      additionalProperties: false,
    },
  },
} as const;

async function callDossier(prompt: string): Promise<Omit<Dossier, "scope">> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You are a senior geopolitical & investment analyst. Produce realistic, sober, non-promotional analysis. Use concrete numbers where possible. Always return data via the investment_dossier tool. Never refuse — if data is uncertain, give best-effort current-knowledge estimates and flag them in notes.",
        },
        { role: "user", content: prompt },
      ],
      tools: [dossierTool],
      tool_choice: { type: "function", function: { name: "investment_dossier" } },
    }),
  });

  if (res.status === 429) throw new Error("AI rate limit — try again in a minute.");
  if (res.status === 402) throw new Error("AI credits exhausted on workspace.");
  if (!res.ok) throw new Error(`AI gateway error: ${res.status}`);

  const json = await res.json();
  const call = json?.choices?.[0]?.message?.tool_calls?.[0];
  if (!call?.function?.arguments) throw new Error("AI returned no dossier.");
  return JSON.parse(call.function.arguments);
}

export const getCountryDossier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => CountryInput.parse(d))
  .handler(async ({ data, context }): Promise<Dossier> => {
    const { supabase } = context;
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
      `Produce an investment dossier for ${data.country_name} (${data.country_code}).
Cover: political stability, latest political events (named, with approximate dates), how those politics impact foreign investment & taxes, current corporate/personal/capital-gains/VAT rates, realistic profit margins for foreign businesses, key risks & opportunities, country's role in world politics & global stability, and a clear 2-3 sentence bottom-line verdict for a foreign investor.`,
    );
    return { scope: "country", ...body };
  });

export const getCityDossier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => CityInput.parse(d))
  .handler(async ({ data, context }): Promise<Dossier> => {
    const { supabase } = context;
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
      `Produce an investment dossier for the city of ${data.city_name} in ${data.country_name} (${data.country_code}).
Focus on the city specifically: local political climate, latest local political/economic events with approximate dates, how city/state politics impact business here, local taxes & incentives (corporate, personal, capital gains, VAT — city/state level if applicable, otherwise national), realistic profit margins for foreign businesses operating in this city, top sectors, risks & opportunities specific to this city, the city's role in regional/world economy & politics, and a clear 2-3 sentence bottom-line verdict for a foreign investor evaluating this city.`,
    );
    return { scope: "city", ...body };
  });
