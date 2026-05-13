import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, Sparkles, TrendingUp, ShieldAlert, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { scoreCountry } from "@/lib/countries.functions";

export const Route = createFileRoute("/app/countries")({ component: CountriesPage });

type Country = { code: string; name: string; region: string; flag: string; currency: string };

const COUNTRIES: Country[] = [
  { code: "US", name: "United States", region: "Americas", flag: "🇺🇸", currency: "USD" },
  { code: "CA", name: "Canada", region: "Americas", flag: "🇨🇦", currency: "CAD" },
  { code: "MX", name: "Mexico", region: "Americas", flag: "🇲🇽", currency: "MXN" },
  { code: "BR", name: "Brazil", region: "Americas", flag: "🇧🇷", currency: "BRL" },
  { code: "AR", name: "Argentina", region: "Americas", flag: "🇦🇷", currency: "ARS" },
  { code: "CL", name: "Chile", region: "Americas", flag: "🇨🇱", currency: "CLP" },
  { code: "GB", name: "United Kingdom", region: "Europe", flag: "🇬🇧", currency: "GBP" },
  { code: "DE", name: "Germany", region: "Europe", flag: "🇩🇪", currency: "EUR" },
  { code: "FR", name: "France", region: "Europe", flag: "🇫🇷", currency: "EUR" },
  { code: "ES", name: "Spain", region: "Europe", flag: "🇪🇸", currency: "EUR" },
  { code: "IT", name: "Italy", region: "Europe", flag: "🇮🇹", currency: "EUR" },
  { code: "NL", name: "Netherlands", region: "Europe", flag: "🇳🇱", currency: "EUR" },
  { code: "CH", name: "Switzerland", region: "Europe", flag: "🇨🇭", currency: "CHF" },
  { code: "SE", name: "Sweden", region: "Europe", flag: "🇸🇪", currency: "SEK" },
  { code: "NO", name: "Norway", region: "Europe", flag: "🇳🇴", currency: "NOK" },
  { code: "PL", name: "Poland", region: "Europe", flag: "🇵🇱", currency: "PLN" },
  { code: "TR", name: "Turkey", region: "Europe", flag: "🇹🇷", currency: "TRY" },
  { code: "RU", name: "Russia", region: "Europe", flag: "🇷🇺", currency: "RUB" },
  { code: "UA", name: "Ukraine", region: "Europe", flag: "🇺🇦", currency: "UAH" },
  { code: "CN", name: "China", region: "Asia", flag: "🇨🇳", currency: "CNY" },
  { code: "JP", name: "Japan", region: "Asia", flag: "🇯🇵", currency: "JPY" },
  { code: "KR", name: "South Korea", region: "Asia", flag: "🇰🇷", currency: "KRW" },
  { code: "IN", name: "India", region: "Asia", flag: "🇮🇳", currency: "INR" },
  { code: "SG", name: "Singapore", region: "Asia", flag: "🇸🇬", currency: "SGD" },
  { code: "HK", name: "Hong Kong", region: "Asia", flag: "🇭🇰", currency: "HKD" },
  { code: "ID", name: "Indonesia", region: "Asia", flag: "🇮🇩", currency: "IDR" },
  { code: "TH", name: "Thailand", region: "Asia", flag: "🇹🇭", currency: "THB" },
  { code: "VN", name: "Vietnam", region: "Asia", flag: "🇻🇳", currency: "VND" },
  { code: "AE", name: "UAE", region: "MENA", flag: "🇦🇪", currency: "AED" },
  { code: "SA", name: "Saudi Arabia", region: "MENA", flag: "🇸🇦", currency: "SAR" },
  { code: "IL", name: "Israel", region: "MENA", flag: "🇮🇱", currency: "ILS" },
  { code: "EG", name: "Egypt", region: "MENA", flag: "🇪🇬", currency: "EGP" },
  { code: "ZA", name: "South Africa", region: "Africa", flag: "🇿🇦", currency: "ZAR" },
  { code: "NG", name: "Nigeria", region: "Africa", flag: "🇳🇬", currency: "NGN" },
  { code: "KE", name: "Kenya", region: "Africa", flag: "🇰🇪", currency: "KES" },
  { code: "AU", name: "Australia", region: "Oceania", flag: "🇦🇺", currency: "AUD" },
  { code: "NZ", name: "New Zealand", region: "Oceania", flag: "🇳🇿", currency: "NZD" },
];

