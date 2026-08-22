# BSpot AI — Full Product & Technical Analysis (Investor Report)

Everything below is read from the live codebase and the live database on 22 Aug 2026. Where something is a placeholder or unfinished, it is labelled as such.

## 1. What the product is

BSpot AI (bspot.info) is a **cross-border investment and business-setup intelligence platform**. It is not a broker and not a charting terminal — it answers the question "where should I move money, start a company, or relocate, and what will it actually cost me from *my* country with *my* passport?"

Core value proposition: a single workspace combining (a) country-level investment/political/tax intelligence, (b) live market and FX data, (c) an AI advisor personalised to the user's nationality, budget, and target country, and (d) practical execution tooling (setup-cost calculator, visa guide, document vault, roadmap steps).

Target user, as encoded in the AI system prompt and country lists: **retail investors, founders, and diaspora from emerging markets** — Pakistan, India, Bangladesh, Egypt, Nigeria and the wider MENA/South Asia region — moving capital or relocating into UAE, UK, Canada, Singapore, Saudi Arabia, Germany, US, Australia, Portugal, Turkey. Secondary: emerging-market retail investors wanting USD-denominated market exposure with local-currency context.

## 2. Complete feature list (route by route)

### Public site
- `/` — landing page: hero, live `StockTicker`, feature grid, trust signals, `WorldMap`, theme toggle (light default), 12-language selector.
- `/about`, `/contact`, `/faq` (FAQ JSON-LD schema, crawlable answers), `/privacy`, `/terms`, `/refund`, `/unsubscribe`.
- `/country/$code` — public, SEO-indexable country page per country with JSON-LD (FAQ + How-to), internal links for long-tail SEO.
- `/sitemap.xml`, `public/robots.txt`, `public/llms.txt` (AI-crawler manifest).
- `/signin`, `/signup` — email/password + Google OAuth, login-attempt lockout (5 failures / 15 min via `check_login_lockout` + `record_login_attempt`).

### Authenticated app (`/app`)
- **`/app` Dashboard** — greeting, credit balance, counts for conversions / portfolio holdings / notifications / P&L, recent conversion feed, quick-action cards, `OnboardingBanner`, redirect to `/app/welcome` if `onboarded_at` is null.
- **`/app/welcome`** — 3-step onboarding wizard (experience level → sector interests → investment horizon), writes to `profiles`, telemetry-tracked, skippable.
- **`/app/markets`** (581 lines, the deepest module) — symbol search (Yahoo search API), TradingView-style `lightweight-charts` candlestick + line charts, 7 timeframes (1D/5D/1M/3M/6M/1Y/5Y, intraday 5m–15m), technical indicators computed locally (`SMA20`, `SMA50`, Bollinger Bands, RSI in `src/lib/indicators.ts`), configurable auto-refresh (5s/10s/30s/1m/5m), watchlist add/remove persisted to `watchlists`, price alerts (`alert_above` / `alert_below`), theme-aware chart palettes.
- **`/app/portfolio`** (674 lines) — holdings CRUD (name, ticker symbol, country, currency, invested amount, current value, notes), currency restricted to 20 major currencies, live quote refresh from the market layer, totals/P&L, donut allocation chart with flags and %, horizontal per-asset P/L bar chart (green/red, zero reference line), cumulative P/L area chart with timeframe selector (7d/30d/90d/1y/all), AI portfolio review (`optimizePortfolio`, 15 credits), CSV and PDF export (`jspdf` + `autotable`) including timeframe and summary metrics, locale-aware currency/date/percent formatting.
- **`/app/countries`** (439 lines) — country grid + search over 55 countries, `WorldInvestmentMap` (react-simple-maps + d3-geo), AI country scoring (`scoreCountry`, 20 credits, cached in `country_scores`), `CountryDossierPanel` (AI dossier: political stability, investment climate, business friendliness, safety, corruption, infrastructure, cost of living, current government/head of state/ruling party/next election, key macro stats, geopolitical role, latest political & economic events with impact, politics→investment translation, tax table, top sectors, profit margins, risks, opportunities), live macro overlay from `country_live_data` (FX, inflation, policy rate), `SectorBenchmarks`, visa programme summary.
- **`/app/assistant`** — BSpot Advisor chat. Streaming SSE via `/api/chat`, full conversation persisted in `chat_messages`, profile injected into every prompt (nationality, target country, budget, interests, experience, timeline), rate limited to 20 msgs/min, 2 credits per message, visible AI disclaimer. `ChatbotFab` gives the same assistant from any page.
- **`/app/visa`** — visa/residency programme guide: investor, entrepreneur, startup, golden and freelance visas by country, with minimum investment, processing time, and requirement checklists (`src/lib/visa-programs.ts`, 20 countries).
- **`/app/calculator`** — business setup cost calculator: business type × country, line items (trade licence/registration, investor visa, office 12 months, staffing 12 months, inventory/equipment, legal, contingency 10%), totals shown in USD **and** the user's home currency (PKR/INR/BDT/EGP/NGN/USD).
- **`/app/converter`** — live FX converter (exchangerate.host with open.er-api.com fallback), USD-strength comparison panel, saves each conversion to `conversions`.
- **`/app/documents`** — Document Vault: private Supabase Storage bucket `user-documents`, categorised uploads (passport, licence, bank, legal…), size/content-type metadata, notes.
- **`/app/history`** — Activity Log with two tabs: conversion history and full credit-transaction ledger (amount, type, feature, description, balance after, timestamp).
- **`/app/notifications`** — notification centre: keyword search, type and read-status filters, pagination (10/page), detail dialog, mark read/unread, mark-all-read, clear-all. `NotificationsListener` shows realtime Supabase toasts; the header bell carries a live unread badge.
- **`/app/settings`** — profile, language, theme, notification preferences per type/channel, **MFA enrolment (TOTP)** with `MfaEnrollment` + `RecoveryCodes` (bcrypt-hashed recovery codes, `regenerate_mfa_recovery_codes` / `consume_mfa_recovery_code`), idle-timeout hook.
- **`/app/buy-credits`** — three packs (Starter 200 cr / $0.55 / PKR 150; Pro 1,000 / $2.85 / PKR 800; Power 5,000 / $12.50 / PKR 3,500). **Checkout is a placeholder** — buttons toast "coming soon"; the underlying `purchaseCreditsMockFn` is owner-only.
- **Admin (`/app/admin`)** — owner/admin-gated (server-verified via `verifyOwnerFn`): credit-pack config, per-feature credit-cost table, user list with balances and credit granting, platform analytics (signups over time, credit economy).
- **`/app/admin/emails`** — email console: template registry (signup, magic link, recovery, invite, email change, reauthentication, receipt, app notification), previews, send log, suppression list.
- **`/app/admin/telemetry`** — recent RUM events for onboarding, portfolio load, and country page views, with error levels.

