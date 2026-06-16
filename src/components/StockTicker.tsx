import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { getMarketData, type MarketTick } from "@/lib/market.functions";

function categoryColor(cat: MarketTick["category"]) {
  switch (cat) {
    case "forex": return "text-[oklch(0.78_0.16_220)]";
    case "crypto": return "text-[oklch(0.82_0.18_50)]";
    case "stock": return "text-neon";
  }
}

function formatPrice(p: number, cat: MarketTick["category"]) {
  if (cat === "forex") return p.toLocaleString(undefined, { maximumFractionDigits: 4 });
  if (cat === "crypto") return p >= 100 ? p.toLocaleString(undefined, { maximumFractionDigits: 0 }) : p.toFixed(2);
  return p.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function StockTicker() {
  const fetchMarket = useServerFn(getMarketData);
  const { data, isLoading, dataUpdatedAt } = useQuery<MarketTick[]>({
    queryKey: ["market-ticker"],
    queryFn: () => fetchMarket(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const [secondsAgo, setSecondsAgo] = useState(0);
  useEffect(() => {
    if (!dataUpdatedAt) return;
    const tick = () => setSecondsAgo(Math.floor((Date.now() - dataUpdatedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dataUpdatedAt]);

  if (isLoading) {
    return (
      <div className="panel-neon p-4 flex items-center justify-center gap-2 text-xs font-mono text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Loading live market…
      </div>
    );
  }

  const quotes = (data ?? []).filter((q) => Number.isFinite(q.price));
  if (!quotes.length) return null;
  const loop = [...quotes, ...quotes];

  return (
    <div className="panel-neon overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card/40">
        <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          // LIVE · forex · crypto · stocks
        </span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">
          updated {secondsAgo}s ago
        </span>
      </div>
      <div className="relative overflow-hidden">
        <div className="flex gap-8 py-3 whitespace-nowrap animate-[ticker_90s_linear_infinite] hover:[animation-play-state:paused]">
          {loop.map((q, i) => {
            const up = q.changePct >= 0;
            const hasDelta = Math.abs(q.changePct) > 0.0001;
            return (
              <div key={`${q.symbol}-${i}`} className="flex items-center gap-2 font-mono text-xs">
                <span className={`uppercase tracking-widest text-[10px] ${categoryColor(q.category)}`}>
                  {q.name}
                </span>
                <span className="text-foreground font-semibold">{formatPrice(q.price, q.category)}</span>
                {hasDelta ? (
                  <span className={`flex items-center gap-1 ${up ? "text-success" : "text-destructive"}`}>
                    {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {up ? "+" : ""}{q.changePct.toFixed(2)}%
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <style>{`@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}
