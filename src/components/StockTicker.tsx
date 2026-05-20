import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { getStocks, type StockQuote } from "@/lib/stocks.functions";

export function StockTicker() {
  const fetchStocks = useServerFn(getStocks);
  const { data, isLoading } = useQuery<StockQuote[]>({
    queryKey: ["stocks-ticker"],
    queryFn: () => fetchStocks(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="panel-neon p-4 flex items-center justify-center gap-2 text-xs font-mono text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Loading live market…
      </div>
    );
  }

  const quotes = (data ?? []).filter((q) => Number.isFinite(q.price));
  if (!quotes.length) return null;
  // Duplicate list for seamless marquee
  const loop = [...quotes, ...quotes];

  return (
    <div className="panel-neon overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card/40">
        <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">// LIVE MARKETS</span>
      </div>
      <div className="relative overflow-hidden">
        <div className="flex gap-8 py-3 whitespace-nowrap animate-[ticker_60s_linear_infinite] hover:[animation-play-state:paused]">
          {loop.map((q, i) => {
            const up = q.changePct >= 0;
            return (
              <div key={`${q.symbol}-${i}`} className="flex items-center gap-2 font-mono text-xs">
                <span className="text-muted-foreground">{q.name}</span>
                <span className="text-foreground font-semibold">{q.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                <span className={`flex items-center gap-1 ${up ? "text-success" : "text-destructive"}`}>
                  {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {up ? "+" : ""}{q.changePct.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}
