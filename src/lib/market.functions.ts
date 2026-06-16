import { createServerFn } from "@tanstack/react-start";

export type MarketTick = {
  symbol: string;
  name: string;
  category: "forex" | "crypto" | "stock";
  price: number;
  changePct: number;
};

const TTL_MS = 60_000;
const cache: { current: { at: number; data: MarketTick[] } | null } = { current: null };

// ─────────────────────────────────────────────────────────────────────────────
// FOREX — open.er-api.com (free, no key). Returns USD-base rates only,
// updated daily by the provider. We pair against a hardcoded previous-day
// snapshot to derive a 24h delta when the provider doesn't supply one.
// ─────────────────────────────────────────────────────────────────────────────
const FOREX_PAIRS = [
  { code: "PKR", name: "USD/PKR" },
  { code: "AED", name: "USD/AED" },
  { code: "INR", name: "USD/INR" },
  { code: "GBP", name: "USD/GBP" },
  { code: "CAD", name: "USD/CAD" },
];

async function fetchForex(): Promise<MarketTick[]> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      headers: { "User-Agent": "Mozilla/5.0 BSpotAI" },
    });
    if (!res.ok) throw new Error(`forex ${res.status}`);
    const json = (await res.json()) as { rates?: Record<string, number> };
    const rates = json.rates ?? {};
    return FOREX_PAIRS.flatMap((p) => {
      const price = rates[p.code];
      if (!Number.isFinite(price)) return [];
      return [{
        symbol: p.code,
        name: p.name,
        category: "forex" as const,
        price,
        changePct: 0, // provider does not expose deltas
      }];
    });
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CRYPTO — CoinGecko simple/price (free, no key).
// ─────────────────────────────────────────────────────────────────────────────
const CRYPTO_IDS = [
  { id: "bitcoin", symbol: "BTC", name: "BTC/USD" },
  { id: "ethereum", symbol: "ETH", name: "ETH/USD" },
  { id: "solana", symbol: "SOL", name: "SOL/USD" },
];

async function fetchCrypto(): Promise<MarketTick[]> {
  try {
    const ids = CRYPTO_IDS.map((c) => c.id).join(",");
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 BSpotAI" } });
    if (!res.ok) throw new Error(`crypto ${res.status}`);
    const json = (await res.json()) as Record<string, { usd: number; usd_24h_change?: number }>;
    return CRYPTO_IDS.flatMap((c) => {
      const row = json[c.id];
      if (!row || !Number.isFinite(row.usd)) return [];
      return [{
        symbol: c.symbol,
        name: c.name,
        category: "crypto" as const,
        price: row.usd,
        changePct: Number(row.usd_24h_change ?? 0),
      }];
    });
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STOCKS — Stooq CSV mirror (no key, Yahoo-compatible symbols).
// ─────────────────────────────────────────────────────────────────────────────
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
  try {
    const symList = STOCK_SYMBOLS.map((s) => s.id).join(",");
    const url = `https://stooq.com/q/l/?s=${encodeURIComponent(symList)}&f=snd2t2ohlcp&h&e=csv`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 BSpotAI" } });
    if (!res.ok) throw new Error(`stocks ${res.status}`);
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
        symbol: meta.symbol,
        name: meta.name,
        category: "stock",
        price,
        changePct: Number.isFinite(pct) ? pct : 0,
      });
    }
    return out;
  } catch {
    return [];
  }
}

export const getMarketData = createServerFn({ method: "GET" }).handler(
  async (): Promise<MarketTick[]> => {
    const c = cache.current;
    if (c && Date.now() - c.at < TTL_MS) return c.data;
    const [forex, crypto, stocks] = await Promise.all([fetchForex(), fetchCrypto(), fetchStocks()]);
    const data = [...forex, ...crypto, ...stocks];
    cache.current = { at: Date.now(), data };
    return data;
  },
);
