import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  createChart, CandlestickSeries, LineSeries, ColorType, type IChartApi,
} from "lightweight-charts";
import { Loader2, TrendingUp, TrendingDown, RefreshCw, AlertTriangle, Plus, X, Bell } from "lucide-react";
import { getQuotes, getCandles, type FinnhubQuote, type Candle } from "@/lib/markets.functions";
import { sma, rsi, bollinger } from "@/lib/indicators";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/app/markets")({ component: MarketsPage });

const DEFAULTS = ["AAPL", "MSFT", "GOOGL", "TSLA", "NVDA"];
const REFRESH_OPTS = [
  { v: 5_000, label: "5s" },
  { v: 10_000, label: "10s" },
  { v: 30_000, label: "30s" },
  { v: 60_000, label: "1m" },
  { v: 300_000, label: "5m" },
];

type WatchRow = {
  id: string; symbol: string; kind: string;
  alert_above: number | null; alert_below: number | null;
};

type IndicatorState = { sma20: boolean; sma50: boolean; bb: boolean; rsi: boolean };

function MarketsPage() {
  const { user } = useAuth();
  const [symbols, setSymbols] = useState<string[]>(DEFAULTS);
  const [stockRows, setStockRows] = useState<WatchRow[]>([]);
  const [active, setActive] = useState<string>(DEFAULTS[0]);
  const [refreshMs, setRefreshMs] = useState<number>(10_000);
  const [indicators, setIndicators] = useState<IndicatorState>(() => {
    try {
      const v = localStorage.getItem("bspot.markets.indicators");
      if (v) return JSON.parse(v) as IndicatorState;
    } catch { /* noop */ }
    return { sma20: true, sma50: true, bb: false, rsi: false };
  });
  useEffect(() => {
    localStorage.setItem("bspot.markets.indicators", JSON.stringify(indicators));
  }, [indicators]);

  const quotesFn = useServerFn(getQuotes);
  const candlesFn = useServerFn(getCandles);

  const loadWatchlist = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("watchlists" as never)
      .select("*")
      .eq("user_id", user.id)
      .eq("kind", "stock");
    const rows = ((data ?? []) as WatchRow[]);
    setStockRows(rows);
    if (rows.length > 0) {
      const syms = Array.from(new Set(rows.map((r) => r.symbol.toUpperCase())));
      setSymbols(syms);
      if (!syms.includes(active)) setActive(syms[0]);
    } else {
      setSymbols(DEFAULTS);
    }
  };
  useEffect(() => { loadWatchlist(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.id]);

  const { data: qData, isLoading: qLoading, error: qErr, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["finnhub-quotes", symbols.join(",")],
    queryFn: async () => await quotesFn({ data: { symbols } }),
    refetchInterval: refreshMs,
    refetchIntervalInBackground: false,
  });

  const { data: cData, isLoading: cLoading } = useQuery({
    queryKey: ["finnhub-candles", active],
    queryFn: async () => await candlesFn({ data: { symbol: active, resolution: "D", days: 120 } }),
    staleTime: 5 * 60_000,
  });

  // Price alert evaluation on each quote tick
  const triggered = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!user || !qData?.quotes || stockRows.length === 0) return;
    (async () => {
      for (const row of stockRows) {
        const q = qData.quotes.find((x) => x.symbol.toUpperCase() === row.symbol.toUpperCase());
        if (!q) continue;
        const above = row.alert_above != null && q.c >= Number(row.alert_above);
        const below = row.alert_below != null && q.c <= Number(row.alert_below);
        if (!above && !below) continue;
        const key = `${row.id}:${above ? "above" : "below"}:${Math.floor(Date.now() / 600_000)}`;
        if (triggered.current.has(key)) continue;
        triggered.current.add(key);
        const title = `${row.symbol} ${above ? "above" : "below"} ${above ? row.alert_above : row.alert_below}`;
        const message = `Price ${q.c.toFixed(2)} (${q.dp >= 0 ? "+" : ""}${q.dp.toFixed(2)}%) crossed your ${above ? "upper" : "lower"} alert.`;
        toast.message(title, { description: message, icon: <Bell className="h-4 w-4 text-neon" /> });
        await supabase.from("notifications" as never).insert({
          user_id: user.id, type: "price_alert", title, message,
        } as never);
      }
    })();
  }, [qData, stockRows, user]);

  const quoteByActive: FinnhubQuote | undefined = qData?.quotes.find((q) => q.symbol === active);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// LIVE MARKETS</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Markets Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {stockRows.length > 0 ? "Your watchlist" : "Default top tech tickers"} · refresh {REFRESH_OPTS.find((o) => o.v === refreshMs)?.label}
            {dataUpdatedAt > 0 && <span className="ml-2 font-mono text-[10px]">last tick {new Date(dataUpdatedAt).toLocaleTimeString()}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(refreshMs)} onValueChange={(v) => setRefreshMs(Number(v))}>
            <SelectTrigger className="w-[110px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {REFRESH_OPTS.map((o) => <SelectItem key={o.v} value={String(o.v)}>Refresh {o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <AddSymbolDialog onAdded={loadWatchlist} />
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-3 h-9 rounded-md border border-border hover:border-primary text-xs font-mono uppercase tracking-widest"
          >
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>
      </div>

      {qErr && (
        <div className="panel p-4 border-destructive/40 flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" /> {(qErr as Error).message}
        </div>
      )}
      {qData?.errors && qData.errors.length > 0 && (
        <div className="panel p-3 text-[11px] font-mono text-amber-500">
          Partial data: {qData.errors.join(" · ")}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {symbols.map((sym) => {
          const q = qData?.quotes.find((x) => x.symbol === sym);
          const row = stockRows.find((r) => r.symbol.toUpperCase() === sym);
          const up = (q?.dp ?? 0) >= 0;
          const isActive = active === sym;
          return (
            <div key={sym} className={`panel p-4 transition-all relative ${isActive ? "border-primary glow-sm" : "hover:border-primary/50"}`}>
              <button onClick={() => setActive(sym)} className="text-left w-full">
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg">{sym}</span>
                  {q ? (up ? <TrendingUp className="h-4 w-4 text-emerald-400" /> : <TrendingDown className="h-4 w-4 text-rose-400" />) : null}
                </div>
                {qLoading && !q ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-2" />
                ) : q ? (
                  <>
                    <div className="mt-2 font-mono text-xl">${q.c.toFixed(2)}</div>
                    <div className={`text-xs font-mono ${up ? "text-emerald-400" : "text-rose-400"}`}>
                      {up ? "+" : ""}{q.d.toFixed(2)} ({q.dp.toFixed(2)}%)
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground mt-2">No data</div>
                )}
              </button>
              <div className="mt-2 flex items-center justify-between gap-1">
                {row ? (
                  <AlertDialog row={row} onSaved={loadWatchlist} />
                ) : (
                  <QuickAddBtn symbol={sym} onAdded={loadWatchlist} />
                )}
                {row && (
                  <button
                    onClick={async () => {
                      await supabase.from("watchlists" as never).delete().eq("id", row.id);
                      loadWatchlist();
                    }}
                    className="p-1 text-muted-foreground hover:text-destructive" title="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              {row && (row.alert_above || row.alert_below) && (
                <div className="absolute top-2 right-2 text-[9px] font-mono text-neon flex items-center gap-1">
                  <Bell className="h-2.5 w-2.5" />
                  {row.alert_above && `↑${row.alert_above}`} {row.alert_below && `↓${row.alert_below}`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="panel-neon p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">// CHART</p>
            <h2 className="font-display text-xl">{active} · Daily candles</h2>
          </div>
          <div className="flex items-center gap-3 flex-wrap text-xs">
            <IndicatorToggle label="SMA 20" color="#d4a017" checked={indicators.sma20} onChange={(b) => setIndicators({ ...indicators, sma20: b })} />
            <IndicatorToggle label="SMA 50" color="#60a5fa" checked={indicators.sma50} onChange={(b) => setIndicators({ ...indicators, sma50: b })} />
            <IndicatorToggle label="Bollinger" color="#a78bfa" checked={indicators.bb} onChange={(b) => setIndicators({ ...indicators, bb: b })} />
            <IndicatorToggle label="RSI 14" color="#f472b6" checked={indicators.rsi} onChange={(b) => setIndicators({ ...indicators, rsi: b })} />
          </div>
          {quoteByActive && (
            <div className="text-right">
              <div className="font-display text-2xl text-neon">${quoteByActive.c.toFixed(2)}</div>
              <div className={`text-xs font-mono ${quoteByActive.dp >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {quoteByActive.dp >= 0 ? "+" : ""}{quoteByActive.dp.toFixed(2)}%
              </div>
            </div>
          )}
        </div>

        {cLoading ? (
          <div className="h-[400px] grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-neon" /></div>
        ) : cData?.error ? (
          <div className="h-[400px] grid place-items-center text-center">
            <div>
              <AlertTriangle className="h-6 w-6 mx-auto text-amber-500 mb-2" />
              <p className="text-sm text-muted-foreground">{cData.error}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Live quote ticker above is still updating every {REFRESH_OPTS.find((o) => o.v === refreshMs)?.label}.</p>
            </div>
          </div>
        ) : (
          <>
            <CandleChart candles={cData?.candles ?? []} indicators={indicators} />
            {indicators.rsi && <RsiChart candles={cData?.candles ?? []} />}
          </>
        )}
      </div>
    </div>
  );
}

function IndicatorToggle({ label, color, checked, onChange }: { label: string; color: string; checked: boolean; onChange: (b: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <Switch checked={checked} onCheckedChange={onChange} />
      <span className="font-mono text-[10px] uppercase tracking-widest flex items-center gap-1">
        <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: color }} />{label}
      </span>
    </label>
  );
}

function CandleChart({ candles, indicators }: { candles: Candle[]; indicators: IndicatorState }) {
  const ref = useRef<HTMLDivElement>(null);

  const overlays = useMemo(() => {
    const closes = candles.map((c) => c.close);
    const s20 = sma(closes, 20);
    const s50 = sma(closes, 50);
    const bb = bollinger(closes, 20, 2);
    const pt = (arr: (number | null)[]) =>
      candles.map((c, i) => ({ time: c.time, value: arr[i] })).filter((p) => p.value != null) as { time: number; value: number }[];
    return { sma20: pt(s20), sma50: pt(s50), bbUp: pt(bb.upper), bbLo: pt(bb.lower), bbMid: pt(bb.mid) };
  }, [candles]);

  useEffect(() => {
    if (!ref.current || candles.length === 0) return;
    const chart: IChartApi = createChart(ref.current, {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#94a3b8" },
      grid: { vertLines: { color: "rgba(148, 163, 184, 0.08)" }, horzLines: { color: "rgba(148, 163, 184, 0.08)" } },
      rightPriceScale: { borderColor: "rgba(148, 163, 184, 0.2)" },
      timeScale: { borderColor: "rgba(148, 163, 184, 0.2)", timeVisible: true },
      width: ref.current.clientWidth,
      height: 400,
    });
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#34d399", downColor: "#f87171",
      borderUpColor: "#34d399", borderDownColor: "#f87171",
      wickUpColor: "#34d399", wickDownColor: "#f87171",
    });
    candleSeries.setData(candles.map((c) => ({ time: c.time as never, open: c.open, high: c.high, low: c.low, close: c.close })));

    const add = (color: string, title: string, data: { time: number; value: number }[], opts: Record<string, unknown> = {}) => {
      if (!data.length) return;
      const s = chart.addSeries(LineSeries, { color, lineWidth: 2, title, ...opts });
      s.setData(data.map((p) => ({ time: p.time as never, value: p.value })));
    };

    if (indicators.sma20) add("#d4a017", "SMA 20", overlays.sma20);
    if (indicators.sma50) add("#60a5fa", "SMA 50", overlays.sma50);
    if (indicators.bb) {
      add("#a78bfa", "BB upper", overlays.bbUp, { lineWidth: 1 });
      add("#a78bfa", "BB lower", overlays.bbLo, { lineWidth: 1 });
      add("#a78bfa66", "BB mid", overlays.bbMid, { lineWidth: 1, lineStyle: 2 });
    }

    chart.timeScale().fitContent();
    const onResize = () => ref.current && chart.applyOptions({ width: ref.current.clientWidth });
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); chart.remove(); };
  }, [candles, overlays, indicators]);

  if (candles.length === 0) return <div className="h-[400px] grid place-items-center text-sm text-muted-foreground">No candle data</div>;
  return <div ref={ref} className="w-full" />;
}

function RsiChart({ candles }: { candles: Candle[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || candles.length === 0) return;
    const chart = createChart(ref.current, {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#94a3b8" },
      grid: { vertLines: { color: "rgba(148,163,184,0.06)" }, horzLines: { color: "rgba(148,163,184,0.06)" } },
      rightPriceScale: { borderColor: "rgba(148,163,184,0.2)" },
      timeScale: { borderColor: "rgba(148,163,184,0.2)", timeVisible: true },
      width: ref.current.clientWidth,
      height: 140,
    });
    const closes = candles.map((c) => c.close);
    const r = rsi(closes, 14);
    const data = candles.map((c, i) => ({ time: c.time, value: r[i] })).filter((p) => p.value != null) as { time: number; value: number }[];
    const s = chart.addSeries(LineSeries, { color: "#f472b6", lineWidth: 2, title: "RSI 14" });
    s.setData(data.map((p) => ({ time: p.time as never, value: p.value })));
    // 30/70 reference lines
    s.createPriceLine({ price: 70, color: "#f87171", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "70" });
    s.createPriceLine({ price: 30, color: "#34d399", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "30" });
    chart.timeScale().fitContent();
    const onResize = () => ref.current && chart.applyOptions({ width: ref.current.clientWidth });
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); chart.remove(); };
  }, [candles]);
  return (
    <div className="mt-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">// RSI 14</p>
      <div ref={ref} className="w-full" />
    </div>
  );
}

function QuickAddBtn({ symbol, onAdded }: { symbol: string; onAdded: () => void }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy || !user}
      onClick={async (e) => {
        e.stopPropagation();
        if (!user) return;
        setBusy(true);
        const { error } = await supabase.from("watchlists" as never).insert({
          user_id: user.id, symbol: symbol.toUpperCase(), kind: "stock",
        } as never);
        setBusy(false);
        if (error) toast.error(error.message);
        else { toast.success(`${symbol} added to watchlist`); onAdded(); }
      }}
      className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-neon flex items-center gap-1"
    >
      <Plus className="h-3 w-3" /> Track
    </button>
  );
}

function AlertDialog({ row, onSaved }: { row: WatchRow; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(row.alert_above?.toString() ?? "");
  const [below, setBelow] = useState(row.alert_below?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("watchlists" as never)
      .update({
        alert_above: above.trim() === "" ? null : Number(above),
        alert_below: below.trim() === "" ? null : Number(below),
      } as never)
      .eq("id", row.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Alerts updated");
    setOpen(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button onClick={(e) => e.stopPropagation()} className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-neon flex items-center gap-1">
          <Bell className="h-3 w-3" /> Alerts
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{row.symbol} price alerts</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Notify when price goes above</Label>
            <Input value={above} onChange={(e) => setAbove(e.target.value)} placeholder="e.g. 250.00" inputMode="decimal" />
          </div>
          <div>
            <Label>Notify when price goes below</Label>
            <Input value={below} onChange={(e) => setBelow(e.target.value)} placeholder="e.g. 200.00" inputMode="decimal" />
          </div>
          <p className="text-[11px] text-muted-foreground">Leave a field empty to disable that side. Triggers create an in-app notification at most once every 10 minutes per side.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddSymbolDialog({ onAdded }: { onAdded: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [sym, setSym] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9"><Plus className="h-3 w-3 mr-1" /> Symbol</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add stock symbol</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Label>Finnhub symbol (e.g. AAPL, BINANCE:BTCUSDT)</Label>
          <Input value={sym} onChange={(e) => setSym(e.target.value.toUpperCase())} placeholder="AAPL" />
          <p className="text-[11px] text-muted-foreground">Stock symbols are added to your watchlist as kind "stock" and refresh on this dashboard.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={busy || !sym.trim() || !user}
            onClick={async () => {
              if (!user) return;
              setBusy(true);
              const { error } = await supabase.from("watchlists" as never).insert({
                user_id: user.id, symbol: sym.trim().toUpperCase(), kind: "stock",
              } as never);
              setBusy(false);
              if (error) toast.error(error.message);
              else { toast.success("Added"); setSym(""); setOpen(false); onAdded(); }
            }}
          >{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
