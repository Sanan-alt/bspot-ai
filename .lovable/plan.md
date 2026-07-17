# BSpot AI — Audit + Focused Improvement

You picked **Audit + one feature area I pick next**, with **design preserved exactly** and no explicit "do not touch" zones.

The audit below is the first deliverable. The implementation slice for this round is at the end — **AI Assistant streaming**, chosen because it's the highest visibility-to-risk ratio and requires **zero visual changes**.

---

## Part 1 — Audit summary

Every claim below is grounded in a specific file. Nothing is edited in this plan.

### ✅ Working well
- **Auth basics**: email/password, Google OAuth, anonymous demo, login lockout, 30-min idle timeout, TOTP enroll + recovery codes, `next` redirect param validated same-origin.
- **Credit enforcement**: server-side RPCs (`consume_credits`) run before every paid AI action; realtime balance sync; free daily top-up is idempotent; anon role is `REVOKE`d from sensitive RPCs.
- **Countries**: 24h AI-scored cache, cron-refreshed macro data via a shared-secret-guarded edge function, age-based freshness badge.
- **Security posture**: `supabaseAdmin` is a lazy Proxy used in only 2 files; `attachSupabaseAuth` registered globally in `src/start.ts`; deny-all RLS on `login_attempts` / `mfa_recovery_codes` forces access through `SECURITY DEFINER` functions.
- **SEO**: full OG/Twitter tags + `Organization` JSON-LD in `__root.tsx`, real sitemap route, `robots.txt` correctly blocks `/app/`, `/signin`, `/signup`.
- **Mobile**: shadcn `Sidebar collapsible="icon"` + responsive `hidden sm:` / `hidden lg:` classes throughout — no obvious overflow.

### ⚠️ Partial / needs attention (not fixed in this round)
| Area | Gap | Priority |
|---|---|---|
| Auth | Auth gate is a client-side `useEffect` redirect in `src/routes/app.tsx`, not a `_authenticated/` layout with `beforeLoad` — protected shell briefly mounts before redirect | Medium |
| Auth | **TOTP MFA is enrolled but never challenged at sign-in** — no `mfa.getAuthenticatorAssuranceLevel()` step exists anywhere outside the enrollment component. 2FA is cosmetic unless Supabase project settings force AAL2 server-side | **High** |
| Portfolio | Only one generic asset type; `current_value` is manual (no live pricing); no CSV/PDF export | Medium |
| AI Assistant | No streaming (static "Thinking…"); no image/PDF input despite Gemini being multimodal; `ChatbotFab` is a link, not a popover | **High (partly fixed this round)** |
| Countries | Live-data covers 16 hardcoded countries only; alpha2↔alpha3 map duplicated in 3 files; `src/components/WorldMap.tsx` (~99 lines) is dead code | Medium |
| Credits | Real payments not wired — `purchaseCreditsMockFn` is owner-gated and explicitly a mock; client-side `CREDIT_COSTS` mirror drifts from server costs | Medium |
| Notifications | No browser push, no email pipeline hookup to the existing template system; `clearAll()` uses raw `window.confirm` instead of the project's `AlertDialog` | Low–Medium |
| i18n | 19 keys present in `en.json` are missing from `ar/hi/ur` — silent English fallback mid-RTL | Medium |
| SEO | No per-route `canonical` / `og:url` on most pages | Low |
| Perf | `react-simple-maps` + `d3-geo` imported eagerly on `/app/countries`; `world-atlas` TopoJSON fetched from jsDelivr on every mount | Low–Medium |

None of these are critical enough to block anything shipping. The one I'd flag is **MFA enforcement at sign-in** — worth its own follow-up.

### Not touched by this round
- Real payments (Stripe wiring)
- Any UI redesign
- Any DB schema change
- Any auth flow rewrite
- Portfolio live-pricing hookup
- Web push / email pipeline

---

## Part 2 — Focused implementation: AI Assistant streaming

