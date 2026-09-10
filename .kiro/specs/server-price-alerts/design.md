# Design — Server-Side Price Alert Checker

## Architecture Overview

Price alerts are evaluated by **two independent layers** that coexist
intentionally. The server job is the authoritative, always-on checker; the
client-side loop is a low-latency best-effort layer that only runs while the
user is actively on the Markets page.

```
┌─────────────────────────────────────────────────────────────────┐
│  pg_cron (every 15 min)                                         │
│    └─ pg_net.http_post → POST /api/public/jobs/price-alerts     │
│         └─ acquire_job_lease  (atomic, 120 s TTL)               │
│         └─ SELECT watchlists WHERE alert_* IS NOT NULL          │
│         └─ fetchQuotes()  (Finnhub → Yahoo fallback)            │
│         └─ evaluate thresholds                                  │
│         └─ UPDATE watchlists  (null out fired columns)          │◄─ authoritative clear
│         └─ INSERT notifications  (type: "alert")                │
│         └─ release_job_lease                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Browser (Markets page only — user must be viewing)             │
│    └─ useQuery refetchInterval (5 s–5 min, user-controlled)     │
│         └─ evaluate alert_above / alert_below from stockRows    │
│         └─ in-memory dedup  (10-min window per session)         │
│         └─ toast() + INSERT notifications  (type: "alert") ◄── fix needed
└─────────────────────────────────────────────────────────────────┘

Both layers write to:
  notifications (id, user_id, type, title, message, read, created_at)
  ↓
supabase_realtime publication
  ↓
NotificationsListener (postgres_changes INSERT subscription)
  ↓
toast() in the app shell
```

---

## Component Inventory

| Component | File | Role |
|---|---|---|
| **Job handler** | `src/routes/api/public/jobs/price-alerts.ts` | HTTP endpoint; orchestrates the entire server-side run |
| **Price fetcher** | `src/lib/quotes.server.ts` | `fetchQuotes(symbols)` — Finnhub + Yahoo fallback |
| **Lease RPCs** | `supabase/migrations/20260822021948_*.sql` | `acquire_job_lease` / `release_job_lease` Postgres functions |
| **Job state table** | `public.job_state` | Single-row store for lock, pause flag, run counter, last error |
| **Watchlists table** | `public.watchlists` | Source of alert thresholds; job writes back `null` on fire |
| **Notifications table** | `public.notifications` | Destination for fired alert rows; realtime-published |
| **cron schedule** | `supabase/migrations/20260822022510_*.sql` | `pg_cron` `*/15 * * * *` via `pg_net.http_post` |
| **Client-side checker** | `src/routes/app.markets.tsx` | In-browser `useEffect` on quote tick; best-effort fallback |
| **Realtime listener** | `src/components/NotificationsListener.tsx` | Shows toast on `notifications` INSERT; uses `isInAppEnabled` |

---

## Data Flow — Server Job (per run)

```
1. POST /api/public/jobs/price-alerts
   ├── authorized()? → reject 401 if no valid apikey/bearer
   ├── acquire_job_lease("price_alerts", 120)
   │     ├── returns false → respond { skipped: "locked_or_paused" } 200
   │     └── returns true  → proceed
   │
   ├── SELECT watchlists WHERE alerts_paused=false
   │     AND (alert_above IS NOT NULL OR alert_below IS NOT NULL)
   │     ORDER BY updated_at ASC LIMIT 300
   │
   ├── deduplicate symbols → cap at 60 unique
   ├── fetchQuotes(symbols, concurrency=4)
   │     ├── Finnhub /api/v1/quote  (if FINNHUB_API_KEY present)
   │     └── Yahoo Finance v8/finance/chart  (fallback)
   │
   ├── for each watchlist row:
   │     ├── q = quotes.get(row.symbol) → skip if null
   │     ├── patch = { last_price: q.price, last_checked_at: now() }
   │     │
   │     ├── if alert_above != null AND q.price >= alert_above:
   │     │     patch.alert_above = null          ← one-shot clear
   │     │     patch.last_triggered_at = now()
   │     │     notifications.push(...)
   │     │
   │     ├── if alert_below != null AND q.price <= alert_below:
   │     │     patch.alert_below = null          ← one-shot clear
   │     │     patch.last_triggered_at = now()
   │     │     notifications.push(...)
   │     │
   │     └── UPDATE watchlists SET ...patch WHERE id = row.id
   │
   ├── if notifications.length > 0:
   │     └── INSERT INTO notifications (batch)
   │
   └── release_job_lease("price_alerts", status, error?)
       └── respond { ok, checked, triggered, error? }
```

---

## Double-Firing Prevention

The two layers can overlap; this design accepts that and minimises overlap
rather than eliminating it entirely.

### Server → prevents its own re-fire
The column is set to `null` on the `watchlists` row immediately after the
alert fires. The next run's `WHERE alert_above IS NOT NULL` query will skip
this row. This is deterministic and permanent until the user sets a new
threshold.

### Client → prevents its own re-fire (within a session)
An in-memory `Set<string>` keyed by `${row.id}:above|below:${10-min bucket}`
deduplicates within a browser session. It does **not** survive page reloads.

### Cross-layer overlap window
Timeline of a potential double-fire:

```
t=0     pg_cron fires → server job begins
t=1     client loads stockRows (alert_above=250 still in DB)
t=2     quote tick → client evaluates: price=251, fires, inserts notification
t=3     server job nulls alert_above, inserts notification
        → TWO notifications exist for the same crossing
```

