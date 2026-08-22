/**
 * Server-only price lookup shared by the markets UI and the price-alert job.
 * Finnhub first (real-time when the key is valid), Yahoo Finance as fallback.
 */

export type SimpleQuote = { symbol: string; price: number; prevClose: number; changePct: number };

async function finnhubQuote(symbol: string): Promise<SimpleQuote | null> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return null;
  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`;
    const res = await fetch(url, { headers: { "User-Agent": "BSpotAI/1.0" } });
    if (!res.ok) return null;
    const j = (await res.json()) as { c?: number; pc?: number; dp?: number };
    if (!j.c || !Number.isFinite(j.c)) return null;
    const prev = Number.isFinite(j.pc) && j.pc ? (j.pc as number) : j.c;
    return { symbol, price: j.c, prevClose: prev, changePct: Number.isFinite(j.dp) ? (j.dp as number) : 0 };
  } catch {
    return null;
  }
}

async function yahooQuote(symbol: string): Promise<SimpleQuote | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 BSpotAI/1.0" } });
    if (!res.ok) return null;
    const j = (await res.json()) as {
      chart?: { result?: Array<{ meta?: { regularMarketPrice?: number; previousClose?: number; chartPreviousClose?: number } }> };
    };
    const m = j.chart?.result?.[0]?.meta;
    const c = m?.regularMarketPrice;
    if (!c || !Number.isFinite(c)) return null;
    const pc = m?.previousClose ?? m?.chartPreviousClose ?? c;
    return { symbol, price: c, prevClose: pc, changePct: pc ? ((c - pc) / pc) * 100 : 0 };
  } catch {
    return null;
  }
}

export async function fetchQuote(symbol: string): Promise<SimpleQuote | null> {
  return (await finnhubQuote(symbol)) ?? (await yahooQuote(symbol));
}

/** Fetch many symbols with a small concurrency cap so upstreams are not hammered. */
export async function fetchQuotes(symbols: string[], concurrency = 4): Promise<Map<string, SimpleQuote>> {
  const out = new Map<string, SimpleQuote>();
  const queue = [...new Set(symbols)];
  async function worker() {
    for (;;) {
      const sym = queue.shift();
      if (!sym) return;
      const q = await fetchQuote(sym);
      if (q) out.set(sym.toUpperCase(), q);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));
  return out;
}