**Why this one:** the chat is behind `ChatbotFab` on every dashboard page. Today `sendChatMessage` awaits the entire Gemini response before returning a single JSON blob, and the UI shows a static "Thinking…" bubble for the whole duration. Switching to SSE streaming keeps the existing bubble, existing input, existing everything — the assistant message just fills in progressively. Design preserved exactly.

### What changes

1. **New streaming server route** `src/routes/api/chat.ts`
   - `POST` handler, `requireSupabaseAuth`-equivalent by reading the bearer from the incoming request headers and validating with `getClaims` (same pattern the middleware uses; server routes can't use fn middleware).
   - Runs the **same pre-checks in the same order** as `sendChatMessage`: rate-limit RPC → `consume_credits` RPC → persist user message → load profile + last 20 messages → build the identical system prompt.
   - Calls the Lovable AI Gateway with `stream: true`, returns a `Response` with `Content-Type: text/event-stream`, forwarding SSE chunks straight through.
   - When the upstream stream closes, persists the accumulated assistant reply to `chat_messages` (same insert `assistant.functions.ts` does today).
   - Maps 429 / 402 into structured SSE `error` events the client can render, so the current "AI rate limit" / "credits exhausted" toasts still fire.

2. **Keep `sendChatMessage` server fn as-is** — it's a fine non-streaming fallback. Do not delete it. Any other caller keeps working.

3. **Client swap in `src/routes/app.assistant.tsx`**
   - Replace the current `useServerFn(sendChatMessage)` + `await` with a `fetch("/api/chat", ...)` that reads the SSE stream (`ReadableStream` + `TextDecoder`).
   - Push a placeholder assistant message into the existing `messages` state immediately, then append token deltas to its `content` on each chunk. Existing bubble component renders the growing string with no visual change.
   - On completion, refetch `useCredits` balance (already realtime-subscribed, so this is belt-and-suspenders).
   - On SSE `error` event, show the same `toast.error` copy the current code uses.
   - Preserve: markdown rendering (if any), auto-scroll to bottom, the "Thinking…" indicator now becomes the empty placeholder bubble that starts filling in.

4. **Bearer attachment**
   - `attachSupabaseAuth` is a `functionMiddleware`, so it doesn't run for `fetch()` calls to `/api/chat`. The client `fetch` sends `Authorization: Bearer ${session.access_token}` manually (read from `supabase.auth.getSession()` in the same call).

5. **No changes to**: sidebar, page layout, message bubble styling, empty state, credit costs (still 2/msg), rate limit (still 20/60s), system prompt, profile injection, `chat_messages` schema, RLS.

### Files touched
- **Add** `src/routes/api/chat.ts` (~120 lines)
- **Edit** `src/routes/app.assistant.tsx` — swap the send-message handler only; JSX untouched
- **Keep** `src/lib/assistant.functions.ts` unchanged

### Verification
- Manual: send a chat message in preview, confirm the assistant bubble fills incrementally, credits decrement by 2, rate limit still trips at 20/min, "Not enough credits" toast still appears when balance <2.
- No new deps required (SSE parsing is a small inline helper; no `eventsource-parser` install).

### Technical notes (skip if not interested)
- Server route lives at `src/routes/api/chat.ts` (not `api/public/chat.ts`) so the platform's published-site auth gate applies as an extra layer on top of our bearer check. This matches the "authenticated app-internal chat" pattern.
- The upstream Lovable AI Gateway supports OpenAI-style SSE (`data: {...}\n\n` frames). We forward frames as-is with a `data: [DONE]` sentinel at the end.
- Credit consumption stays server-side and **before** the AI call, exactly as today. If the upstream stream errors mid-flight, the user has already been charged — same behavior as the current non-streaming path (which also charges before the fetch). No change in economics.

### Follow-up candidates (not this round)
If you like this result, the natural next slices are, in order:
1. **MFA challenge at sign-in** (High severity, small code change)
2. **Multimodal chat input** (image/PDF upload to the same `/api/chat` route)
3. **i18n key backfill** (mechanical, invisible-to-design)
4. **Delete `WorldMap.tsx` + centralize alpha2/3 map + lazy-load the map** (perf cleanup)

Ready to implement Part 2 on approval.
