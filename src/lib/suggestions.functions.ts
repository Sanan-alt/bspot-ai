import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  budget_usd: z.number().min(100).max(100_000_000),
  country: z.string().max(80).optional(),
  sector: z.string().max(80).optional(),
  risk: z.enum(["low", "medium", "high"]),
  horizon_years: z.number().min(1).max(30),
});

const COST = 5;

export type Suggestion = {
  title: string;
  type: string;
  country: string;
  summary: string;
  est_roi_pct: number;
  risk_level: "low" | "medium" | "high";
  capital_required_usd: number;
  steps: string[];
  risks: string[];
};

export const suggestBusinesses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => Input.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY || process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("No AI provider configured");

    const { error: creditErr } = await context.supabase.rpc("consume_credits", {
      p_amount: COST,
      p_feature: "ai_suggestions",
      p_description: "Generate business suggestions",
    });
    if (creditErr) {
      if (creditErr.message?.includes("INSUFFICIENT_CREDITS")) {
        throw new Error(`Not enough credits — this action costs ${COST}.`);
      }
      throw new Error(creditErr.message || "Could not spend credits");
    }

    const userPrompt = `Generate 5 realistic, distinct investment / business opportunities for a foreign investor.

Constraints:
- Budget: USD ${data.budget_usd.toLocaleString()}
- Risk appetite: ${data.risk}
- Time horizon: ${data.horizon_years} years
- Preferred country: ${data.country || "any"}
- Preferred sector: ${data.sector || "any"}

Be specific (real industries, real countries). Include a mix of stocks/ETFs, real estate, small business, and emerging-market plays where appropriate.`;

    const { aiToolCall } = await import("./ai-provider.server");
    const { result } = await aiToolCall<{ suggestions: Suggestion[] }>(
      {
        messages: [
          { role: "system", content: "You are a senior investment strategist. Always call the suggest_investments tool." },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_investments",
            description: "Return 5 actionable investment suggestions.",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  minItems: 3,
                  maxItems: 5,
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      type: { type: "string", description: "e.g. Stock, ETF, Real Estate, Small Business, Bond" },
                      country: { type: "string" },
                      summary: { type: "string" },
                      est_roi_pct: { type: "number" },
                      risk_level: { type: "string", enum: ["low", "medium", "high"] },
                      capital_required_usd: { type: "number" },
                      steps: { type: "array", items: { type: "string" } },
                      risks: { type: "array", items: { type: "string" } },
                    },
                    required: ["title","type","country","summary","est_roi_pct","risk_level","capital_required_usd","steps","risks"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["suggestions"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "suggest_investments" } },
      },
      "suggest_investments",
    );
    return result.suggestions;
  });

