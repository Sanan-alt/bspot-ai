# BSpot AI Trust & Consistency Fix Pack — Plan

I'll work through the list end-to-end. No layout/color/component redesigns — only the targeted fixes you described. A couple of items below need a one-line decision from you before I run; I've called them out.

## Part 1 — Critical fixes

### 1. Canonical + og:url → bspot.info
Files: `src/routes/about.tsx`, `faq.tsx`, `privacy.tsx`, `terms.tsx`, `refund.tsx`, `__root.tsx` (`sameAs` link).
- Replace every `https://bspot-ai.lovable.app/...` in `og:url` and `<link rel="canonical">` with the matching `https://bspot.info/...`.
- Update `Organization.sameAs` in `__root.tsx` to `https://bspot.info`.
- Grep verification: zero `bspot-ai.lovable.app` references left in any meta tag.

### 2. Replace dead emails with `bspot.ai.official@gmail.com`
Files: `src/routes/privacy.tsx` (§1, §7, §13), `contact.tsx` (Security & Privacy cards), `faq.tsx` (delete-account answer).
- Replace `privacy@bspot-ai.lovable.app` and `trust@bspot-ai.lovable.app` everywhere with `bspot.ai.official@gmail.com`.
- Grep verification: no `@bspot-ai.lovable.app` strings remain.

### 3. "Meet the full team in the footer" (About page)
Default: **remove the sentence** from `src/routes/about.tsx` (line 55) since the footer has no team section.
- **Decision needed:** If you'd rather add a "Built by Team ApexMinds — <names>" line to `SiteFooter.tsx`, reply with the names. Otherwise I'll just remove the sentence.

### 4. Hot Destinations cards deep-link to specific country
Current: all 5 cards link to `/app/countries`. The countries page (`src/routes/app.countries.tsx`) uses internal `selectedCode` state and has no per-country route.
Fix:
- Add a validated search param `code` (e.g. `?code=AE`) to `/app/countries` via `validateSearch`. On mount, if `code` is present and matches a `COUNTRIES` entry, auto-select it (open the same dossier panel the click handler opens) and scroll the selected card into view.
- Update the 5 homepage cards in `src/routes/index.tsx` to `<Link to="/app/countries" search={{ code }}>` per country.

### 5. Persistent disclaimer in AI Assistant chat
Files: `src/routes/app.assistant.tsx` and `src/components/ChatbotFab.tsx` (the floating chatbot uses the same assistant — disclaimer goes in both).
- Add a single muted line pinned at the top of the chat panel: *"AI-generated guidance, not licensed financial/legal/immigration advice. Always confirm with a professional before acting."*
- Non-dismissible, one line, doesn't block input.

## Part 2 — Consistency fixes

### 6. Unify the country count
Source of truth: `COUNTRY_DEEP` in `src/lib/country-deep.ts` (10 countries with full deep profile data). `COUNTRIES` in `countries-data.ts` lists 55 selectable nations but most have only baseline data.
Plan:
- Keep the homepage stat at **"10"** (it already matches deep-data coverage) and add a tooltip/subtext clarifying "10 with full deep profiles, 55 selectable".
- Derive the Hot Destinations 5-card list from a single new exported constant `FEATURED_COUNTRIES` in `countries-data.ts` (default: `["US","GB","DE","CA","AE"]` — matches the current homepage).
- About page copy: rewrite the country list line to reference the same 5 featured countries (replacing the current `UAE/UK/Canada/Singapore/Türkiye` set so it matches Hot Destinations).
- **Decision needed (optional):** confirm the 5 featured should stay `US, UK, Germany, Canada, UAE`. If you want a different set, name them.

### 7. Branded OG/Twitter share image (1200×630)
- Generate one branded PNG via the image tool: dark BSpot theme, neon logo, tagline "Move Capital. Cross Borders. Build Empires.". Save as `src/assets/og-share.png` (uploaded via lovable-assets so it's served from the project's own CDN, not the Lovable preview screenshot endpoint).
- Update `og:image` + `twitter:image` in `__root.tsx` defaults and any per-route overrides (`index.tsx`, `about.tsx`, `contact.tsx`, `faq.tsx`, `privacy.tsx`, `terms.tsx`, `refund.tsx`) to point at this asset URL.
- Note to you in chat: crawler caches (WhatsApp/LinkedIn) won't refresh immediately — use each platform's preview debugger to force re-scrape.

### 8. Crawlable FAQ + FAQPage JSON-LD
File: `src/routes/faq.tsx` (and possibly `src/components/ui/accordion.tsx` if needed).
- Radix `AccordionContent` uses `hidden` + unmounted content. Replace the FAQ list on the FAQ page with a custom always-rendered version: visible question header, answer always in the DOM, collapsed visually via `max-height` / opacity, expanded on click. Keeps the accordion UX but the answers ship in raw HTML.
- Verify: `view-source:` shows all 10 answer strings.
- Add `FAQPage` JSON-LD `scripts` entry in the route's `head()` containing all 10 Q&A pairs.

### 9. "Real-time Alerts" homepage claim
- Inspection result so far: `notifications` table is read/displayed in `app.notifications.tsx`, but there's no producer (no triggers, no edge function pushing rate/portfolio events, no web-push registration).
- Fix: relabel the homepage tile in `src/routes/index.tsx` from "Real-time Alerts" to **"Smart Notifications (Coming Soon)"** with body adjusted to match. No removal of the notifications page itself.
- **Decision needed:** OK to relabel as "Coming Soon"? Alternative is full removal of the tile.

## Optional verification report
After fixes ship I'll inspect and reply with the current state of:
- Live Currency Converter (real ExchangeRate-API vs hardcoded).
- Business Suggestions (whether it references shared country data).
- Homepage "Try Demo — No Signup" button (end-to-end without auth).

## Things I will NOT do
- No layout, color, or component-structure changes outside the targeted fixes.
- Won't touch `src/integrations/supabase/*`, `src/routeTree.gen.ts`, or auth-generated files.

## Open decisions (reply inline; defaults will be used otherwise)
1. **#3 Team line in footer:** remove sentence (default) or add team credit with which names?
2. **#6 Featured 5 countries:** keep `US, UK, Germany, Canada, UAE` (default) or swap?
3. **#9 Alerts tile:** relabel as "Coming Soon" (default) or remove entirely?
