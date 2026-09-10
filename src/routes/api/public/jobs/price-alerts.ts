import { createFileRoute } from "@tanstack/react-router";

/**
 * Scheduled price-alert evaluator.
 *
 * Called by pg_cron (every 15 minutes) with the project apikey header.
 * Bounded batch + single-flight DB lease + idempotent progress marking:
 * a threshold that fires is cleared on the row, so it cannot re-notify.
 */

const JOB_KEY = "price_alerts";
const LEASE_SECONDS = 120;
const MAX_ROWS = 300;
const MAX_SYMBOLS = 60;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function authorized(request: Request): boolean {
  const anon = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const apikey = request.headers.get("apikey");
  const bearer = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const provided = apikey || bearer;
  if (!provided) return false;
  return (!!anon && provided === anon) || (!!service && provided === service);
}

async function run(request: Request) {
  if (!authorized(request)) return json({ ok: false, error: "Unauthorized" }, 401);

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Single-flight: a second concurrent run exits instead of duplicating work.
  const { data: leased, error: leaseErr } = await supabaseAdmin.rpc("acquire_job_lease", {
    p_key: JOB_KEY,
    p_lease_seconds: LEASE_SECONDS,
  });
  if (leaseErr) return json({ ok: false, error: leaseErr.message }, 500);
  if (!leased) return json({ ok: true, skipped: "locked_or_paused" });

  let status = "ok";
  let errorText: string | null = null;
  let checked = 0;
  let triggered = 0;

  try {
    const { data: rows, error } = await supabaseAdmin
      .from("watchlists")
      .select("id, user_id, symbol, label, alert_above, alert_below")
      .eq("alerts_paused", false)
      .or("alert_above.not.is.null,alert_below.not.is.null")
      .order("updated_at", { ascending: true })
      .limit(MAX_ROWS);
    if (error) throw new Error(error.message);

    const list = rows ?? [];
    if (!list.length) {
      await supabaseAdmin.rpc("release_job_lease", { p_key: JOB_KEY, p_status: "idle", p_error: null });
      return json({ ok: true, checked: 0, triggered: 0 });
    }

    const symbols = [...new Set(list.map((r) => r.symbol.toUpperCase()))].slice(0, MAX_SYMBOLS);
    const { fetchQuotes } = await import("@/lib/quotes.server");
    const quotes = await fetchQuotes(symbols);

    const notifications: Array<{ user_id: string; type: string; title: string; message: string }> = [];

    for (const row of list) {
      const q = quotes.get(row.symbol.toUpperCase());
      if (!q) continue;
      checked++;

      const name = row.label || row.symbol;
      const patch: {
        last_price: number;
        last_checked_at: string;
        alert_above?: number | null;
        alert_below?: number | null;
        last_triggered_at?: string;
      } = {
        last_price: q.price,
        last_checked_at: new Date().toISOString(),
      };
      let fired = false;

      if (row.alert_above != null && q.price >= Number(row.alert_above)) {
        fired = true;
        patch.alert_above = null; // clear so it cannot re-fire on the next run
        notifications.push({
          user_id: row.user_id,
          type: "alert",
          title: `${name} crossed above ${Number(row.alert_above)}`,
          message: `${row.symbol} is trading at ${q.price.toFixed(2)} (${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}% today). Your upper alert has been cleared — set a new one from Markets.`,
        });
      }

      if (row.alert_below != null && q.price <= Number(row.alert_below)) {
        fired = true;
        patch.alert_below = null;
        notifications.push({
          user_id: row.user_id,
          type: "alert",
          title: `${name} dropped below ${Number(row.alert_below)}`,
          message: `${row.symbol} is trading at ${q.price.toFixed(2)} (${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}% today). Your lower alert has been cleared — set a new one from Markets.`,
        });
      }

      if (fired) {
        patch.last_triggered_at = new Date().toISOString();
        triggered++;
      }

      await supabaseAdmin.from("watchlists").update(patch).eq("id", row.id);
    }

    if (notifications.length) {
      const { error: notifErr } = await supabaseAdmin.from("notifications").insert(notifications);
      if (notifErr) throw new Error(notifErr.message);
    }
  } catch (e) {
    status = "error";
    errorText = e instanceof Error ? e.message : String(e);
  }

  await supabaseAdmin.rpc("release_job_lease", { p_key: JOB_KEY, p_status: status, p_error: errorText ?? null });
  return json({ ok: status === "ok", checked, triggered, error: errorText }, status === "ok" ? 200 : 500);
}

export const Route = createFileRoute("/api/public/jobs/price-alerts")({
  server: {
    handlers: {
      POST: async ({ request }) => run(request),
      GET: async ({ request }) => run(request),
    },
  },
});
