import { createServerFn } from "@tanstack/react-start";

export type MarketTick = {
  symbol: string;
  name: string;
  category: "forex" | "crypto" | "stock";
  price: number;
  changePct: number;
};

export type MarketResponse = {
  ticks: MarketTick[];
  errors: { category: MarketTick["category"]; message: string }[];
  fetched_at: number;
};

const TTL_MS = 60_000;
const STALE_MAX_MS = 30 * 60_000; // serve up to 30m old data on full upstream failure
const cache: { current: MarketResponse | null } = { current: null };

async function fetchWithRetry(url: string, label: string, attempts = 3, timeoutMs = 6000): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 BSpotAI" },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`${label} HTTP ${res.status}`);
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 250 * Math.pow(2, i)));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(`${label} failed`);
}

const FOREX_PAIRS = [
  { code: "PKR", name: "USD/PKR" },
  { code: "AED", name: "USD/AED" },
  { code: "INR", name: "USD/INR" },
  { code: "GBP", name: "USD/GBP" },
  { code: "CAD", name: "USD/CAD" },
];

async function fetchForex(): Promise<MarketTick[]> {
  const res = await fetchWithRetry("https://open.er-api.com/v6/latest/USD", "forex");
  const json = (await res.json()) as { rates?: Record<string, number> };
  const rates = json.rates ?? {};
  return FOREX_PAIRS.flatMap((p) => {
    const price = rates[p.code];
    if (!Number.isFinite(price)) return [];
    return [{ symbol: p.code, name: p.name, category: "forex" as const, price, changePct: 0 }];
  });
}

const CRYPTO_IDS = [
  { id: "bitcoin", symbol: "BTC", name: "BTC/USD" },
  { id: "ethereum", symbol: "ETH", name: "ETH/USD" },
  { id: "solana", symbol: "SOL", name: "SOL/USD" },
];

async function fetchCrypto(): Promise<MarketTick[]> {
  const ids = CRYPTO_IDS.map((c) => c.id).join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
  const res = await fetchWithRetry(url, "crypto");
  const json = (await res.json()) as Record<string, { usd: number; usd_24h_change?: number }>;
  return CRYPTO_IDS.flatMap((c) => {
    const row = json[c.id];
    if (!row || !Number.isFinite(row.usd)) return [];
    return [{
      symbol: c.symbol, name: c.name, category: "crypto" as const,
      price: row.usd, changePct: Number(row.usd_24h_change ?? 0),
    }];
  });
}

const STOCK_SYMBOLS = [
  { id: "aapl.us", symbol: "AAPL", name: "Apple" },
  { id: "msft.us", symbol: "MSFT", name: "Microsoft" },
  { id: "googl.us", symbol: "GOOGL", name: "Alphabet" },
  { id: "tsla.us", symbol: "TSLA", name: "Tesla" },
  { id: "nvda.us", symbol: "NVDA", name: "NVIDIA" },
  { id: "^spx", symbol: "SPX", name: "S&P 500" },
  { id: "^dji", symbol: "DJI", name: "Dow Jones" },
];

async function fetchStocks(): Promise<MarketTick[]> {
  const symList = STOCK_SYMBOLS.map((s) => s.id).join(",");
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(symList)}&f=snd2t2ohlcp&h&e=csv`;
  const res = await fetchWithRetry(url, "stocks");
  const text = await res.text();
  const lines = text.trim().split(/\r?\n/);
  lines.shift();
  const out: MarketTick[] = [];
  for (const line of lines) {
    const row = line.split(",");
    const [sym, , , , , , close, , changePct] = row;
    const meta = STOCK_SYMBOLS.find((s) => s.id.toLowerCase() === (sym || "").toLowerCase());
    if (!meta) continue;
    const price = parseFloat(close);
    if (!Number.isFinite(price)) continue;
    const pct = parseFloat(String(changePct).replace("%", ""));
    out.push({
      symbol: meta.symbol, name: meta.name, category: "stock",
      price, changePct: Number.isFinite(pct) ? pct : 0,
    });
  }
  return out;
}

export const getMarketData = createServerFn({ method: "GET" }).handler(
  async (): Promise<MarketResponse> => {
    const c = cache.current;
    if (c && Date.now() - c.fetched_at < TTL_MS) return c;

    const results = await Promise.allSettled([fetchForex(), fetchCrypto(), fetchStocks()]);
    const labels: MarketTick["category"][] = ["forex", "crypto", "stock"];
    const ticks: MarketTick[] = [];
    const errors: MarketResponse["errors"] = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled") ticks.push(...r.value);
      else errors.push({ category: labels[i], message: (r.reason as Error)?.message ?? "unknown" });
    });

    // If everything failed but we have a recent-enough cache, return stale data.
    if (!ticks.length && c && Date.now() - c.fetched_at < STALE_MAX_MS) {
      return { ...c, errors };
    }

    const response: MarketResponse = { ticks, errors, fetched_at: Date.now() };
    if (ticks.length) cache.current = response;
    return response;
  },
);
