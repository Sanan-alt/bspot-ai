import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type FinnhubQuote = {
  symbol: string;
  c: number; // current
  d: number; // change
  dp: number; // change %
  h: number;
  l: number;
  o: number;
  pc: number; // prev close
  t: number;
};

const QuoteInput = z.object({ symbols: z.array(z.string().min(1).max(10)).min(1).max(10) });

async function fetchFinnhub(path: string): Promise<Response> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error("FINNHUB_API_KEY not configured");
  const url = `https://finnhub.io/api/v1${path}${path.includes("?") ? "&" : "?"}token=${key}`;
  const res = await fetch(url, { headers: { "User-Agent": "BSpotAI/1.0" } });
  return res;
}

export const getQuotes = createServerFn({ method: "POST" })
  .inputValidator((d) => QuoteInput.parse(d))
  .handler(async ({ data }): Promise<{ quotes: FinnhubQuote[]; errors: string[] }> => {
    const errors: string[] = [];
    async function yahooQuote(sym: string): Promise<FinnhubQuote | null> {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d`;
        const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 BSpotAI/1.0" } });
        if (!r.ok) return null;
        const j = (await r.json()) as {
          chart?: { result?: Array<{ meta?: { regularMarketPrice?: number; chartPreviousClose?: number; previousClose?: number; regularMarketTime?: number } }> };
        };
        const m = j.chart?.result?.[0]?.meta;
        const c = m?.regularMarketPrice;
        const pc = m?.previousClose ?? m?.chartPreviousClose;
        if (!Number.isFinite(c) || !c) return null;
        const prev = Number.isFinite(pc) && pc ? (pc as number) : c;
        const d = c - prev;
        const dp = prev ? (d / prev) * 100 : 0;
        return { symbol: sym, c, d, dp, h: c, l: c, o: prev, pc: prev, t: m?.regularMarketTime ?? Math.floor(Date.now() / 1000) };
      } catch {
        return null;
      }
    }
    const results = await Promise.all(
      data.symbols.map(async (sym): Promise<FinnhubQuote | null> => {
        // Try Finnhub first (real-time, when key is valid)
        try {
          const res = await fetchFinnhub(`/quote?symbol=${encodeURIComponent(sym)}`);
          if (res.ok) {
            const j = (await res.json()) as Omit<FinnhubQuote, "symbol">;
            if (Number.isFinite(j.c) && j.c !== 0) return { symbol: sym, ...j };
          }
        } catch { /* fallthrough */ }
        // Fallback to Yahoo (free, ~15min delayed)
        const y = await yahooQuote(sym);
        if (y) return y;
        errors.push(`${sym}: unavailable`);
        return null;
      }),
    );
    return { quotes: results.filter((q): q is FinnhubQuote => q !== null), errors };
  });

const CandleInput = z.object({
  symbol: z.string().min(1).max(10),
  resolution: z.enum(["1", "5", "15", "30", "60", "D"]).default("D"),
  days: z.number().int().min(1).max(365).default(60),
});

export type Candle = { time: number; open: number; high: number; low: number; close: number };

async function fetchYahooCandles(symbol: string, days: number): Promise<{ candles: Candle[]; error?: string }> {
  const range = days <= 7 ? "5d" : days <= 31 ? "1mo" : days <= 95 ? "3mo" : days <= 190 ? "6mo" : "1y";
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${range}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 BSpotAI/1.0" } });
    if (!res.ok) return { candles: [], error: `Historical data unavailable (HTTP ${res.status}).` };
    const j = (await res.json()) as {
      chart?: { result?: Array<{ timestamp?: number[]; indicators?: { quote?: Array<{ open?: (number | null)[]; high?: (number | null)[]; low?: (number | null)[]; close?: (number | null)[] }> } }> };
    };
    const r = j.chart?.result?.[0];
    const q = r?.indicators?.quote?.[0];
    const t = r?.timestamp;
    if (!t || !q?.close) return { candles: [], error: "No historical data available for this symbol." };
    const candles: Candle[] = [];
    for (let i = 0; i < t.length; i++) {
      const o = q.open?.[i], h = q.high?.[i], l = q.low?.[i], c = q.close?.[i];
      if (o == null || h == null || l == null || c == null) continue;
      candles.push({ time: t[i], open: o, high: h, low: l, close: c });
    }
    if (!candles.length) return { candles: [], error: "No historical data available for this symbol." };
    return { candles };
  } catch (e) {
    return { candles: [], error: (e as Error).message };
  }
}

export const getCandles = createServerFn({ method: "POST" })
  .inputValidator((d) => CandleInput.parse(d))
  .handler(async ({ data }): Promise<{ candles: Candle[]; error?: string; source?: string }> => {
    // Finnhub free plan blocks /stock/candle (401/403). Use Yahoo Finance as primary free source.
    const yahoo = await fetchYahooCandles(data.symbol, data.days);
    if (yahoo.candles.length) return { ...yahoo, source: "yahoo" };

    // Fallback to Finnhub (paid plans only)
    const to = Math.floor(Date.now() / 1000);
    const from = to - data.days * 86400;
    try {
      const res = await fetchFinnhub(`/stock/candle?symbol=${encodeURIComponent(data.symbol)}&resolution=${data.resolution}&from=${from}&to=${to}`);
      if (res.ok) {
        const j = (await res.json()) as { s: string; t: number[]; o: number[]; h: number[]; l: number[]; c: number[] };
        if (j.s === "ok" && j.t?.length) {
          return {
            candles: j.t.map((time, i) => ({ time, open: j.o[i], high: j.h[i], low: j.l[i], close: j.c[i] })),
            source: "finnhub",
          };
        }
      }
    } catch { /* ignore */ }

    return { candles: [], error: yahoo.error ?? "No historical data available." };
  });
