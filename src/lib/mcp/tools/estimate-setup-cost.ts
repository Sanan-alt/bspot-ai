import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { COSTS, COUNTRY_META, BUSINESS_LABELS, computeTotal, type BusinessType, type CostCountry } from "@/lib/cost-data";

const BusinessEnum = z.enum([
  "ecommerce",
  "restaurant",
  "retail_shop",
  "tech_saas",
  "trading_import_export",
  "consulting_services",
  "real_estate_investment",
]);
const CountryEnum = z.enum(["AE", "GB", "CA", "SG", "US"]);

export default defineTool({
  name: "estimate_setup_cost",
  title: "Estimate first-year business setup cost",
  description: "Estimate first-year setup + operating cost (USD) for a business type in a supported country. Returns a full line-item breakdown plus 10% contingency total.",
  inputSchema: {
    business_type: BusinessEnum.describe("Type of business to launch."),
    country_code: CountryEnum.describe("Target country. Supported: AE, GB, CA, SG, US."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ business_type, country_code }) => {
    const b = business_type as BusinessType;
    const c = country_code as CostCountry;
    const breakdown = COSTS[b][c];
    const total_usd = computeTotal(breakdown);
    const meta = COUNTRY_META[c];
    const result = {
      business: BUSINESS_LABELS[b],
      country: meta.label,
      currency_note: `Local currency: ${meta.currency} (≈ ${meta.usdRate} per USD)`,
      notes: meta.notes,
      breakdown_usd: breakdown,
      total_usd,
      total_local: Math.round(total_usd * meta.usdRate),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});