### Cross-cutting
12-language i18n (en, ur, hi, ar, fa, ru, fr, zh, ja, ko, it, bn) with RTL, runtime fallback to English, batched missing-key logging to `i18n_missing_keys`, and a build-time locale parity script (`scripts/check-locales.mjs`). Light/dark theme. Telemetry (`src/lib/telemetry.ts`), error capture, sonner toasts, custom neon-on-dark design system.

### MCP server (genuinely differentiating)
The site is itself an **MCP server** (`/mcp`, `/.mcp/list-tools`, `/.mcp/invoke-tool/$tool`, `/.well-known/oauth-protected-resource`, OAuth 2.1 consent screen) exposing three tools to external AI clients: `list_countries`, `get_visa_programs`, `estimate_setup_cost`. This makes BSpot data callable from Claude/ChatGPT-class agents — a distribution channel most finance apps do not have.

## 3. Data & AI

**Market/economic data sources (all live, no paid vendor):**
- Finnhub (`FINNHUB_API_KEY`) — primary quotes.
- Yahoo Finance chart/search endpoints — quote fallback, all OHLC candles, symbol search.
- Stooq CSV — index/mega-cap ticker fallback (S&P 500, Dow, Nasdaq, FTSE, Nikkei, AAPL/MSFT/GOOGL/AMZN/NVDA/TSLA/META).
- open.er-api.com and exchangerate.host — FX (USD/PKR, AED, INR, GBP, CAD and 20 currencies).
- World Bank API — inflation and policy-rate indicators.
Caching: 60s TTL in-memory market cache, 30-min stale-serve on upstream failure, retry with exponential backoff.

**AI layer** (`src/lib/ai-provider.server.ts`): dual-provider with automatic failover — **Gemini 2.5 Flash via the Lovable AI Gateway** as primary, **Groq `llama-3.3-70b-versatile`** as fallback. Same message array is handed over, so a Gemini outage mid-conversation continues on Groq with full context (streaming route saves the partial answer and resumes). Supports non-streaming text, tool-calling with JSON schema, and SSE streaming.

**AI-powered features:** country scoring (structured 0–100 scores via tool-call), country/city dossiers, portfolio optimisation advice, the personalised chat advisor, and suggestions. All AI calls are metered (`ai_usage`), rate limited (`check_ai_rate_limit`), and credit-charged server-side.

Technical differentiation vs a normal finance app: structured tool-call output (not free text) persisted as reusable cached intelligence, profile-conditioned prompting, provider failover, and an MCP surface.

## 4. Database & backend architecture

25 public tables, all RLS-enabled and owner-scoped. Live row counts today: profiles 132, credit_transactions 413, telemetry_events 296, chat_messages 62, investments 30, country_scores 22, country_live_data 16, watchlists 15.

