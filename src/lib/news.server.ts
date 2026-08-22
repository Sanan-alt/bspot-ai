/**
 * Lightweight news aggregation via Google News RSS — no API key, no vendor cost.
 * Results are cached in-memory for 10 minutes per query.
 */
import type { NewsItem } from "./news.functions";

const TTL_MS = 10 * 60_000;
const cache = new Map<string, { at: number; items: NewsItem[] }>();

export function buildQuery(topic: string, country?: string, custom?: string): string {
  if (topic === "custom" && custom) return custom;
  if (topic === "country" && country) {
    return `${country} economy OR investment OR business OR visa`;
  }
  return "stock market OR forex OR global economy";
}

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function pick(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decode(m[1]) : "";
}

export async function fetchNews(query: string, limit: number): Promise<NewsItem[]> {
  const key = `${query}::${limit}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.items;

  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 BSpotAI/1.0" } });
  if (!res.ok) throw new Error(`News feed unavailable (HTTP ${res.status})`);
  const xml = await res.text();

  const items: NewsItem[] = [];
  const blocks = xml.split(/<item>/i).slice(1);
  for (const raw of blocks) {
    const block = raw.split(/<\/item>/i)[0];
    const title = pick(block, "title");
    const link = pick(block, "link");
    if (!title || !link) continue;
    const pub = pick(block, "pubDate");
    const source = pick(block, "source") || "Google News";
    const d = pub ? new Date(pub) : new Date();
    items.push({
      title,
      link,
      source,
      published: Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString(),
    });
    if (items.length >= limit) break;
  }

  cache.set(key, { at: Date.now(), items });
  return items;
}
