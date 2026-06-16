import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, Sparkles, TrendingUp, ShieldAlert, Activity, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { scoreCountry } from "@/lib/countries.functions";
import { COUNTRIES, COUNTRY_BY_CODE } from "@/lib/countries-data";
import { WorldMap } from "@/components/WorldMap";
import { VISA_PROGRAMS } from "@/lib/visa-programs";
import { COUNTRY_DEEP } from "@/lib/country-deep";
import { Plane, CheckCircle2, Mail } from "lucide-react";

export const Route = createFileRoute("/app/countries")({ component: CountriesPage });

type Score = {
  overall: number; stability: number; growth: number; risk: number;
  currency: string; summary: string;
  opportunities: string[]; risks: string[]; top_sectors: string[];
  _cached?: boolean; _age_hours?: number;
};

function CountriesPage() {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<string>("All");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const score = useServerFn(scoreCountry);
  const qc = useQueryClient();
  const selected = selectedCode ? COUNTRY_BY_CODE[selectedCode] : null;

  const regions = useMemo(() => ["All", ...Array.from(new Set(COUNTRIES.map(c => c.region)))], []);
  const filtered = useMemo(
    () => COUNTRIES.filter(c =>
      (region === "All" || c.region === region) &&
      (c.name.toLowerCase().includes(q.toLowerCase()) || c.code.toLowerCase().includes(q.toLowerCase()))
    ),
    [q, region]
  );

  const { data, isFetching, error, refetch } = useQuery<Score>({
    queryKey: ["country-score", selectedCode],
    queryFn: async () => {
      // Server function atomically charges credits on cache miss; cached reads are free.
      return await score({ data: { code: selected!.code, name: selected!.name } });
    },
    enabled: !!selected,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const refresh = async () => {
    if (!selected) return;
    await score({ data: { code: selected.code, name: selected.name, refresh: true } });
    qc.invalidateQueries({ queryKey: ["country-score", selected.code] });
    refetch();
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// COUNTRY DATA</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">Investment Atlas</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-scored country profiles · click any highlighted country</p>
      </div>

      <div className="panel-neon p-3">
        <WorldMap onSelect={setSelectedCode} highlight={selectedCode} />
        <div className="mt-2 flex items-center justify-center gap-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-[oklch(0.30_0.08_95)]" /> Investable</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-[oklch(0.18_0.01_95)]" /> Not tracked</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-[oklch(0.88_0.19_95)]" /> Selected</span>
        </div>
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
            onClick={() => setSelectedCode(c.code)}
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

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedCode(null)}>
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
                {/* DEEP COUNTRY PROFILE — when curated data exists */}
                {COUNTRY_DEEP[selected.code] && (
                  <DeepProfile data={COUNTRY_DEEP[selected.code]} name={selected.name} />
                )}

                {isFetching && (
                  <div className="terminal p-6 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-neon" />
                    <p className="mt-2 text-xs">// AI scoring in progress…</p>
                  </div>
                )}
                {error && <div className="text-sm text-destructive">{(error as Error).message}</div>}

                {/* VISA & IMMIGRATION PROGRAMS — always shown */}
                {(() => {
                  const programs = VISA_PROGRAMS[selected.code] ?? [];
                  if (!programs.length) {
                    return (
                      <div className="panel p-4">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">// Visa & Immigration</p>
                        <p className="text-xs text-muted-foreground">No curated visa programs yet for {selected.name}. Email us suggestions at <a href="mailto:bspot.ai.official@gmail.com" className="text-neon">bspot.ai.official@gmail.com</a>.</p>
                      </div>
                    );
                  }
                  return (
                    <div className="panel p-4">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                        <Plane className="h-3 w-3 text-neon" /> Visa & Immigration Programs
                      </p>
                      <ul className="space-y-3">
                        {programs.map((p) => (
                          <li key={p.name} className="border-l-2 border-primary/40 pl-3">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-display text-sm">{p.name}</span>
                              {p.pathToPR && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-neon">
                                  <CheckCircle2 className="h-3 w-3" /> PR
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">
                              {p.category} · {p.minInvestment} · {p.duration}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{p.summary}</p>
                          </li>
                        ))}
                      </ul>
                      <a
                        href="mailto:bspot.ai.official@gmail.com"
                        className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-neon"
                      >
                        <Mail className="h-3 w-3" /> Suggest a program
                      </a>
                    </div>
                  );
                })()}


                {data && (
                  <>
                    <div className="panel-neon p-5 text-center relative">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">// Overall Score</p>
                      <p className="mt-2 font-display text-6xl text-neon">{data.overall}</p>
                      <p className="mt-1 text-xs text-muted-foreground">/ 100</p>
                      {data._cached && (
                        <button
                          onClick={refresh}
                          className="absolute top-3 right-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-neon flex items-center gap-1"
                          title="Refresh AI score"
                        >
                          <RefreshCw className="h-3 w-3" /> Cached {data._age_hours}h
                        </button>
                      )}
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
                      <Sparkles className="h-3 w-3 text-neon" /> Powered by Lovable AI · cached 24h
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

function DeepProfile({ data, name }: { data: import("@/lib/country-deep").CountryDeep; name: string }) {
  const [tab, setTab] = useState<"overview" | "visa" | "laws" | "zones">("overview");
  const tabs: { id: typeof tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "visa", label: "Visa" },
    { id: "laws", label: "Laws" },
    ...(data.zones ? [{ id: "zones" as const, label: "Zones" }] : []),
  ];

  return (
    <div className="panel-neon p-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">// BSPOT Deep Profile</p>
        <div className="text-right">
          <div className="font-display text-2xl text-neon">{data.bspot_score}</div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">BSpot Score</div>
        </div>
      </div>

      <div className="mt-3 flex border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
              tab === t.id ? "text-neon border-b-2 border-primary" : "text-muted-foreground hover:text-neon"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {tab === "overview" && (
          <>
            {[
              ["💰 Setup Cost (Year 1)", data.setup_cost_range],
              ["🇵🇰 In PKR", data.setup_cost_pkr],
              ["⏱ Setup Time", data.setup_time],
              ["🏢 Corporate Tax", data.corporate_tax],
              ["👤 Income Tax", data.personal_income_tax],
              ["🧾 VAT / Sales Tax", data.vat],
              ["🌍 Foreign Ownership", data.foreign_ownership],
              ["🏛 Political Stability", data.political_stability],
              ["📊 Business Ease Rank", data.ease_of_business_rank],
              ["👥 Best For", data.recommended_for],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-[140px_1fr] gap-2 text-xs">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
                <div>{value}</div>
              </div>
            ))}
            {data.pro_tip && (
              <div className="mt-4 panel p-3 border-l-2 border-primary">
                <p className="font-mono text-[10px] uppercase tracking-widest text-neon">⭐ BSpot Pro Tip</p>
                <p className="text-xs mt-1">{data.pro_tip}</p>
              </div>
            )}
          </>
        )}

        {tab === "visa" && (
          <ul className="space-y-3">
            {data.visa_programs.map((v) => (
              <li key={v.name} className="border-l-2 border-primary/40 pl-3">
                <div className="font-display text-sm">{v.name}</div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">
                  {v.type} · {v.duration}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Min investment: {v.min_investment}</p>
              </li>
            ))}
          </ul>
        )}

        {tab === "laws" && (
          <div className="space-y-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">// Laws for foreigners</p>
              <p className="text-xs mt-1 leading-relaxed">{data.laws_for_foreigners}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">// Banking</p>
              <p className="text-xs mt-1 leading-relaxed">{data.banking}</p>
            </div>
          </div>
        )}

        {tab === "zones" && data.zones && (
          <ul className="space-y-2">
            {data.zones.map((z) => (
              <li key={z.name} className="panel p-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm">{z.name}</span>
                  <span className="font-mono text-[10px] text-neon">{z.score}/10</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {z.cost} · <span className="text-foreground">Best for:</span> {z.best_for}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        to="/app/calculator"
        className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-mono uppercase tracking-widest text-[11px] hover:scale-[1.02] transition-transform"
      >
        💼 Calculate my setup cost for {name}
      </Link>
    </div>
  );
}