- **Identity/roles:** `profiles` (home_country, target_country, budget, interests, experience, timeline, onboarded_at, is_demo, readiness_score), `user_roles` (separate table, `app_role` enum, `has_role()` security-definer — no role column on profiles), `login_attempts`, `mfa_recovery_codes`.
- **Credits:** `credits` (balance, last_free_grant_at), `credit_transactions` (ledger), `ai_usage` (rate-limit window).
- **Product data:** `investments`, `watchlists`, `conversions`, `user_documents`, `roadmap_steps`, `reminders`, `notifications`, `chat_messages`.
- **Intelligence caches:** `country_scores` (AI scores by country), `dossier_cache` (country/city dossiers), `country_live_data` (FX/inflation/policy rate per country).
- **Ops:** `telemetry_events`, `i18n_missing_keys`, `app_settings`, `email_send_log`, `email_send_state`, `suppressed_emails`, `email_unsubscribe_tokens`.

**Database functions:** `handle_new_user` (profile + role + signup credits on auth trigger), `claim_daily_free_credits`, `consume_credits`, `grant_credits`, `has_role`, `check_ai_rate_limit`, `check_login_lockout`, `record_login_attempt`, MFA recovery-code functions, plus a pgmq-backed email queue (`enqueue_email`, `read_email_batch`, `email_queue_dispatch`, `email_queue_wake`, `move_to_dlq`) driven by pg_cron + pg_net.

**Server logic** runs mostly as TanStack Start server functions (`*.functions.ts`) rather than edge functions: `markets`, `stocks`, `market`, `countries`, `dossier`, `country-live`, `portfolio`, `assistant`, `suggestions`, `credits`, `email-admin`. One Supabase edge function exists: **`refresh-country-data`** — daily cron-triggered, shared-secret protected, refreshes FX + World Bank inflation/policy rate for 16 countries into `country_live_data`. Public HTTP routes: `/api/chat` (SSE), email webhook/preview/queue routes, unsubscribe.

## 5. Credit system

- **Demo mode:** 50 credits. **Signup:** 100 credits (`handle_new_user`; currently set to a 500 launch bonus in the deployed function — worth reconciling before the pitch).
- **Daily top-up:** `claim_daily_free_credits()` grants +5 credits once per 24h, only when balance ≤ 5. Called automatically on app load.
- **Owner** (msaofficial account) is never charged — `consume_credits` short-circuits for the `owner` role and the UI shows ∞. **Admin** accounts are provisioned with 5,000.
- **Costs per action:** chat message 2, AI suggestion 5, country/city dossier 5, portfolio AI review 15, market data 15, map view 20, country score 20, business analytics 20, export 50, premium report 100.
- Every debit and grant is written to `credit_transactions` with `balance_after`, visible to the user in `/app/history`.
- Enforcement is server-side and atomic (conditional `UPDATE ... WHERE balance >= amount`, raising `INSUFFICIENT_CREDITS`), so the meter cannot be bypassed from the client.

Monetisation link: credits are the paywall. Free users get a slow trickle (5/day); heavy AI users must buy packs. Purchase is the only missing link.

## 6. User benefit vs incumbents

Bloomberg answers "what is the market doing" for institutions at ~$28k/seat. TradingView answers "what is this chart doing". Yahoo/Google answer "what is this price". None of them answer **"I'm a Pakistani national with $60k — should I open a Dubai free-zone company or a UK Ltd, what will year one actually cost me in PKR, which visa do I qualify for, what documents do I need, and is the political situation there stable right now?"** BSpot answers that in one session, in the user's language, with the numbers converted to their currency and the legal caveats flagged by nationality. The unfair advantage is the *join* — market data + macro + tax/visa law + cost models + personalised AI, for an audience the incumbents treat as a rounding error.

## 7. Business model & monetisation

Live today: credit packs (priced in USD and PKR, checkout pending). Planned/available:
1. **Credit purchases** — Lemon Squeezy as merchant of record (Pakistan-eligible; ~5% + $0.50/sale). Stripe/Paddle blocked by seller geography unless a UK entity is registered.
2. **Subscriptions** — monthly credit allowance + unlimited chat tiers.
3. **B2B / API + MCP licensing** — the MCP tool surface is already built and OAuth-protected; sell metered access to agents, fintechs, and relocation firms.
4. **Affiliate/referral** — free-zone formation agents, immigration lawyers, brokers, international bank accounts (high-ticket, natural fit at the end of a roadmap).
5. **Premium reports** — the 100-credit "premium report" tier already exists as a cost line.
6. **Ads** — an ad tag is currently integrated in the footer/head.
7. **White-label / enterprise** — diaspora banks and remittance players wanting an investment-intelligence layer.

