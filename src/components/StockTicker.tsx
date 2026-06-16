import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown, AlertTriangle, RefreshCw } from "lucide-react";
import { getMarketData, type MarketTick, type MarketResponse } from "@/lib/market.functions";

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

const TTL_SECONDS = 60;

function TickerSkeleton() {
  return (
    <div className="panel-neon overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card/40">
        <span className="h-2 w-2 rounded-full bg-muted animate-pulse" />
        <span className="h-2 w-40 rounded bg-muted/50 animate-pulse" />
        <span className="ml-auto h-2 w-16 rounded bg-muted/40 animate-pulse" />
      </div>
      <div className="flex gap-8 py-3 px-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-2 w-12 rounded bg-muted/40 animate-pulse" />
            <span className="h-2 w-16 rounded bg-muted/30 animate-pulse" />
            <span className="h-2 w-10 rounded bg-muted/20 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function StockTicker() {
  const { t } = useTranslation();
  const fetchMarket = useServerFn(getMarketData);
  const { data, isLoading, isError, dataUpdatedAt, refetch, isRefetching, failureCount } = useQuery<MarketResponse>({
    queryKey: ["market-ticker"],
    queryFn: () => fetchMarket(),
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15_000),
  });

  const [secondsAgo, setSecondsAgo] = useState(0);
  useEffect(() => {
    if (!dataUpdatedAt) return;
    const tick = () => setSecondsAgo(Math.floor((Date.now() - dataUpdatedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dataUpdatedAt]);

  if (isLoading) return <TickerSkeleton />;

  const quotes = (data?.ticks ?? []).filter((q) => Number.isFinite(q.price));
  const errors = data?.errors ?? [];
  const validFor = Math.max(0, TTL_SECONDS - secondsAgo);

  if (isError || (!quotes.length && errors.length)) {
    return (
      <div className="panel-neon p-4 space-y-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-muted-foreground">{t("ticker.error")}</span>
          <button
            onClick={() => refetch()}
            className="ml-auto inline-flex items-center gap-1 text-neon hover:underline disabled:opacity-50"
            disabled={isRefetching}
          >
            <RefreshCw className={`h-3 w-3 ${isRefetching ? "animate-spin" : ""}`} />
            {isRefetching ? t("ticker.retrying", { n: failureCount + 1 }) : t("ticker.retry")}
          </button>
        </div>
        {errors.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {errors.map((e) => (
              <li key={e.category} className="px-2 py-0.5 rounded-sm border border-destructive/40 text-destructive/90">
                {t(`ticker.feed_${e.category}`)} · {t("ticker.failed")}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (!quotes.length) return null;
  const loop = [...quotes, ...quotes];
  const partial = errors.length > 0;

  return (
    <div className="panel-neon overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-border bg-card/40">
        <span className={`h-2 w-2 rounded-full animate-pulse ${partial ? "bg-yellow-500" : "bg-success"}`} />
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          // {partial ? t("ticker.partial") : "LIVE · forex · crypto · stocks"}
        </span>
        {partial && (
          <span className="flex flex-wrap gap-1">
            {errors.map((e) => (
              <span
                key={e.category}
                title={e.message}
                className="px-1.5 py-0.5 rounded-sm border border-yellow-500/40 text-yellow-500/90 font-mono text-[9px] uppercase"
              >
                {t(`ticker.feed_${e.category}`)} · {t("ticker.delayed")}
              </span>
            ))}
          </span>
        )}
        <span className="ml-auto flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
          <span>{t("ticker.updated", { s: secondsAgo })}</span>
          <span>· {t("ticker.valid_for", { s: validFor })}</span>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="inline-flex items-center gap-1 hover:text-neon disabled:opacity-50"
            aria-label={t("ticker.retry")}
          >
            <RefreshCw className={`h-3 w-3 ${isRefetching ? "animate-spin" : ""}`} />
          </button>
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
