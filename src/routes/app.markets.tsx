import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { createChart, CandlestickSeries, LineSeries, ColorType, type IChartApi } from "lightweight-charts";
import { Loader2, TrendingUp, TrendingDown, RefreshCw, AlertTriangle } from "lucide-react";
import { getQuotes, getCandles, type FinnhubQuote, type Candle } from "@/lib/markets.functions";

export const Route = createFileRoute("/app/markets")({ component: MarketsPage });

const DEFAULT_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "TSLA", "NVDA"];

function MarketsPage() {
  const [symbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [active, setActive] = useState<string>(DEFAULT_SYMBOLS[0]);
  const quotesFn = useServerFn(getQuotes);
  const candlesFn = useServerFn(getCandles);

  const { data: qData, isLoading: qLoading, error: qErr, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["finnhub-quotes", symbols.join(",")],
    queryFn: async () => await quotesFn({ data: { symbols } }),
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });

  const { data: cData, isLoading: cLoading } = useQuery({
    queryKey: ["finnhub-candles", active],
    queryFn: async () => await candlesFn({ data: { symbol: active, resolution: "D", days: 90 } }),
    staleTime: 5 * 60_000,
  });

  const quoteByActive: FinnhubQuote | undefined = qData?.quotes.find((q) => q.symbol === active);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// LIVE MARKETS</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Markets Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time quotes from Finnhub · refreshes every 10s
            {dataUpdatedAt > 0 && <span className="ml-2 font-mono text-[10px]">last tick {new Date(dataUpdatedAt).toLocaleTimeString()}</span>}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-3 h-9 rounded-md border border-border hover:border-primary text-xs font-mono uppercase tracking-widest"
        >
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
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
          const up = (q?.dp ?? 0) >= 0;
          const isActive = active === sym;
          return (
            <button
              key={sym}
              onClick={() => setActive(sym)}
              className={`panel p-4 text-left transition-all ${isActive ? "border-primary glow-sm" : "hover:border-primary/50"}`}
            >
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
                  <div className="mt-2 text-[10px] font-mono text-muted-foreground">
                    H {q.h.toFixed(2)} · L {q.l.toFixed(2)} · O {q.o.toFixed(2)}
                  </div>
                </>
              ) : (
                <div className="text-xs text-muted-foreground mt-2">No data</div>
              )}
            </button>
          );
        })}
      </div>

      <div className="panel-neon p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">// CHART</p>
            <h2 className="font-display text-xl">{active} · Daily candles (90d)</h2>
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
              <p className="text-[11px] text-muted-foreground mt-1">Live quote ticker above is still updating every 10s.</p>
            </div>
          </div>
        ) : (
          <CandleChart candles={cData?.candles ?? []} />
        )}
      </div>
    </div>
  );
}

function sma(values: number[], window: number): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= window) sum -= values[i - window];
    out.push(i >= window - 1 ? sum / window : null);
  }
  return out;
}

function CandleChart({ candles }: { candles: Candle[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const overlays = useMemo(() => {
    const closes = candles.map((c) => c.close);
    const sma20 = sma(closes, 20);
    const sma50 = sma(closes, 50);
    return {
      sma20: candles.map((c, i) => ({ time: c.time, value: sma20[i] })).filter((p) => p.value !== null) as { time: number; value: number }[],
      sma50: candles.map((c, i) => ({ time: c.time, value: sma50[i] })).filter((p) => p.value !== null) as { time: number; value: number }[],
    };
  }, [candles]);

  useEffect(() => {
    if (!ref.current || candles.length === 0) return;
    const chart = createChart(ref.current, {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#94a3b8" },
      grid: { vertLines: { color: "rgba(148, 163, 184, 0.08)" }, horzLines: { color: "rgba(148, 163, 184, 0.08)" } },
      rightPriceScale: { borderColor: "rgba(148, 163, 184, 0.2)" },
      timeScale: { borderColor: "rgba(148, 163, 184, 0.2)", timeVisible: true },
      width: ref.current.clientWidth,
      height: 400,
    });
    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#34d399", downColor: "#f87171",
      borderUpColor: "#34d399", borderDownColor: "#f87171",
      wickUpColor: "#34d399", wickDownColor: "#f87171",
    });
    candleSeries.setData(candles.map((c) => ({ time: c.time as never, open: c.open, high: c.high, low: c.low, close: c.close })));

    if (overlays.sma20.length) {
      const s20 = chart.addSeries(LineSeries, { color: "#d4a017", lineWidth: 2, title: "SMA 20" });
      s20.setData(overlays.sma20.map((p) => ({ time: p.time as never, value: p.value })));
    }
    if (overlays.sma50.length) {
      const s50 = chart.addSeries(LineSeries, { color: "#60a5fa", lineWidth: 2, title: "SMA 50" });
      s50.setData(overlays.sma50.map((p) => ({ time: p.time as never, value: p.value })));
    }

    chart.timeScale().fitContent();

    const onResize = () => ref.current && chart.applyOptions({ width: ref.current.clientWidth });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [candles, overlays]);

  if (candles.length === 0) {
    return <div className="h-[400px] grid place-items-center text-sm text-muted-foreground">No candle data</div>;
  }
  return <div ref={ref} className="w-full" />;
}
