import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { COUNTRIES } from "@/lib/countries-data";

export default defineTool({
  name: "list_countries",
  title: "List investable countries",
  description: "List the countries BSpot AI provides investment/business intelligence for, optionally filtered by region.",
  inputSchema: {
    region: z
      .enum(["Americas", "Europe", "Asia", "Middle East", "Africa", "Oceania"])
      .optional()
      .describe("Optional region filter."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ region }) => {
    const rows = region ? COUNTRIES.filter((c) => c.region === region) : COUNTRIES;
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { countries: rows },
    };
  },
});