type Score = {
  overall: number; stability: number; growth: number; risk: number;
  currency: string; summary: string;
  opportunities: string[]; risks: string[]; top_sectors: string[];
};

function CountriesPage() {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<string>("All");
  const [selected, setSelected] = useState<Country | null>(null);
  const score = useServerFn(scoreCountry);

  const regions = useMemo(() => ["All", ...Array.from(new Set(COUNTRIES.map(c => c.region)))], []);
  const filtered = useMemo(
    () => COUNTRIES.filter(c =>
      (region === "All" || c.region === region) &&
      (c.name.toLowerCase().includes(q.toLowerCase()) || c.code.toLowerCase().includes(q.toLowerCase()))
    ),
    [q, region]
  );

  const { data, isFetching, error } = useQuery<Score>({
    queryKey: ["country-score", selected?.code],
    queryFn: () => score({ data: { code: selected!.code, name: selected!.name } }),
    enabled: !!selected,
    staleTime: 1000 * 60 * 30,
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// COUNTRY DATA</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">Investment Atlas</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-scored country profiles · click any tile</p>
      </div>

      <div className="panel-neon p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search country or ISO code…" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1">
          {regions.map(r => (
            <button key={r}
              onClick={() => setRegion(r)}
              className={`px-3 h-8 rounded-md text-xs font-mono uppercase tracking-widest border ${
                region === r ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-neon"
              }`}>{r}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filtered.map(c => (
          <button
            key={c.code}
            onClick={() => setSelected(c)}
            className="panel p-4 text-left hover:border-primary hover:glow-sm transition-all group"
          >
            <div className="text-3xl">{c.flag}</div>
            <div className="mt-2 font-display text-sm leading-tight group-hover:text-neon">{c.name}</div>
            <div className="mt-1 font-mono text-[10px] text-muted-foreground tracking-widest">{c.code} · {c.currency}</div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-sm text-muted-foreground py-10">No matches.</div>
        )}
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <div className="text-5xl">{selected.flag}</div>
                <SheetTitle className="font-display text-2xl">{selected.name}</SheetTitle>
                <SheetDescription className="font-mono text-xs tracking-widest">
                  {selected.code} · {selected.region} · {selected.currency}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                {isFetching && (
                  <div className="terminal p-6 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-neon" />
                    <p className="mt-2 text-xs">// AI scoring in progress…</p>
                  </div>
                )}
                {error && <div className="text-sm text-destructive">{(error as Error).message}</div>}

                {data && (
                  <>
                    <div className="panel-neon p-5 text-center">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">// Overall Score</p>
                      <p className="mt-2 font-display text-6xl text-neon">{data.overall}</p>
                      <p className="mt-1 text-xs text-muted-foreground">/ 100</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <Metric icon={<Activity className="h-4 w-4" />} label="Stability" value={data.stability} />
                      <Metric icon={<TrendingUp className="h-4 w-4" />} label="Growth" value={data.growth} />
                      <Metric icon={<ShieldAlert className="h-4 w-4" />} label="Risk" value={data.risk} />
                    </div>

                    <div className="panel p-4">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">// Summary</p>
                      <p className="text-sm">{data.summary}</p>
                    </div>

                    <Section title="Opportunities" items={data.opportunities} accent />
                    <Section title="Risks" items={data.risks} />
                    <Section title="Top Sectors" items={data.top_sectors} />

                    <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                      <Sparkles className="h-3 w-3 text-neon" /> Powered by Lovable AI · gemini-2.5-flash
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="panel p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground">{icon}</div>
      <p className="mt-1 font-display text-xl text-neon">{value}</p>
      <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

function Section({ title, items, accent }: { title: string; items: string[]; accent?: boolean }) {
  if (!items?.length) return null;
  return (
    <div className="panel p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">// {title}</p>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="text-sm flex gap-2">
            <span className={accent ? "text-neon" : "text-muted-foreground"}>›</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
