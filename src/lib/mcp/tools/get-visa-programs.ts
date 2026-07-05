import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { VISA_PROGRAMS } from "@/lib/visa-programs";

export default defineTool({
  name: "get_visa_programs",
  title: "Get visa & residency programs",
  description: "Return investor, entrepreneur, startup, and golden visa programs available in a target country (ISO 3166-1 alpha-2 code, e.g. AE, GB, US, CA, SG).",
  inputSchema: {
    country_code: z
      .string()
      .length(2)
      .describe("ISO 3166-1 alpha-2 country code, uppercase (e.g. AE, GB, US)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ country_code }) => {
    const code = country_code.toUpperCase();
    const programs = VISA_PROGRAMS[code] ?? [];
    if (programs.length === 0) {
      return {
        content: [{ type: "text", text: `No visa program data available for ${code}. Supported: ${Object.keys(VISA_PROGRAMS).join(", ")}` }],
        structuredContent: { country_code: code, programs: [] },
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify({ country_code: code, programs }, null, 2) }],
      structuredContent: { country_code: code, programs },
    };
  },
});