## 8. Market opportunity

Geography targeted by the data itself: origin markets Pakistan, India, Bangladesh, Egypt, Nigeria, Turkey, Brazil, Chile; destination markets UAE, UK, Canada, Singapore, Saudi Arabia, Germany, US, Australia, Portugal. Anchors: ~$650bn+ annual remittance flows into low- and middle-income countries; 200m+ people in the South Asian and African diaspora; UAE alone issues tens of thousands of investor/golden visas a year; emerging-market retail brokerage accounts have grown into the hundreds of millions post-2020. The wedge — cross-border investors who are underserved by both their local brokerage app and Western terminals — is a multi-million-user addressable base with high willingness to pay because a single wrong jurisdiction decision costs thousands of dollars.

## 9. Competitive differentiation & moat

| | Bloomberg | TradingView | Seeking Alpha | Local broker app | BSpot |
|---|---|---|---|---|---|
| Cross-border legal/tax/visa | no | no | no | no | yes |
| Setup-cost modelling in home currency | no | no | no | no | yes |
| Personalised AI by nationality | no | no | no | no | yes |
| Live charts + indicators | yes | yes | partial | partial | yes |
| 12 languages incl. RTL | no | partial | no | partial | yes |
| Callable by external AI agents (MCP) | no | no | no | no | yes |
| Price | ~$28k/yr | $15–60/mo | $30/mo | free | free tier + micro-credits |

Moat candidates: the accumulating proprietary corpus in `country_scores` / `dossier_cache` / `country_live_data` (gets cheaper and better with every query), the cost/visa datasets (`cost-data.ts`, `visa-programs.ts`, `country-deep.ts`, `hub-cities.ts`, `sector-benchmarks.ts`), MCP distribution, and language/locale depth that Western incumbents will not build.

## 10. Current state — honest split

**Fully built and working:** auth (email + Google, MFA, lockout), onboarding, dashboard, live markets with charts/indicators/watchlists/alerts, portfolio with charts and exports, FX converter, setup-cost calculator, visa guide, country grid + world map, AI country scoring, AI dossiers, streaming AI assistant with failover and persistence, document vault, activity log, notification centre with realtime, settings, admin console (credits/users/analytics), email infrastructure with queue and templates, telemetry + admin telemetry viewer, 12-language i18n, SEO (sitemap, JSON-LD, canonicals, OG images, llms.txt), MCP server with OAuth.

**Not real yet:** (a) **payments** — buy-credits buttons are placeholders, no processor connected, no invoices; (b) **price alerts** store thresholds but there is no server-side job that evaluates them and pushes notifications; (c) **news aggregation** — none; (d) **community/social features** — none; (e) `roadmap_steps` and `reminders` tables exist but have no dedicated UI route; (f) `dossier_cache` and `notifications` are empty in production — the AI dossier and notification paths have little real usage; (g) macro refresh covers 16 countries while the UI lists 55, so many countries fall back to static data; (h) credit grant amounts differ between the stated spec (100) and the deployed trigger (500); (i) usage is pre-launch — 132 profiles, 30 holdings, 62 chat messages.

## 11. Technical stack

React 19 + TypeScript, TanStack Start v1 (SSR) + TanStack Router (file-based) + TanStack Query, Vite 7, Tailwind CSS v4 with a custom token system, shadcn/ui on Radix, lucide-react, motion, recharts (portfolio), lightweight-charts (markets), react-simple-maps + d3-geo (world map), i18next/react-i18next, react-hook-form + zod, jspdf/jspdf-autotable, sonner, date-fns.

Backend: Supabase (Postgres + RLS, Auth, Storage, Realtime, pg_cron, pg_net, pgmq) plus TanStack server functions running on Cloudflare Workers (`wrangler.jsonc`, `@cloudflare/vite-plugin`). Email via `@lovable.dev/email-js` + react-email templates with a queued sender. MCP via `@lovable.dev/mcp-js`. AI via the Lovable AI Gateway (Gemini 2.5 Flash) and Groq. Hosting on Lovable with custom domains `bspot.info` / `www.bspot.info`. Secrets configured: `FINNHUB_API_KEY`, `GROQ_API_KEY`, `LOVABLE_API_KEY`, `CRON_SECRET`, plus Supabase keys. Build runs a dependency audit (`bun audit --prod`) and a locale-parity check.

## Recommended pre-pitch fixes (small, high credibility impact)

1. Reconcile the signup credit grant (spec says 100, deployed trigger grants 500).
2. Either wire a price-alert evaluation job or stop presenting alerts as active.
3. Expand `refresh-country-data` from 16 to the full country list, or clearly label which countries have live macro.
4. Ship or hide `/app/buy-credits` checkout — placeholder buttons are the first thing a diligent investor will click.
