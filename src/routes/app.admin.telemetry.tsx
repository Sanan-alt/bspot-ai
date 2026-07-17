import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Activity, RefreshCw, Filter, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/use-credits";
import { verifyOwnerFn } from "@/lib/credits.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/i18n-format";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin/telemetry")({
  head: () => ({
    meta: [
      { title: "Telemetry — BSpot AI Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: TelemetryPage,
});

type Row = {
  id: string;
  event: string;
  path: string | null;
  value: number | null;
  level: "info" | "warn" | "error" | null;
  metadata: Record<string, unknown> | null;
  session_id: string | null;
  user_id: string | null;
  created_at: string;
};

const PRESETS = [
  { key: "all", label: "All events" },
  { key: "onboarding_started", label: "Onboarding started" },
  { key: "onboarding_step", label: "Onboarding step" },
  { key: "onboarding_finished", label: "Onboarding finished" },
  { key: "onboarding_skipped", label: "Onboarding skipped" },
  { key: "portfolio_loaded", label: "Portfolio loaded" },
  { key: "country_page_view", label: "Country page views" },
  { key: "portfolio_export", label: "Portfolio exports" },
  { key: "client_error", label: "Client errors" },
  { key: "unhandled_rejection", label: "Unhandled rejections" },
];

function TelemetryPage() {
  const navigate = useNavigate();
  const { isOwner, loading: credLoading } = useCredits();
  const [verified, setVerified] = useState<"pending" | "ok">("pending");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(200);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await verifyOwnerFn();
        if (!cancelled) setVerified("ok");
      } catch {
        toast.error("Owner access only");
        navigate({ to: "/app" });
      }
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("telemetry_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (filter !== "all") q = q.eq("event", filter);
    const { data, error } = await q;
    setLoading(false);
    if (error) return toast.error(error.message);
    setRows((data ?? []) as Row[]);
  };

  useEffect(() => { if (verified === "ok") void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [verified, filter, limit]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const s = search.toLowerCase();
    return rows.filter(r =>
      r.event.toLowerCase().includes(s) ||
      (r.path ?? "").toLowerCase().includes(s) ||
      (r.session_id ?? "").toLowerCase().includes(s) ||
      JSON.stringify(r.metadata ?? {}).toLowerCase().includes(s)
    );
  }, [rows, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of rows) c[r.event] = (c[r.event] ?? 0) + 1;
    return c;
  }, [rows]);

  if (credLoading || verified !== "ok" || !isOwner) {
    return <div className="grid place-items-center h-64"><Loader2 className="h-6 w-6 animate-spin text-neon" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link to="/app/admin" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Back to admin
          </Link>
          <h1 className="mt-2 font-display text-3xl md:text-4xl flex items-center gap-3">
            <Activity className="h-7 w-7 text-neon" /> Telemetry
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Recent events for onboarding, portfolio load, country page views, and client errors.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
        </Button>
      </div>

      <section className="panel p-4 grid gap-3 md:grid-cols-[220px_1fr_140px] items-end">
        <div>
          <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Filter className="h-3 w-3" /> Event</label>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="w-full h-9 px-2 rounded-md bg-background border border-input text-sm">
            {PRESETS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Search (path, session, metadata)</label>
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="e.g. /app/portfolio" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Limit</label>
          <select value={limit} onChange={e => setLimit(Number(e.target.value))} className="w-full h-9 px-2 rounded-md bg-background border border-input text-sm">
            {[100, 200, 500, 1000].map(n => <option key={n} value={n}>{n} rows</option>)}
          </select>
        </div>
      </section>

      <section className="panel p-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Event mix ({rows.length} loaded)</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([evt, n]) => (
            <span key={evt} className="px-2 py-1 rounded-md border border-border text-xs font-mono">
              {evt} <span className="text-neon">×{n}</span>
            </span>
          ))}
          {rows.length === 0 && <span className="text-xs text-muted-foreground">No events yet.</span>}
        </div>
      </section>

      <section className="panel overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-muted-foreground uppercase tracking-widest">
            <tr>
              <th className="text-left px-3 py-2">When</th>
              <th className="text-left px-3 py-2">Event</th>
              <th className="text-left px-3 py-2">Path</th>
              <th className="text-left px-3 py-2">Level</th>
              <th className="text-left px-3 py-2">Value</th>
              <th className="text-left px-3 py-2">Session</th>
              <th className="text-left px-3 py-2">Metadata</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-t border-border align-top">
                <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(r.created_at)}</td>
                <td className="px-3 py-2 font-mono">{r.event}</td>
                <td className="px-3 py-2 font-mono text-muted-foreground">{r.path ?? "—"}</td>
                <td className="px-3 py-2">
                  <span className={
                    r.level === "error" ? "text-destructive" :
                    r.level === "warn" ? "text-warning" : "text-muted-foreground"
                  }>{r.level ?? "info"}</span>
                </td>
                <td className="px-3 py-2">{r.value ?? ""}</td>
                <td className="px-3 py-2 font-mono text-muted-foreground truncate max-w-[120px]">{r.session_id?.slice(0, 8) ?? "—"}</td>
                <td className="px-3 py-2 font-mono text-[11px] max-w-[420px] break-words">
                  {r.metadata ? JSON.stringify(r.metadata) : ""}
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">No events match.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
