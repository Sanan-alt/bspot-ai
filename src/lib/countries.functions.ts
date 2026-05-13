import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const Input = z.object({
  code: z.string().min(2).max(3),
  name: z.string().min(1).max(80),
  refresh: z.boolean().optional(),
});

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export type CountryScore = {
  overall: number;
  stability: number;
  growth: number;
  risk: number;
  currency: string;
  summary: string;
  opportunities: string[];
  risks: string[];
  top_sectors: string[];
  _cached: boolean;
  _age_hours: number;
};

async function callGemini(name: string, code: string): Promise<Omit<CountryScore, "_cached" | "_age_hours">> {
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
        { role: "system", content: "You are an investment analyst. Return strict JSON only via the tool." },
        { role: "user", content: `Score ${name} (${code}) for foreign investors right now. Be concise and realistic.` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "country_score",
          description: "Investment score for a country.",
          parameters: {
            type: "object",
            properties: {
              overall: { type: "number" },
              stability: { type: "number" },
              growth: { type: "number" },
              risk: { type: "number" },
              currency: { type: "string" },
              summary: { type: "string" },
              opportunities: { type: "array", items: { type: "string" } },
              risks: { type: "array", items: { type: "string" } },
              top_sectors: { type: "array", items: { type: "string" } },
            },
            required: ["overall","stability","growth","risk","currency","summary","opportunities","risks","top_sectors"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "country_score" } },
    }),
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error("AI rate limit exceeded. Try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
    throw new Error(`AI gateway ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const json = await res.json();
  const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("AI returned no tool call");
  return JSON.parse(args);
}

export const scoreCountry = createServerFn({ method: "POST" })
  .inputValidator((input) => Input.parse(input))
  .handler(async ({ data }): Promise<CountryScore> => {
    const code = data.code.toUpperCase();

    // Check cache (24h TTL)
    if (!data.refresh) {
      const { data: cached } = await supabaseAdmin
        .from("country_scores")
        .select("data, updated_at")
        .eq("code", code)
        .maybeSingle();

      if (cached) {
        const age = Date.now() - new Date(cached.updated_at).getTime();
        if (age < TTL_MS) {
          const base = cached.data as Omit<CountryScore, "_cached" | "_age_hours">;
          return { ...base, _cached: true, _age_hours: Math.round(age / 3600000) };
        }
      }
    }

    // Call AI and upsert
    const fresh = await callGemini(data.name, code);
    await supabaseAdmin
      .from("country_scores")
      .upsert({
        code,
        name: data.name,
        data: fresh as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      });

    return { ...fresh, _cached: false, _age_hours: 0 };
  });
