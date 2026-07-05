import { defineMcp } from "@lovable.dev/mcp-js";
import listCountriesTool from "./tools/list-countries";
import getVisaProgramsTool from "./tools/get-visa-programs";
import estimateSetupCostTool from "./tools/estimate-setup-cost";

export default defineMcp({
  name: "bspot-ai-mcp",
  title: "BSpot AI",
  version: "0.1.0",
  instructions:
    "Cross-border investment & business-setup intelligence for founders from South Asia, the Middle East, and Africa moving capital into UAE, UK, Canada, Singapore, and the US. Use `list_countries` to see supported target markets, `get_visa_programs` for investor/entrepreneur visa routes by country, and `estimate_setup_cost` for realistic first-year cost breakdowns by business type and country.",
  tools: [listCountriesTool, getVisaProgramsTool, estimateSetupCostTool],
});
