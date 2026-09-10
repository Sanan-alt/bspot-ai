# Requirements — Server-Side Price Alert Checker

## Current State (as of spec date)

A server-side price alert checker **already exists** at
`src/routes/api/public/jobs/price-alerts.ts` and is scheduled by `pg_cron`
every 15 minutes (see `supabase/migrations/20260822022510_*.sql`). This spec
documents the complete intended behaviour, identifies what is already
implemented, and calls out the gaps that still need to be closed.

---

## Functional Requirements

### FR-1 — Scheduled server-side evaluation
The system MUST periodically evaluate all active price alerts without requiring
the user to be on the Markets page.

- Schedule: every **15 minutes** via `pg_cron` + `pg_net` calling
  `POST /api/public/jobs/price-alerts`.
- The schedule MUST survive server restarts and tab closures.
- **Status: ✅ implemented** — cron job and endpoint both exist.

### FR-2 — Alert source
The job MUST query the `watchlists` table for every row where at least one
alert threshold is non-null and `alerts_paused = false`:

```sql
SELECT id, user_id, symbol, label, alert_above, alert_below
FROM watchlists
WHERE alerts_paused = false
  AND (alert_above IS NOT NULL OR alert_below IS NOT NULL)
ORDER BY updated_at ASC
LIMIT 300
```

- **Status: ✅ implemented** — exact query in `price-alerts.ts`.

### FR-3 — Price fetch
For each unique symbol in the result set, the job MUST fetch the current market
price. It MUST use Finnhub (real-time) as the primary source and fall back to
Yahoo Finance (~15-min delayed) when Finnhub is unavailable or the key is
absent. A concurrency cap (≤ 60 unique symbols, ≤ 4 parallel fetches) MUST be
applied to avoid hammering upstream APIs.

- **Status: ✅ implemented** — `src/lib/quotes.server.ts` (`fetchQuotes`).

### FR-4 — Threshold evaluation
For each watchlist row that has a fetched price:

| Condition | Action |
|---|---|
| `alert_above IS NOT NULL AND price >= alert_above` | Fire upper alert |
| `alert_below IS NOT NULL AND price <= alert_below` | Fire lower alert |
| Neither | No notification; update bookkeeping only |

Both conditions are evaluated independently — a single row can fire both an
upper and lower alert in the same run (if both are set and both are crossed).

- **Status: ✅ implemented**.

### FR-5 — Notification shape
When an alert fires the job MUST insert a row into the `notifications` table.
Required columns:

| Column | Value |
|---|---|
| `user_id` | `watchlists.user_id` of the row that fired |
| `type` | `"alert"` |
| `title` | `"<label|symbol> crossed above <threshold>"` or `"<label|symbol> dropped below <threshold>"` |
| `message` | Human-readable sentence including current price, change %, and a prompt to set a new alert |

Notifications MUST be inserted in a **single batch** (one `INSERT` call) after
all rows have been evaluated, to minimise database round-trips.

- **Status: ✅ implemented** — `type: "alert"` used in the server job.
- **Gap ⚠️**: The client-side checker (in `app.markets.tsx`) inserts
  notifications with `type: "price_alert"` (underscore). This inconsistency
  means the two layers produce differently-typed rows, which could confuse
  notification filtering downstream. See FR-8.

### FR-6 — Alert self-clearing (one-shot semantics)
After an alert fires the job MUST clear the corresponding threshold on the
`watchlists` row (`alert_above = NULL` or `alert_below = NULL`) so the same
crossing cannot produce a second notification on the next run. The job MUST
also record:

- `last_triggered_at = now()`
- `last_price = <fetched price>`
- `last_checked_at = now()`

Every checked row (whether it fired or not) MUST have `last_price` and
`last_checked_at` updated.

- **Status: ✅ implemented**.

### FR-7 — Single-flight / concurrency safety
Concurrent invocations of the job (e.g. two `pg_cron` ticks overlapping due
to a slow run) MUST NOT produce duplicate notifications. The job MUST acquire
an atomic DB lease before doing any work and exit early if it cannot acquire
it. The lease MUST auto-expire after 120 seconds so a crashed run does not
permanently block future runs.

