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
    const results = await Promise.all(
      data.symbols.map(async (sym): Promise<FinnhubQuote | null> => {
        try {
          const res = await fetchFinnhub(`/quote?symbol=${encodeURIComponent(sym)}`);
          if (!res.ok) {
            errors.push(`${sym}: HTTP ${res.status}`);
            return null;
          }
          const j = (await res.json()) as Omit<FinnhubQuote, "symbol">;
          if (!Number.isFinite(j.c) || j.c === 0) {
            errors.push(`${sym}: no data`);
            return null;
          }
          return { symbol: sym, ...j };
        } catch (e) {
          errors.push(`${sym}: ${(e as Error).message}`);
          return null;
        }
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

export const getCandles = createServerFn({ method: "POST" })
  .inputValidator((d) => CandleInput.parse(d))
  .handler(async ({ data }): Promise<{ candles: Candle[]; error?: string }> => {
    const to = Math.floor(Date.now() / 1000);
    const from = to - data.days * 86400;
    const path = `/stock/candle?symbol=${encodeURIComponent(data.symbol)}&resolution=${data.resolution}&from=${from}&to=${to}`;
    try {
      const res = await fetchFinnhub(path);
      if (!res.ok) {
        return { candles: [], error: `Candles unavailable (HTTP ${res.status}). Free plan may restrict historical data.` };
      }
      const j = (await res.json()) as { s: string; t: number[]; o: number[]; h: number[]; l: number[]; c: number[] };
      if (j.s !== "ok" || !Array.isArray(j.t) || j.t.length === 0) {
        return { candles: [], error: "No historical candles available for this symbol on the current plan." };
      }
      const candles: Candle[] = j.t.map((time, i) => ({
        time,
        open: j.o[i],
        high: j.h[i],
        low: j.l[i],
        close: j.c[i],
      }));
      return { candles };
    } catch (e) {
      return { candles: [], error: (e as Error).message };
    }
  });
