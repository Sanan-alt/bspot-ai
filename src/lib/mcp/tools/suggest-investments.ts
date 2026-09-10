import { defineTool } from "@lovable.dev/mcp-js";
import { Input, type Suggestion } from "@/lib/suggestions.functions";
import { suggestBusinesses } from "@/lib/suggestions.functions";

export default defineTool({
  name: "suggest_investments",
  title: "Suggest investment & business opportunities",
  description:
    "Generate 3–5 AI-powered, personalised investment and business opportunities " +
    "tailored to the investor's budget, preferred country, sector, risk appetite, " +
    "and time horizon. Requires authentication. Costs 5 BSpot credits per call.",
  inputSchema: {
    budget_usd: Input.shape.budget_usd.describe(
      "Available investment budget in USD (100 – 100,000,000).",
    ),
    country: Input.shape.country.describe(
      "Preferred destination country (name or ISO code). Leave blank for global suggestions.",
    ),
    sector: Input.shape.sector.describe(
      "Preferred sector or industry (e.g. 'tech', 'real estate', 'hospitality').",
    ),
    risk: Input.shape.risk.describe("Risk appetite: low, medium, or high."),
    horizon_years: Input.shape.horizon_years.describe(
      "Investment time horizon in years (1 – 30).",
    ),
  },
  // readOnlyHint: false because each call deducts 5 credits (write side-effect).
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input) => {
    // suggestBusinesses owns auth (requireSupabaseAuth middleware),
    // credit deduction (consume_credits RPC), and the AI call (Gemini → Groq).
    const suggestions: Suggestion[] = await suggestBusinesses({ data: input });
    return {
      content: [{ type: "text", text: JSON.stringify(suggestions, null, 2) }],
      structuredContent: { suggestions },
    };
  },
});