A `paused` flag on the `job_state` row MUST allow an admin to disable the job
globally without touching the cron schedule.

- **Status: ✅ implemented** — `acquire_job_lease` / `release_job_lease` RPCs
  and the `job_state` table.

### FR-8 — Consistent notification `type` across client and server
The `type` field written to `notifications` MUST be the same whether the alert
is fired by the server job or by the client-side fallback checker, so that:

- `NotificationsListener` can apply the correct in-app preference check
  (`isInAppEnabled`).
- The Notifications page can display and filter all price alerts uniformly.

The canonical value is `"alert"` (already used by the server job and mapped to
"Market alerts" in `src/lib/notification-prefs.ts`).

- **Gap ⚠️**: The client in `app.markets.tsx` currently writes
  `type: "price_alert"`. It MUST be changed to `type: "alert"`.

### FR-9 — No double-firing between server job and client-side checker
When the server job has already cleared `alert_above` / `alert_below` (set to
`null`), the client-side checker in `app.markets.tsx` MUST NOT fire a
redundant notification for the same crossing.

The client reads `stockRows` from Supabase at login and on `loadWatchlist()`.
If the server has nulled the column before the next `loadWatchlist()` call, the
client will naturally see `alert_above: null` and skip the check — so
double-firing is mostly prevented by the one-shot clearing in FR-6.

However, there is a window: if the client loaded `stockRows` while
`alert_above` was still set (before the server run nulled it), the client can
still fire in-session during that window.

- **Accepted behaviour**: Both layers may fire within a short window around
  the same crossing; this is a best-effort duplicate-prevention system, not
  a strict exactly-once guarantee. The in-memory 10-minute dedup guard on the
  client (`triggered` ref) provides additional mitigation within a session.
- **No action required** beyond FR-8's type-consistency fix.

### FR-10 — Authorisation
The job endpoint MUST reject requests that do not carry a valid `apikey` or
`Authorization: Bearer` header matching either the anon key or the service-role
key. This prevents arbitrary external callers from triggering the job.

- **Status: ✅ implemented** — `authorized()` check at the top of the handler.
- The `pg_cron` schedule uses the service-role key stored in Supabase Vault
  (`email_queue_service_role_key`).

### FR-11 — Observability
The job MUST log its outcome (rows checked, alerts triggered, any error) in the
`job_state` table (`last_status`, `last_error`, `runs` counter, `last_run_at`).
Admins with the `owner` or `admin` role can query this table. The job MUST
return a JSON body with `{ ok, checked, triggered, error? }` for caller
inspection.

- **Status: ✅ implemented**.

---

## Non-Functional Requirements

### NFR-1 — Bounded resource use
A single run MUST NOT fetch more than 60 unique symbols or process more than
300 watchlist rows. These caps protect against Finnhub/Yahoo rate limits and
excessive DB I/O.

### NFR-2 — Idempotency under retry
If the `pg_net` call times out and `pg_cron` retries, the single-flight lease
ensures the second invocation exits early — so retries are safe.

### NFR-3 — Graceful degradation
If a symbol cannot be priced (both Finnhub and Yahoo return null), the row is
skipped silently. The remaining symbols continue to be evaluated.

### NFR-4 — No AI credit cost
Price alert checks MUST NOT consume BSpot credits. They are an infrastructure
feature, not an AI feature.

---

## Out of Scope

- Re-arming alerts automatically after they fire (user must set a new threshold).
- Push / email notifications on alert fire (a separate notification delivery
  pipeline handles that).
- Websocket / streaming price feeds for the server job (polling via
  `fetchQuotes` is sufficient at 15-minute granularity).
- Alerts on crypto or forex symbols (the `kind` column is not filtered; any
  symbol in `watchlists` with a price fetchable by Finnhub/Yahoo is eligible).
