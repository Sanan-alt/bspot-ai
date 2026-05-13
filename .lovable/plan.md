
# BSpot AI — Phased Build Plan

The requirements document specifies a full investment platform: cyberpunk black/yellow theme, auth (email + Google OAuth), dashboard with 9 sections (currency converter, business suggestions, interactive country map, conversion history, portfolio tracker, notification center, AI assistant, settings), real-time notifications, AI chatbot, and a detailed footer. This is roughly 4–6 sessions of work — not buildable in a single response with quality.

I'll deliver it in phases, each phase shippable on its own.

## Phase 1 — Foundation (this turn)
- Cyberpunk black/yellow design system in `src/styles.css` (neon yellow accents, dark bg, glassmorphism tokens, glow shadows, monospace + display font pair)
- Enable Lovable Cloud (database + auth)
- Auth pages: Sign Up, Sign In, Terms & Conditions (email/password + Google OAuth, terms checkbox, password strength)
- Auth state + protected `_authenticated` layout
- Dashboard shell: animated sidebar, top nav with notification bell + profile dropdown, floating chatbot button placeholder
- Home Overview page with stat cards, activity log, quick-access cards
- Global footer with Team ApexMinds credits
- Routes scaffolded for the other 8 dashboard pages (placeholder content)

## Phase 2 — Core investment tools
- Currency Converter (live FX via free API, save-to-history)
- Conversion History (table, filters, CSV export)
- Country Data with interactive world map (react-simple-maps), country detail panel, AI-scored insights
- Business Suggestions (AI-generated via Lovable AI Gateway, budget filter, save favorites)

## Phase 3 — Portfolio & notifications
- Portfolio Tracker (CRUD investments, performance charts via recharts, P/L breakdowns, AI optimization suggestions)
- Notification Center (Supabase Realtime, filter tabs, mark read/delete)
- Settings (profile, language, theme, notification prefs, security)

## Phase 4 — AI Assistant + polish
- Full AI Assistant page (Lovable AI streaming chat, reminder management, stock alert subscriptions, economic tracker)
- Floating chatbot widget with same backend
- Cron-based daily stock alert dispatcher
- Spell-check, chat export, accessibility pass, mobile polish

## Technical details
- **Stack**: TanStack Start + React 19, Tailwind v4 design tokens in `src/styles.css`, shadcn components with custom `cyber` variants, framer-motion for animations
- **Backend**: Lovable Cloud (Postgres + Auth + Realtime + Edge); roles in separate `user_roles` table per security policy
- **Tables (Phase 1+)**: `profiles`, `user_roles`, then `conversions`, `investments`, `notifications`, `reminders`, `chat_messages`, `favorite_suggestions`, `notification_preferences`
- **AI**: Lovable AI Gateway (`google/gemini-2.5-flash` default) for business suggestions, country scoring, chatbot, portfolio optimization
- **FX**: free `exchangerate.host` (no key) for live rates
- **Map**: `react-simple-maps` with TopoJSON world atlas
- **Charts**: `recharts`

## What I need from you
1. **Confirm phased approach** — OK to ship Phase 1 now, then continue?
2. **Google OAuth** — I'll wire the UI button; you'll need to add Google credentials in Lovable Cloud settings before it works (I'll give instructions). Facebook OAuth in the spec is not natively supported by Lovable Cloud — I'll omit the button unless you want a custom OAuth setup.
3. **Languages** — spec lists English/Urdu/Hindi/Chinese. UI strings only English in Phase 1; full i18n is a Phase 4 task. OK?
