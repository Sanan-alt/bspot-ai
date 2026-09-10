# Design — `suggest_investments` MCP Tool

## Architecture Summary

The new tool is a thin MCP adapter layer over `suggestBusinesses`. It
**delegates all business logic** (credit deduction, AI call, prompt
construction, response parsing) to the existing server function rather than
duplicating it.

```
MCP Client (agent)
  │  tool: suggest_investments
  ▼
src/lib/mcp/tools/suggest-investments.ts   ← new file
  │  defineTool({ handler })
  │  1. Validate input (Zod, inline schema)
  │  2. Call suggestBusinesses({ ... })
  │  3. Format result into MCP return shape
  ▼
src/lib/suggestions.functions.ts
  │  suggestBusinesses (createServerFn)
  │  1. requireSupabaseAuth middleware (token → context.supabase)
  │  2. consume_credits RPC (–5 credits, pre-deduction)
  │  3. aiToolCall (Gemini → Groq failover)
  │  4. Return Suggestion[]
  ▼
Supabase + AI Gateway / Groq
```

---

## Why Not Call the AI Directly?

`suggestBusinesses` already encapsulates:
- Auth: validated Supabase client injected by `requireSupabaseAuth`
- Credits: `consume_credits` RPC called under the user's Row-Level-Security context
- AI failover: Gemini primary → Groq fallback via `aiToolCall`
- Prompt engineering: system prompt, user prompt template, forced tool-call schema

Re-implementing any of this in the MCP tool layer would create divergence risk
(e.g. future credit cost changes would need to be updated in two places).

---

## How the Auth Context Flows

The MCP server is configured with Supabase OAuth:

```ts
auth: auth.oauth.issuer({
  issuer: `https://${projectRef}.supabase.co/auth/v1`,
  acceptedAudiences: "authenticated",
})
```

This means the `@lovable.dev/mcp-js` runtime validates the Bearer token before
any tool handler runs, and the handler receives the raw request context. The
MCP tool handler must reconstruct a Supabase client from that token and pass it
to `suggestBusinesses` in a way that satisfies the `requireSupabaseAuth`
middleware.

### Approach: inject `Authorization` header via `fetch` shim / server context

`suggestBusinesses` is a `createServerFn` from TanStack Start. When called
from the MCP tool handler (server-side, same process), the middleware reads the
`Authorization` header from `getRequest()` (TanStack's request accessor).

The MCP tool handler calls `suggestBusinesses` using its `.serverFn(input)`
call form. For the middleware to find the token, the incoming MCP HTTP request
must carry the Bearer token in its own `Authorization` header — which it does,
because the `@lovable.dev/mcp-js` layer already authenticated it and the
original request object is still in scope.

**Result:** No extra wiring needed. The same Bearer token that authenticated
the MCP request flows naturally into `suggestBusinesses` when it is called
in-process, because TanStack's `getRequest()` returns the current in-flight
request.

> If integration testing reveals the request context is not forwarded, the
> fallback is to call `suggestBusinesses` via a loopback HTTP POST to
> `/api/suggestBusinesses` with the `Authorization` header explicitly set.
> This is noted in the tasks as an investigation step before implementation.

---

## File Layout

```
src/lib/mcp/
├── index.ts                         ← add import + array entry + update instructions
└── tools/
    ├── list-countries.ts            (unchanged)
    ├── get-visa-programs.ts         (unchanged)
    ├── estimate-setup-cost.ts       (unchanged)
    └── suggest-investments.ts       ← new file
```

---

## New File: `suggest-investments.ts`

### Skeleton

```ts
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { suggestBusinesses } from "@/lib/suggestions.functions";

export default defineTool({
  name: "suggest_investments",
  title: "Suggest investment & business opportunities",
  description:
    "Generate 3–5 AI-powered, personalised investment and business opportunities " +
    "tailored to the investor's budget, preferred country, sector, risk appetite, " +
    "and time horizon. Costs 5 BSpot credits per call.",
  inputSchema: {
    budget_usd: z.number().min(100).max(100_000_000)
      .describe("Available investment budget in USD (100 – 100,000,000)."),
    country: z.string().max(80).optional()
      .describe("Preferred destination country (name or ISO code). Leave blank for global suggestions."),
    sector: z.string().max(80).optional()
      .describe("Preferred sector or industry (e.g. 'tech', 'real estate', 'hospitality')."),
    risk: z.enum(["low", "medium", "high"])
      .describe("Risk appetite: low, medium, or high."),
    horizon_years: z.number().min(1).max(30)
      .describe("Investment time horizon in years (1 – 30)."),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input) => {
    // suggestBusinesses handles auth middleware, credit deduction, and AI call.
    const suggestions = await suggestBusinesses({ data: input });
    return {
      content: [{ type: "text", text: JSON.stringify(suggestions, null, 2) }],
      structuredContent: { suggestions },
    };
  },
});
```

### Error handling

`suggestBusinesses` throws `Error` instances with descriptive messages for all
failure modes. The `@lovable.dev/mcp-js` `defineTool` runtime catches thrown
errors and converts them into MCP error responses automatically, so no
try/catch is needed in the handler — but one can be added to map error
messages to more agent-friendly text if desired.

---

## Changes to `src/lib/mcp/index.ts`

1. Add import:
   ```ts
   import suggestInvestmentsTool from "./tools/suggest-investments";
   ```

2. Add to the `tools` array:
   ```ts
   tools: [listCountriesTool, getVisaProgramsTool, estimateSetupCostTool, suggestInvestmentsTool],
   ```

3. Append to `instructions`:
   ```
   Use `suggest_investments` to generate 3–5 AI-powered investment and business
   opportunities personalised to a budget, country, sector, risk appetite, and
   time horizon (costs 5 credits per call).
   ```

---

## Input Validation Contract

The Zod schema in the MCP tool mirrors the `Input` schema in
`suggestions.functions.ts` exactly. This means invalid inputs are caught twice:
once by the MCP layer (returning a structured MCP validation error before any
auth or credit cost is incurred) and once by `suggestBusinesses`'s own
`.inputValidator()`. This is intentional and safe — the second check is
effectively unreachable if inputs are properly validated upstream.

---

## Credit/Auth Ownership

| Concern | Owner |
|---|---|
| Token validation | `@lovable.dev/mcp-js` OAuth layer (transport) |
| Supabase client construction | `requireSupabaseAuth` middleware |
| Credit deduction | `suggestBusinesses` handler |
| AI call & prompt | `suggestBusinesses` handler |
| MCP input schema validation | `suggest-investments.ts` `inputSchema` |
| MCP output formatting | `suggest-investments.ts` `handler` |

---

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| `getRequest()` doesn't carry the Bearer token in the MCP call path | Medium | Investigate during task T-3; fallback to loopback HTTP if needed |
| `suggestBusinesses` call signature changes | Low | It's a TanStack server function — breaking changes would also break the UI; caught by TypeScript |
| AI credits charged but AI fails (pre-deduction) | Low (existing) | Already accepted by the current UI implementation; out of scope for this task |
| Duplicate tool name conflict with internal AI tool | None | The internal AI function named `suggest_investments` is ephemeral (inside the LLM tool-call schema), not a registered MCP tool |
