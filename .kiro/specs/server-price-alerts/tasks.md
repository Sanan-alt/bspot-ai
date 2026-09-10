# Tasks — Server-Side Price Alert Checker

## Status Summary

The server-side infrastructure is **fully implemented**. The only remaining
work is two small fixes to the client-side checker in `app.markets.tsx` to
align it with the server's behaviour.

---

## Tasks

### T-1 — Fix notification `type` in the client-side alert checker
**File:** `src/routes/app.markets.tsx`
**Why:** The client currently inserts `type: "price_alert"` into the
`notifications` table. The server job uses `type: "alert"`. The canonical
value is `"alert"` — it maps to "Market alerts" in `notification-prefs.ts`
and is what `NotificationsListener`'s `isInAppEnabled` check evaluates against.
Leaving the inconsistency means client-fired alerts bypass the user's
in-app notification preference.

**Change:** In the `useEffect` that evaluates quote ticks, update the
`supabase.from("notifications").insert(...)` call:

```diff
- await supabase.from("notifications" as never).insert({
-   user_id: user.id, type: "price_alert", title, message,
- } as never);
+ await supabase.from("notifications" as never).insert({
+   user_id: user.id, type: "alert", title, message,
+ } as never);
```

- [ ] Locate the `useEffect` that fires on `qData` changes (~line 108 in
      `app.markets.tsx`).
- [ ] Change `type: "price_alert"` to `type: "alert"`.
- **Verification:** After the change, a client-side alert fire produces a
  `notifications` row with `type = "alert"`, matching the server job's output.
  Confirm via Supabase Table Editor or `SELECT type FROM notifications ORDER BY
  created_at DESC LIMIT 5`.

---

### T-2 — Reload watchlist after client fires an alert
**File:** `src/routes/app.markets.tsx`
**Why:** After the client fires an alert and inserts a notification, it does
not refresh `stockRows` from the database. This means the client continues
evaluating the now-stale `alert_above`/`alert_below` values in memory. The
in-memory dedup set prevents a second toast within the same 10-minute bucket,
but on the next bucket boundary the client would re-fire if the server hasn't
nulled the column yet (or if the server job hasn't run at all — e.g. Finnhub
was down for the last 15-minute window).

Calling `loadWatchlist()` immediately after the insert fetches the current DB
state, which will reflect the server's `null` if the server already ran, or
continue with the threshold set if neither layer has truly fired yet (no data
loss either way).

**Change:** Add a `loadWatchlist()` call after the notification insert, inside
the same async block in the alert-evaluation `useEffect`:

```diff
  await supabase.from("notifications" as never).insert({
    user_id: user.id, type: "alert", title, message,
  } as never);
+ await loadWatchlist();
```

- [ ] Locate the async IIFE inside the alert-evaluation `useEffect`.
- [ ] Add `await loadWatchlist()` after the `supabase.from("notifications").insert(...)` call.
- **Verification:** Set an alert on a symbol, manually trigger a price that
  crosses it (or temporarily lower the threshold below the current price in
  the DB). Confirm the alert fires once in the browser, then `stockRows` is
  refreshed and the alert threshold shows as cleared in the UI.

---

### T-3 — Build and type-check verification
- [ ] Run `tsc --noEmit` (or the project's type-check command) to confirm no
      TypeScript errors were introduced by T-1 and T-2.
- [ ] Run the linter on `src/routes/app.markets.tsx`.
- **Verification:** Zero type errors, zero lint errors on the changed file.

---

### T-4 — Confirm server job is reachable (smoke test, post-approval)
The server job and cron schedule are already in place; this task verifies they
are wired together correctly in the deployed environment.

- [ ] In Supabase Dashboard → Database → Cron Jobs, confirm a job named
      `price-alerts-check` exists with schedule `*/15 * * * *`.
- [ ] In Supabase Dashboard → Database → Vault, confirm a secret named
      `email_queue_service_role_key` exists (already used by email queue cron).
- [ ] Manually trigger the endpoint once with a valid service-role key:
  ```
  curl -X POST https://<project-url>/api/public/jobs/price-alerts \
    -H "apikey: <service_role_key>" \
    -H "Content-Type: application/json" \
    -d '{}'
  ```
  Confirm the response is `{ "ok": true, "checked": <n>, "triggered": <n> }`.
- [ ] Query `SELECT * FROM job_state WHERE job_key = 'price_alerts'` and
      confirm `last_status = 'ok'` and `last_run_at` is recent.
- [ ] If any watchlist rows had active alerts and prices crossed, confirm
      corresponding `notifications` rows were inserted with `type = 'alert'`.

---

### T-5 — End-to-end double-fire validation (optional, post-approval)
Verifies that the two layers do not produce excessive duplicate notifications
for the same crossing.

- [ ] Set `alert_above` on a watched symbol to just below its current price.
- [ ] Wait for the next pg_cron tick (up to 15 min), or manually POST the job
      endpoint, to trigger the server-side fire.
- [ ] Confirm: one notification row is inserted with `type = "alert"` and
      `alert_above` is now `null` on the watchlists row.
- [ ] Without reloading the page, wait for the next client-side quote tick.
      Confirm: the client does NOT fire a second notification (because
      `loadWatchlist()` from T-2 has already updated `stockRows` to reflect
      `alert_above: null`).
- [ ] If both layers happen to fire within the overlap window (server job
      running at the exact same moment as a quote tick), confirm there are at
      most **two** notification rows — not an unbounded stream.

---

## Files to Change

| Action | File | Task |
|---|---|---|
| **Modify** | `src/routes/app.markets.tsx` | T-1, T-2 |

No other files need to change. All server-side infrastructure (job handler,
price fetcher, DB schema, cron schedule, lease RPCs) is already complete.

---

## Already Complete — No Action Required

| Component | File |
|---|---|
| Server job handler | `src/routes/api/public/jobs/price-alerts.ts` |
| Price fetch utility | `src/lib/quotes.server.ts` |
| DB bookkeeping columns | `supabase/migrations/20260822021948_*.sql` |
| Lease RPCs | `public.acquire_job_lease` / `public.release_job_lease` |
| `job_state` table | `public.job_state` |
| pg_cron schedule | `supabase/migrations/20260822022510_*.sql` |
| Realtime notification delivery | `src/components/NotificationsListener.tsx` |
