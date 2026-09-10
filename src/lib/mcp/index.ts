import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listCountriesTool from "./tools/list-countries";
import getVisaProgramsTool from "./tools/get-visa-programs";
import estimateSetupCostTool from "./tools/estimate-setup-cost";
import suggestInvestmentsTool from "./tools/suggest-investments";

// Use the direct Supabase host as the OAuth issuer (see MCP OAuth setup notes).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "bspot-ai-mcp",
  title: "BSpot AI",
  version: "0.1.0",
  instructions:
    "Cross-border investment & business-setup intelligence for founders from South Asia, the Middle East, and Africa moving capital into UAE, UK, Canada, Singapore, and the US. Use `list_countries` to see supported target markets, `get_visa_programs` for investor/entrepreneur visa routes by country, `estimate_setup_cost` for realistic first-year cost breakdowns by business type and country, and `suggest_investments` to generate 3–5 AI-powered investment and business opportunities personalised to a budget, country, sector, risk appetite, and time horizon (costs 5 credits per call).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listCountriesTool, getVisaProgramsTool, estimateSetupCostTool, suggestInvestmentsTool],
});
