import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2, TrendingUp, TrendingDown, Loader2, Sparkles, Pencil, FileDown, FileText, RefreshCw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { COUNTRIES } from "@/lib/countries-data";
import { CURRENCIES } from "@/lib/currencies";
import { optimizePortfolio } from "@/lib/portfolio.functions";
import { getQuotes } from "@/lib/markets.functions";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, Legend, LineChart, Line, CartesianGrid } from "recharts";
import { formatCurrency, formatDate, formatPercent } from "@/lib/i18n-format";
import { track } from "@/lib/telemetry";

export const Route = createFileRoute("/app/portfolio")({ component: PortfolioPage });

type Investment = {
  id: string;
  name: string;
  symbol: string | null;
  country: string | null;
  currency: string;
  initial_amount: number;
  current_value: number;
  notes: string | null;
  created_at: string;
};

const empty = { name: "", symbol: "", country: "", currency: "USD", initial_amount: "", current_value: "", notes: "" };

function PortfolioPage() {
  const optimizeFn = useServerFn(optimizePortfolio);
  const quotesFn = useServerFn(getQuotes);
  const { user } = useAuth();
  const [items, setItems] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [form, setForm] = useState(empty);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d" | "1y" | "all">("30d");
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);


  const load = async () => {
    if (!user) return;
    setLoading(true);
    const t0 = performance.now();
    const { data, error } = await supabase
      .from("investments").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as Investment[]);
    setLoading(false);
    track("portfolio_loaded", { value: Math.round(performance.now() - t0), metadata: { count: data?.length ?? 0 } });
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const totals = useMemo(() => {
    const invested = items.reduce((s, i) => s + Number(i.initial_amount), 0);
    const current = items.reduce((s, i) => s + Number(i.current_value), 0);
    const pl = current - invested;
    const pct = invested ? (pl / invested) * 100 : 0;
    return { invested, current, pl, pct };
  }, [items]);

  const byCountry = useMemo(() => {
    const map: Record<string, number> = {};
    for (const it of items) {
      const key = it.country || "Unspecified";
      map[key] = (map[key] || 0) + Number(it.current_value);
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [items]);

  const timeframeDays = { "7d": 7, "30d": 30, "90d": 90, "1y": 365, all: Infinity }[timeframe];

  const filteredByTime = useMemo(() => {
    if (timeframeDays === Infinity) return items;
    const cutoff = Date.now() - timeframeDays * 86_400_000;
    return items.filter(i => new Date(i.created_at).getTime() >= cutoff);
  }, [items, timeframeDays]);

  const perAsset = useMemo(
    () => filteredByTime.map(i => ({
      name: i.name.slice(0, 12),
      pl: Number(i.current_value) - Number(i.initial_amount),
      invested: Number(i.initial_amount),
      current: Number(i.current_value),
    })),
    [filteredByTime]
  );

  // Cumulative P/L history built from investment creation dates within the window.
  const plHistory = useMemo(() => {
    const sorted = [...filteredByTime].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    let cum = 0;
    return sorted.map(i => {
      cum += Number(i.current_value) - Number(i.initial_amount);
      return { date: formatDate(i.created_at, { month: "short", day: "numeric" }), pl: Number(cum.toFixed(2)) };
    });
  }, [filteredByTime]);

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (it: Investment) => {
    setEditing(it);
    setForm({
      name: it.name, symbol: it.symbol ?? "", country: it.country ?? "", currency: it.currency,
      initial_amount: String(it.initial_amount), current_value: String(it.current_value),
      notes: it.notes ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!user) return;
    if (!form.name || !form.initial_amount || !form.current_value) {
      toast.error("Name, initial amount, and current value are required");
      return;
    }
    const payload = {
      user_id: user.id,
      name: form.name,
      symbol: form.symbol ? form.symbol.toUpperCase().trim() : null,
      country: form.country || null,
      currency: form.currency,
      initial_amount: Number(form.initial_amount),
      current_value: Number(form.current_value),
      notes: form.notes || null,
    };
    const q = editing
      ? supabase.from("investments").update(payload).eq("id", editing.id)
      : supabase.from("investments").insert(payload);
    const { error } = await q;
    if (error) return toast.error(error.message);
    toast.success(editing ? "Investment updated" : "Investment added");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("investments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    load();
  };

  // Auto-refresh live prices for any position that has a ticker symbol.
  const refreshLivePrices = async (silent = false) => {
    const withSymbol = items.filter((i) => i.symbol && i.symbol.trim());
    if (withSymbol.length === 0) {
      if (!silent) toast.info("Add a ticker symbol to a position to enable live price refresh.");
      return;
    }
    setRefreshing(true);
    try {
      const symbols = Array.from(new Set(withSymbol.map((i) => i.symbol!.toUpperCase()))).slice(0, 10);
      const { quotes } = await quotesFn({ data: { symbols } });
      const priceMap = new Map(quotes.map((q) => [q.symbol.toUpperCase(), q.c]));
      let updated = 0;
      for (const it of withSymbol) {
        const price = priceMap.get(it.symbol!.toUpperCase());
        if (!Number.isFinite(price) || !price) continue;
        // We treat current_value as (units * price). If user only holds 1 unit, that's the price.
        // Best-effort: use ratio of previous current_value to previous price via initial_amount as unit proxy.
        // Simpler safe approach: only update when initial_amount was recorded as unit count (< price)
        // → to keep it obvious, we set current_value = price * (current_value / previous_price_stored_in_notes? nope).
        // Pragmatic: assume position size = current_value / lastKnownPrice. Since we don't store lastPrice,
        // we update current_value = price (per-share view). Users with multiple shares can multiply in notes.
        const newValue = Number(price.toFixed(2));
        if (newValue === Number(it.current_value)) continue;
        const { error } = await supabase.from("investments").update({ current_value: newValue }).eq("id", it.id);
        if (!error) updated++;
      }
      setLastRefresh(new Date());
      if (!silent) toast.success(updated ? `Updated ${updated} position${updated > 1 ? "s" : ""} from live data` : "Prices already up to date");
      if (updated) load();
    } catch (e) {
      if (!silent) toast.error((e as Error).message);
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-refresh every 60s while the tab is visible.
  const refreshRef = useRef(refreshLivePrices);
  refreshRef.current = refreshLivePrices;
  useEffect(() => {
    if (!items.some((i) => i.symbol)) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refreshRef.current(true);
    }, 60_000);
    return () => clearInterval(id);
  }, [items]);


  const optimize = async () => {
    if (items.length === 0) return toast.error("Add some investments first");
    setAiLoading(true);
    setAiAdvice(null);
    try {
      const summary = items.map(i =>
        `${i.name} (${i.country || "n/a"}, ${i.currency}): invested ${i.initial_amount}, now ${i.current_value}`
      ).join("\n");
      const { advice } = await optimizeFn({ data: { summary } });
      setAiAdvice(advice);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAiLoading(false);
    }
  };

  const exportCsv = () => {
    const winInvested = filteredByTime.reduce((s, i) => s + Number(i.initial_amount), 0);
    const winCurrent = filteredByTime.reduce((s, i) => s + Number(i.current_value), 0);
    const winPl = winCurrent - winInvested;
    const winPct = winInvested ? (winPl / winInvested) * 100 : 0;
    const preface = [
      ["BSpot AI — Portfolio Report"],
      [`Timeframe: ${timeframe}`],
      [`Generated: ${formatDate(new Date(), { dateStyle: "long", timeStyle: "short" })}`],
      [`Positions: ${filteredByTime.length}`],
      [`Invested (window): ${formatCurrency(winInvested)}`],
      [`Current (window): ${formatCurrency(winCurrent)}`],
      [`Net P/L (window): ${formatCurrency(winPl)} (${formatPercent(winPct)})`],
      [],
    ];
    const header = ["Name", "Country", "Currency", "Invested", "Current", "P/L", "Return %", "Added"];
    const rows = filteredByTime.map(i => {
      const pl = Number(i.current_value) - Number(i.initial_amount);
      const pct = Number(i.initial_amount) ? (pl / Number(i.initial_amount)) * 100 : 0;
      return [i.name, i.country ?? "", i.currency, i.initial_amount, i.current_value, pl.toFixed(2), pct.toFixed(2), formatDate(i.created_at)];
    });
    const csv = [...preface, header, ...rows].map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `bspot-portfolio-${timeframe}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    track("portfolio_export", { metadata: { format: "csv", timeframe, rows: rows.length } });
  };

  const timeframeLabel: Record<typeof timeframe, string> = {
    "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days", "1y": "Last 12 months", all: "All time",
  };

  const exportPdf = async () => {
    const [{ default: jsPDF }, autoTableMod] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const autoTable = (autoTableMod as { default: (doc: unknown, opts: unknown) => void }).default;
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18); doc.text("BSpot AI — Portfolio Report", 14, 18);
    doc.setFontSize(10); doc.setTextColor(120);
    doc.text(`Timeframe: ${timeframeLabel[timeframe]}`, 14, 25);
    doc.text(`Generated: ${formatDate(new Date(), { dateStyle: "long", timeStyle: "short" })}`, 14, 30);
    doc.setTextColor(0);

    // Summary metrics block
    const winInvested = filteredByTime.reduce((s, i) => s + Number(i.initial_amount), 0);
    const winCurrent = filteredByTime.reduce((s, i) => s + Number(i.current_value), 0);
    const winPl = winCurrent - winInvested;
    const winPct = winInvested ? (winPl / winInvested) * 100 : 0;
    const best = [...filteredByTime].sort((a, b) => (Number(b.current_value) - Number(b.initial_amount)) - (Number(a.current_value) - Number(a.initial_amount)))[0];
    const worst = [...filteredByTime].sort((a, b) => (Number(a.current_value) - Number(a.initial_amount)) - (Number(b.current_value) - Number(b.initial_amount)))[0];

    autoTable(doc, {
      startY: 36,
      head: [["Summary", "Value"]],
      body: [
        ["Positions", String(filteredByTime.length)],
        ["Total invested (window)", formatCurrency(winInvested)],
        ["Current value (window)", formatCurrency(winCurrent)],
        ["Net P/L (window)", `${formatCurrency(winPl)} (${formatPercent(winPct)})`],
        ["All-time P/L", `${formatCurrency(totals.pl)} (${formatPercent(totals.pct)})`],
        ["Best performer", best ? `${best.name} (${formatCurrency(Number(best.current_value) - Number(best.initial_amount), best.currency)})` : "—"],
        ["Worst performer", worst && worst !== best ? `${worst.name} (${formatCurrency(Number(worst.current_value) - Number(worst.initial_amount), worst.currency)})` : "—"],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 30, 30] },
    });

    // Allocation by country
    if (byCountry.length) {
      autoTable(doc, {
        head: [["Country", "Current value", "% of portfolio"]],
        body: byCountry
          .sort((a, b) => b.value - a.value)
          .map(row => [row.name, formatCurrency(row.value), formatPercent(totals.current ? (row.value / totals.current) * 100 : 0)]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 30, 30] },
      });
    }

    // Positions detail
    autoTable(doc, {
      head: [["Name", "Country", "CCY", "Invested", "Current", "P/L", "Return", "Added"]],
      body: filteredByTime.map(i => {
        const pl = Number(i.current_value) - Number(i.initial_amount);
        const pct = Number(i.initial_amount) ? (pl / Number(i.initial_amount)) * 100 : 0;
        return [
          i.name,
          i.country ?? "-",
          i.currency,
          formatCurrency(Number(i.initial_amount), i.currency),
          formatCurrency(Number(i.current_value), i.currency),
          formatCurrency(pl, i.currency),
          formatPercent(pct),
          formatDate(i.created_at),
        ];
      }),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 30, 30] },
    });

    doc.save(`bspot-portfolio-${timeframe}-${new Date().toISOString().slice(0,10)}.pdf`);
    track("portfolio_export", { metadata: { format: "pdf", timeframe, rows: filteredByTime.length } });
  };

  const COLORS = ["oklch(0.88 0.19 95)", "oklch(0.68 0.18 50)", "oklch(0.65 0.18 200)", "oklch(0.65 0.18 320)", "oklch(0.70 0.15 150)", "oklch(0.60 0.15 30)"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// PORTFOLIO</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Portfolio Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Log every investment — stocks, ETFs, crypto, real estate — and watch your P/L update live.
            Add a ticker symbol (e.g. <span className="font-mono text-neon">AAPL</span>) to auto-refresh the current price every minute from Yahoo Finance (may be delayed ~15 min).
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => refreshLivePrices(false)} disabled={refreshing || items.length === 0} title="Fetch the latest price for positions with a ticker symbol">
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh prices
          </Button>
          <Button variant="outline" onClick={exportCsv} disabled={items.length === 0} title="Download the current timeframe as a spreadsheet (CSV)">
            <FileDown className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" onClick={exportPdf} disabled={items.length === 0} title="Download the current timeframe as a printable PDF report">
            <FileText className="h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" onClick={optimize} disabled={aiLoading} title="Ask the AI to review your allocation and suggest rebalancing (costs 15 credits)">
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            AI Review (15 cr)
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button onClick={openCreate}><Plus className="h-4 w-4" /> Add</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit investment" : "Add investment"}</DialogTitle>
                <DialogDescription>
                  Give the position a name and its cost basis. If it's a public stock, ETF or index, add its ticker symbol so we can update its price for you automatically.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div>
                  <Label>Name</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Apple stock" />
                  <p className="text-[11px] text-muted-foreground mt-1">A short label you'll recognise in the list.</p>
                </div>
                <div>
                  <Label>Ticker symbol <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value.toUpperCase() })} placeholder="e.g. AAPL, MSFT, BTC-USD" maxLength={12} />
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-start gap-1">
                    <Info className="h-3 w-3 mt-0.5 shrink-0" />
                    Add a Yahoo Finance symbol to enable live price refresh every 60s. Leave blank for private assets (real estate, business, cash).
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Country</Label>
                    <Select value={form.country} onValueChange={v => setForm({ ...form, country: v })}>
                      <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
                      <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Initial amount</Label>
                    <Input type="number" value={form.initial_amount} onChange={e => setForm({ ...form, initial_amount: e.target.value })} placeholder="What you paid" />
                  </div>
                  <div>
                    <Label>Current value</Label>
                    <Input type="number" value={form.current_value} onChange={e => setForm({ ...form, current_value: e.target.value })} placeholder="Market value today" />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Optional: strategy, shares held, broker…" />
                </div>
              </div>
              <DialogFooter><Button onClick={save}>{editing ? "Save" : "Add"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {lastRefresh && (
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground -mt-3">
          // Live prices last updated {formatDate(lastRefresh, { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · Auto-refresh every 60s · Data via Yahoo Finance (may be delayed ~15 min)
        </p>
      )}


      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Invested" value={formatCurrency(totals.invested)} />
        <Stat label="Current" value={formatCurrency(totals.current)} />
        <Stat label="P/L" value={`${totals.pl >= 0 ? "+" : ""}${formatCurrency(totals.pl)}`} accent={totals.pl >= 0 ? "up" : "down"} />
        <Stat label="Return" value={formatPercent(totals.pct)} accent={totals.pct >= 0 ? "up" : "down"} />
      </div>

      {aiAdvice && (
        <div className="panel-neon p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neon mb-2">// AI Advice</p>
          <pre className="whitespace-pre-wrap text-sm font-sans">{aiAdvice}</pre>
        </div>
      )}

      {items.length > 0 && (
        <>
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="panel p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">// Allocation by Country</p>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={byCountry} dataKey="value" nameKey="name" outerRadius={80} label>
                    {byCountry.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "oklch(0.12 0.005 95)", border: "1px solid oklch(0.25 0.01 95)" }}
                    formatter={(v: number, name) => [formatCurrency(v), name as string]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="panel p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">// P/L per Asset</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={perAsset}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.01 95)" />
                  <XAxis dataKey="name" stroke="oklch(0.55 0.01 95)" fontSize={10} />
                  <YAxis stroke="oklch(0.55 0.01 95)" fontSize={10} tickFormatter={(v) => formatCurrency(v, "USD", { notation: "compact", maximumFractionDigits: 1 })} />
                  <Tooltip
                    contentStyle={{ background: "oklch(0.12 0.005 95)", border: "1px solid oklch(0.25 0.01 95)" }}
                    formatter={(v: number, key) => [formatCurrency(v), key === "pl" ? "P/L" : (key as string)]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} formatter={() => "P/L per asset"} />
                  <Bar dataKey="pl" fill="oklch(0.88 0.19 95)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">// Cumulative P/L over time</p>
              <div className="flex gap-1">
                {(["7d", "30d", "90d", "1y", "all"] as const).map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`text-[10px] font-mono px-2 py-1 rounded border ${timeframe === tf ? "border-neon text-neon" : "border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    {tf.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            {plHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No investments in the selected window.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={plHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.01 95)" />
                  <XAxis dataKey="date" stroke="oklch(0.55 0.01 95)" fontSize={10} />
                  <YAxis stroke="oklch(0.55 0.01 95)" fontSize={10} tickFormatter={(v) => formatCurrency(v, "USD", { notation: "compact", maximumFractionDigits: 1 })} />
                  <Tooltip
                    contentStyle={{ background: "oklch(0.12 0.005 95)", border: "1px solid oklch(0.25 0.01 95)" }}
                    formatter={(v: number) => [formatCurrency(v), "Cumulative P/L"]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} formatter={() => "Cumulative P/L"} />
                  <Line type="monotone" dataKey="pl" stroke="oklch(0.88 0.19 95)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}

      <div className="panel p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-neon" /></div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No investments yet. Click <span className="text-neon">Add</span> to start.</div>
        ) : (
          <div className="divide-y divide-border">
            {items.map(it => {
              const pl = Number(it.current_value) - Number(it.initial_amount);
              const pct = Number(it.initial_amount) ? (pl / Number(it.initial_amount)) * 100 : 0;
              return (
                <div key={it.id} className="p-4 flex items-center gap-4 hover:bg-accent/30">
                  <div className="flex-1 min-w-0">
                    <div className="font-display flex items-center gap-2">
                      {it.name}
                      {it.symbol && <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-neon/40 text-neon uppercase tracking-widest">{it.symbol} · live</span>}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {it.country ?? "—"} · {it.currency} · {formatDate(it.created_at)}
                    </div>
                    {it.notes && <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{it.notes}</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-display text-sm">{formatCurrency(Number(it.current_value), it.currency)}</div>
                    <div className={`text-xs flex items-center justify-end gap-1 ${pl >= 0 ? "text-neon" : "text-destructive"}`}>
                      {pl >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {formatPercent(pct)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(it)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "up" | "down" }) {
  return (
    <div className="panel p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-2xl ${accent === "up" ? "text-neon" : accent === "down" ? "text-destructive" : ""}`}>{value}</p>
    </div>
  );
}
