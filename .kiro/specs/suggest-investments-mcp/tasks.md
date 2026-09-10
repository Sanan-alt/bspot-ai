# Tasks — `suggest_investments` MCP Tool

## Checklist

### T-1 — Confirm `suggestBusinesses` call convention
- [ ] Verify the exact call form for `suggestBusinesses` when invoked from a
      server-side peer (not from the browser). The function is a TanStack Start
      `createServerFn` and is called using `suggestBusinesses({ data: input })`
      — the same form used by the browser UI. Confirm this form works correctly
      from the MCP handler context. Specifically:
  - Does calling `suggestBusinesses({ data: input })` inside a TanStack Start
    server request (the MCP handler) correctly surface the Bearer token through
    `getRequest()` to `requireSupabaseAuth`?
  - If yes, proceed to T-2.
  - If no, implement the loopback HTTP POST approach described in `design.md`
    (call the endpoint URL via `fetch` with an explicit `Authorization` header
    extracted from the incoming MCP request).
- **Note:** Do NOT use `.serverFn()` — that is not the correct call form for
  this function. Use `suggestBusinesses({ data: input })` as shown in the
  design skeleton.
- **Verification:** A console log or unit-level check showing `context.userId`
  is populated when `suggestBusinesses` is called from the MCP handler.

---

### T-2 — Create `src/lib/mcp/tools/suggest-investments.ts`
- [ ] Create the file following the skeleton in `design.md`.
- [ ] Import `defineTool` from `@lovable.dev/mcp-js` and `z` from `zod`
      (matching existing tools).
- [ ] Import `suggestBusinesses` from `@/lib/suggestions.functions`.
- [ ] Declare `inputSchema` matching `suggestions.functions.ts` `Input` schema
      (all five fields, same constraints).
- [ ] Set `annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false }`.
- [ ] Implement `handler` to call `suggestBusinesses` and return both `content`
      and `structuredContent`.
- [ ] Export the tool as default.
- **Verification:** TypeScript compiles with no errors (`tsc --noEmit`).

---

### T-3 — Register the tool in `src/lib/mcp/index.ts`
- [ ] Add `import suggestInvestmentsTool from "./tools/suggest-investments";`
      at the top of the file with the other tool imports.
- [ ] Add `suggestInvestmentsTool` to the `tools` array as the 4th entry.
- [ ] Update the `instructions` string to append mention of `suggest_investments`
      (see wording in `design.md`).
- **Verification:** `index.ts` compiles; `tools` array has 4 entries.

---

### T-4 — Build verification
- [ ] Run `tsc --noEmit` (or the project's type-check command) to confirm no
      TypeScript errors were introduced.
- [ ] Run the project linter (`eslint`) on the two changed/new files.
- [ ] Start the dev server and confirm the MCP endpoint responds (e.g.
      `GET /api/mcp` returns the tool manifest listing all 4 tools).

---

### T-5 — Manual smoke test (optional, post-approval)
- [ ] Using an MCP-capable client (or `curl` with a valid Supabase Bearer token),
      call `suggest_investments` with:
      `{ budget_usd: 20000, risk: "medium", horizon_years: 3 }`
- [ ] Confirm the response contains a `suggestions` array with 3–5 items.
- [ ] Confirm each item has all 9 required `Suggestion` fields.
- [ ] Confirm the calling user's credit balance decremented by 5.
- [ ] Call with insufficient credits and confirm the error message matches
      `"Not enough credits — this action costs 5."`.

---

## Files to Create / Modify

| Action | File |
|---|---|
| **Create** | `src/lib/mcp/tools/suggest-investments.ts` |
| **Modify** | `src/lib/mcp/index.ts` |

No other files need to change.
