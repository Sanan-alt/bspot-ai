import { createServerFn } from "@tanstack/react-start";

export type StockQuote = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
};

// Yahoo-finance compatible mirror via Stooq CSV (no API key required).
// Returns one quote per requested symbol.
const SYMBOLS: { id: string; name: string }[] = [
  { id: "^spx", name: "S&P 500" },
  { id: "^dji", name: "Dow Jones" },
  { id: "^ixic", name: "Nasdaq" },
  { id: "^ftse", name: "FTSE 100" },
  { id: "^nkx", name: "Nikkei 225" },
  { id: "aapl.us", name: "Apple" },
  { id: "msft.us", name: "Microsoft" },
  { id: "googl.us", name: "Alphabet" },
  { id: "amzn.us", name: "Amazon" },
  { id: "nvda.us", name: "NVIDIA" },
  { id: "tsla.us", name: "Tesla" },
  { id: "meta.us", name: "Meta" },
];

export const getStocks = createServerFn({ method: "GET" }).handler(async (): Promise<StockQuote[]> => {
  const symList = SYMBOLS.map((s) => s.id).join(",");
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(symList)}&f=snd2t2ohlcp&h&e=csv`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 BSpotAI" } });
    if (!res.ok) throw new Error(`stooq ${res.status}`);
    const text = await res.text();
    const lines = text.trim().split(/\r?\n/);
    const header = lines.shift();
    if (!header) return [];
    const rows = lines.map((l) => l.split(","));
    const quotes: StockQuote[] = [];
    for (const row of rows) {
      const [sym, , , , , , close, , changePct] = row;
      if (!sym || !close || close === "N/D") continue;
      const meta = SYMBOLS.find((s) => s.id.toLowerCase() === sym.toLowerCase());
      const price = parseFloat(close);
      const pct = parseFloat(String(changePct).replace("%", ""));
      if (!Number.isFinite(price)) continue;
      quotes.push({
        symbol: (meta?.id ?? sym).replace(".us", "").replace("^", "").toUpperCase(),
        name: meta?.name ?? sym.toUpperCase(),
        price,
        change: (price * (pct || 0)) / 100,
        changePct: Number.isFinite(pct) ? pct : 0,
      });
    }
    return quotes;
  } catch {
    // Fallback static demo if upstream is unreachable
    return SYMBOLS.slice(0, 8).map((s, i) => ({
      symbol: s.id.replace(".us", "").replace("^", "").toUpperCase(),
      name: s.name,
      price: 100 + i * 37.4,
      change: ((i % 3) - 1) * 1.2,
      changePct: ((i % 3) - 1) * 0.45,
    }));
  }
});