This window is bounded by the server job's run duration (typically < 10 s for
a small watchlist). The user receives two toasts. This is accepted as a
corner-case edge; eliminating it would require a distributed lock or
optimistic-concurrency check that adds complexity disproportionate to the
frequency of the event.

**Mitigation already in place:** the client's 10-minute in-memory dedup means
it cannot fire the same alert twice within a session regardless of the server.
If the server fires first and nulls the column, the client's *next* `loadWatchlist()`
call will fetch `null` and skip the row — ending the overlap permanently.

**Additional mitigation (part of the fix tasks):** after the client fires an
alert, it SHOULD reload `stockRows` (call `loadWatchlist()`) so the nulled
column is picked up promptly, shrinking the overlap window.

---

## How the Client-Side Checker Fits Alongside the Server Job

The client-side checker is intentionally **not removed**. Its role is to provide
sub-minute latency while the user is actively watching prices. The server job
fills the gap when the user is not on the page. This is the same dual-layer
pattern used by many financial apps (WebSocket in foreground, server push in
background).

The only required change to the client checker is:
1. Fix the notification `type` from `"price_alert"` → `"alert"` (FR-8).
2. Call `loadWatchlist()` after firing, so the in-DB null propagates to the
   client's local state promptly (reduces overlap window).

---

## Schema Contracts

### `watchlists` — alert-relevant columns

| Column | Type | Semantics |
|---|---|---|
| `alert_above` | `numeric \| null` | Trigger when `price >= this`; null = no upper alert |
| `alert_below` | `numeric \| null` | Trigger when `price <= this`; null = no lower alert |
| `alerts_paused` | `boolean DEFAULT false` | When true, server job skips this row entirely |
| `last_price` | `numeric \| null` | Most recent price seen by the server job |
| `last_checked_at` | `timestamptz \| null` | When the server job last evaluated this row |
| `last_triggered_at` | `timestamptz \| null` | When any alert on this row last fired |

The server job uses `supabaseAdmin` (service role) to write these columns,
bypassing RLS. The client reads them via the user-scoped client (RLS: `auth.uid() = user_id`).

### `notifications` — columns written by alert system

| Column | Value written | Notes |
|---|---|---|
| `user_id` | `watchlists.user_id` | Matches the alert owner |
| `type` | `"alert"` | Canonical value; maps to "Market alerts" in `notification-prefs.ts` |
| `title` | e.g. `"AAPL crossed above 250"` | |
| `message` | Full sentence with price, change %, re-arm prompt | |
| `read` | `false` (default) | |

### `job_state` — lease / observability

| Column | Semantics |
|---|---|
| `job_key` | `"price_alerts"` (primary key) |
| `locked_until` | Set to `now() + 120s` on acquire; nulled on release |
| `paused` | Admin can set to `true` to disable the job without touching pg_cron |
| `last_run_at` | Timestamp of the most recent acquire |
| `last_status` | `"ok"` \| `"error"` \| `"idle"` |
| `last_error` | Error message if `last_status = "error"` |
| `runs` | Incrementing counter |

---

## Authorization Model

The endpoint is **public** (no user auth required) but protected by a shared
secret check:

```
apikey header  OR  Authorization: Bearer <key>
  must equal SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY
```

The pg_cron schedule pulls the service-role key from Supabase Vault
(`email_queue_service_role_key`). This is the same vault secret used by the
email queue cron, so no new secrets need to be provisioned.

Inside the handler, `supabaseAdmin` (service-role client) is used for all DB
operations, giving the job full write access while bypassing per-user RLS.

---

## Price Data Sources

```
Symbol lookup order (per symbol, per run):

1. Finnhub  /api/v1/quote?symbol=<sym>&token=<FINNHUB_API_KEY>
   → returns { c: currentPrice, pc: prevClose, dp: changePct }
   → used if FINNHUB_API_KEY is set and response is valid

2. Yahoo Finance  v8/finance/chart/<sym>?interval=1d&range=5d
   → returns regularMarketPrice (may be ~15 min delayed outside market hours)
   → used as fallback when Finnhub fails or key is absent
```

For non-US symbols (e.g. crypto, international equities), Yahoo Finance is the
practical source since Finnhub free-tier coverage is US-focused.

---

## Notification Delivery Path (after INSERT)

```
supabaseAdmin.from("notifications").insert([...])
  ↓
Supabase Realtime (notifications table is in supabase_realtime publication,
                   REPLICA IDENTITY FULL)
  ↓
NotificationsListener postgres_changes subscription
  ↓
isInAppEnabled(n.type)   ← checks "alert" type → "Market alerts" pref
  ↓
toast(n.title, { description: n.message, action: "View" })
```

The Notifications page (`/app/notifications`) also queries this table on load,
so alerts are visible there even if the user missed the toast.

---

## What Is Already Built vs. What Needs Work

| # | Item | Status |
|---|---|---|
| Server job (`price-alerts.ts`) | All logic: lease, query, fetch, evaluate, clear, notify | ✅ Done |
| Price fetcher (`quotes.server.ts`) | Finnhub + Yahoo, concurrency cap | ✅ Done |
| DB schema | `watchlists` bookkeeping columns, `job_state`, lease RPCs | ✅ Done |
| pg_cron schedule | Every 15 min, Vault-backed apikey | ✅ Done |
| Notification realtime delivery | `supabase_realtime` publication + `NotificationsListener` | ✅ Done |
| **Client `type` inconsistency** | Client writes `"price_alert"`, should be `"alert"` | ❌ Fix needed |
| **Client post-fire reload** | Client doesn't call `loadWatchlist()` after firing | ❌ Fix needed |
