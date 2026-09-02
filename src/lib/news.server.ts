/**
 * Multi-source news aggregation with automatic failover.
 * Sources are tried in order until one returns results:
 *   1. Google News RSS   (free, no key)
 *   2. Bing News RSS     (free, no key)
 *   3. Yahoo News RSS    (free, no key)
 *   4. Mediastack API    (key: MEDIASTACK_API_KEY)
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

function toIso(pub: string): string {
  const d = pub ? new Date(pub) : new Date();
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

async function timedFetch(url: string, ms = 8000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BSpotAI/1.0)",
        Accept: "application/rss+xml, application/xml, text/xml, application/json;q=0.9,*/*;q=0.8",
      },
    });
  } finally {
    clearTimeout(t);
  }
}

function parseRss(xml: string, limit: number, fallbackSource: string): NewsItem[] {
  const items: NewsItem[] = [];
  const blocks = xml.split(/<item[\s>]/i).slice(1);
  for (const raw of blocks) {
    const block = raw.split(/<\/item>/i)[0];
    const title = pick(block, "title");
    let link = pick(block, "link");
    if (!link) {
      const m = block.match(/<link[^>]*href="([^"]+)"/i);
      if (m) link = decode(m[1]);
    }
    if (!title || !link) continue;
    items.push({
      title,
      link,
      source: pick(block, "source") || fallbackSource,
      published: toIso(pick(block, "pubDate") || pick(block, "published") || pick(block, "updated")),
    });
    if (items.length >= limit) break;
  }
  return items;
}

async function fromRss(url: string, limit: number, label: string): Promise<NewsItem[]> {
  const res = await timedFetch(url);
  if (!res.ok) throw new Error(`${label} HTTP ${res.status}`);
  return parseRss(await res.text(), limit, label);
}

async function fromMediastack(query: string, limit: number): Promise<NewsItem[]> {
  const key = process.env["MEDIASTACK_API_KEY"];
  if (!key) throw new Error("Mediastack key missing");
  const url =
    `http://api.mediastack.com/v1/news?access_key=${encodeURIComponent(key)}` +
    `&languages=en&sort=published_desc&limit=${Math.min(limit, 25)}` +
    `&keywords=${encodeURIComponent(query.replace(/ OR /g, ",").slice(0, 200))}`;
  const res = await timedFetch(url);
  if (!res.ok) throw new Error(`Mediastack HTTP ${res.status}`);
  const json = (await res.json()) as {
    data?: Array<{ title?: string; url?: string; source?: string; published_at?: string }>;
    error?: { message?: string };
  };
  if (json.error) throw new Error(json.error.message || "Mediastack error");
  return (json.data ?? [])
    .filter((a) => a.title && a.url)
    .slice(0, limit)
    .map((a) => ({
      title: a.title!,
      link: a.url!,
      source: a.source || "Mediastack",
      published: toIso(a.published_at ?? ""),
    }));
}

export async function fetchNews(query: string, limit: number): Promise<NewsItem[]> {
  const key = `${query}::${limit}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.items;

  const q = encodeURIComponent(query);
  const sources: Array<{ label: string; run: () => Promise<NewsItem[]> }> = [
    {
      label: "Google News",
      run: () => fromRss(`https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`, limit, "Google News"),
    },
    {
      label: "Bing News",
      run: () => fromRss(`https://www.bing.com/news/search?q=${q}&format=RSS`, limit, "Bing News"),
    },
    {
      label: "Yahoo News",
      run: () => fromRss(`https://news.search.yahoo.com/rss?p=${q}`, limit, "Yahoo News"),
    },
    { label: "Mediastack", run: () => fromMediastack(query, limit) },
  ];

  const errors: string[] = [];
  for (const s of sources) {
    try {
      const items = await s.run();
      if (items.length) {
        cache.set(key, { at: Date.now(), items });
        return items;
      }
      errors.push(`${s.label}: empty`);
    } catch (e) {
      errors.push(`${s.label}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  // Serve stale cache rather than nothing.
  if (hit) return hit.items;
  throw new Error(`News temporarily unavailable (${errors.join("; ")})`);
}
