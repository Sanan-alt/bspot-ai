import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Loader2, Newspaper, RefreshCw } from "lucide-react";
import { getNews, type NewsItem } from "@/lib/news.functions";

type Props = {
  topic?: "markets" | "country" | "custom";
  country?: string;
  query?: string;
  limit?: number;
  title?: string;
  compact?: boolean;
};

function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export function NewsFeed({ topic = "markets", country, query, limit = 8, title = "Market headlines", compact = false }: Props) {
  const newsFn = useServerFn(getNews);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await newsFn({ data: { topic, country, query, limit } });
      setItems(res.items);
      if (res.error) setError(res.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load news");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, country, query, limit]);

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-neon" />
          <h2 className="font-display text-lg">{title}</h2>
        </div>
        <button
          onClick={load}
          className="h-8 w-8 grid place-items-center rounded-md border border-border hover:border-primary hover:text-neon"
          aria-label="Refresh headlines"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Free, live headlines aggregated from public news feeds. Costs no credits. Always verify before acting.
      </p>

      {loading && !items.length ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading headlines…
        </div>
      ) : error && !items.length ? (
        <p className="text-sm text-muted-foreground py-4">{error}</p>
      ) : !items.length ? (
        <p className="text-sm text-muted-foreground py-4">No headlines right now.</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((n) => (
            <li key={n.link} className="py-2.5">
              <a
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2 text-sm hover:text-neon"
              >
                <ExternalLink className="h-3.5 w-3.5 mt-0.5 shrink-0 opacity-60 group-hover:opacity-100" />
                <span className={compact ? "line-clamp-2" : ""}>
                  {n.title}
                  <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                    {n.source} · {timeAgo(n.published)}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
