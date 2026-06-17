import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Loader2, Search, Sparkles, TrendingUp, ShieldAlert, Activity, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { scoreCountry } from "@/lib/countries.functions";
import { COUNTRIES, COUNTRY_BY_CODE } from "@/lib/countries-data";
import { VISA_PROGRAMS } from "@/lib/visa-programs";
import { COUNTRY_DEEP } from "@/lib/country-deep";
import { WorldInvestmentMap } from "@/components/WorldInvestmentMap";
import { Plane, CheckCircle2, Mail, Clock } from "lucide-react";
import { getCountryLive } from "@/lib/country-live.functions";
import { SectorBenchmarks } from "@/components/SectorBenchmarks";

export const Route = createFileRoute("/app/countries")({ component: CountriesPage });

// Countries page selects with ISO alpha-2 codes. COUNTRY_DEEP is keyed by alpha-3.
const ALPHA2_TO_ALPHA3: Record<string, string> = {
  AE: "ARE", GB: "GBR", CA: "CAN", SG: "SGP", SA: "SAU",
  DE: "DEU", US: "USA", TR: "TUR", PT: "PRT", AU: "AUS",
};

type Score = {
  overall: number; stability: number; growth: number; risk: number;
  currency: string; summary: string;
  opportunities: string[]; risks: string[]; top_sectors: string[];
  _cached?: boolean; _age_hours?: number;
};

function CountriesPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<string>("All");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const score = useServerFn(scoreCountry);
  const qc = useQueryClient();
  const selected = selectedCode ? COUNTRY_BY_CODE[selectedCode] : null;
  const deepKey = selected ? ALPHA2_TO_ALPHA3[selected.code] : null;
  const deep = deepKey ? COUNTRY_DEEP[deepKey] : null;

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
    queryFn: async () => await score({ data: { code: selected!.code, name: selected!.name } }),
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
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// {t("countries.kicker")}</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">{t("countries.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("countries.subtitle")}</p>
      </div>

      <div className="panel-neon p-3">
        <WorldInvestmentMap selectedCode={selectedCode} onSelect={setSelectedCode} />
      </div>

      <div className="panel-neon p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("countries.search_placeholder")} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1">
          {regions.map(r => (
            <button key={r}
              onClick={() => setRegion(r)}
              className={`px-3 h-8 rounded-md text-xs font-mono uppercase tracking-widest border ${
                region === r ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-neon"
              }`}>{r === "All" ? t("countries.region_all") : r}</button>
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
          <div className="col-span-full text-center text-sm text-muted-foreground py-10">{t("countries.no_matches")}</div>
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
                <LiveDataPanel code={selected.code} />
                <SectorBenchmarks code={selected.code} />
                {deep && <DeepProfile data={deep} name={selected.name} />}

                {isFetching && (
                  <div className="terminal p-6 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-neon" />
                    <p className="mt-2 text-xs">// {t("countries.scoring")}</p>
                  </div>
                )}
                {error && <div className="text-sm text-destructive">{(error as Error).message}</div>}

                {(() => {
                  const programs = VISA_PROGRAMS[selected.code] ?? [];
                  if (!programs.length) {
                    return (
                      <div className="panel p-4">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">// {t("countries.visa_title")}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("countries.visa_none", { name: selected.name })}{" "}
                          <a href="mailto:bspot.ai.official@gmail.com" className="text-neon">bspot.ai.official@gmail.com</a>.
                        </p>
                      </div>
                    );
                  }
                  return (
                    <div className="panel p-4">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                        <Plane className="h-3 w-3 text-neon" /> {t("countries.visa_title")}
                      </p>
                      <ul className="space-y-3">
                        {programs.map((p) => (
                          <li key={p.name} className="border-l-2 border-primary/40 pl-3">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-display text-sm">{p.name}</span>
                              {p.pathToPR && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-neon">
                                  <CheckCircle2 className="h-3 w-3" /> {t("countries.pr_badge")}
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
                        <Mail className="h-3 w-3" /> {t("countries.suggest")}
                      </a>
                    </div>
                  );
                })()}

                {data && (
                  <>
                    <div className="panel-neon p-5 text-center relative">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">// {t("countries.overall_score")}</p>
                      <p className="mt-2 font-display text-6xl text-neon">{data.overall}</p>
                      <p className="mt-1 text-xs text-muted-foreground">/ 100</p>
                      {data._cached && (
                        <button
                          onClick={refresh}
                          className="absolute top-3 right-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-neon flex items-center gap-1"
                          title={t("countries.refresh")}
                        >
                          <RefreshCw className="h-3 w-3" /> {t("countries.cached", { h: data._age_hours })}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <Metric icon={<Activity className="h-4 w-4" />} label={t("countries.stability")} value={data.stability} />
                      <Metric icon={<TrendingUp className="h-4 w-4" />} label={t("countries.growth")} value={data.growth} />
                      <Metric icon={<ShieldAlert className="h-4 w-4" />} label={t("countries.risk")} value={data.risk} />
                    </div>

                    <div className="panel p-4">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">// {t("countries.summary")}</p>
                      <p className="text-sm">{data.summary}</p>
                    </div>

                    <Section title={t("countries.opportunities")} items={data.opportunities} accent />
                    <Section title={t("countries.risks")} items={data.risks} />
                    <Section title={t("countries.top_sectors")} items={data.top_sectors} />

                    <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                      <Sparkles className="h-3 w-3 text-neon" /> {t("countries.powered_by")}
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

function LiveDataPanel({ code }: { code: string }) {
  const fn = useServerFn(getCountryLive);
  const { data } = useQuery({
    queryKey: ["country-live", code],
    queryFn: async () => await fn({ data: { country_code: code } }),
    staleTime: 60 * 60_000,
  });
  if (!data) return null;
  const age = Date.now() - new Date(data.fetched_at).getTime();
  const hours = Math.round(age / 3600000);
  const fresh = hours < 36;
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">// LIVE INDICATORS</p>
        <span className={`inline-flex items-center gap-1 text-[10px] font-mono ${fresh ? "text-emerald-400" : "text-amber-500"}`}>
          <Clock className="h-3 w-3" /> updated {hours}h ago
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="font-display text-lg text-neon">{data.fx_rate_usd?.toFixed(2) ?? "—"}</div>
          <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">USD/{data.currency_code}</div>
        </div>
        <div>
          <div className="font-display text-lg text-neon">{data.inflation_pct != null ? `${data.inflation_pct.toFixed(1)}%` : "—"}</div>
          <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">Inflation</div>
        </div>
        <div>
          <div className="font-display text-lg text-neon">{data.policy_rate_pct != null ? `${data.policy_rate_pct.toFixed(2)}%` : "—"}</div>
          <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">Policy rate</div>
        </div>
      </div>
      {data.source && <div className="mt-2 text-[10px] font-mono text-muted-foreground text-center">Source: {data.source}</div>}
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
  const { t } = useTranslation();
  const [tab, setTab] = useState<"overview" | "visa" | "laws" | "zones">("overview");
  const tabs: { id: typeof tab; label: string }[] = [
    { id: "overview", label: t("deep.tab_overview") },
    { id: "visa", label: t("deep.tab_visa") },
    { id: "laws", label: t("deep.tab_laws") },
    ...(data.zones ? [{ id: "zones" as const, label: t("deep.tab_zones") }] : []),
  ];

  const overviewRows: [string, string][] = [
    [`💰 ${t("deep.setup_cost")}`, data.setup_cost_range],
    [`🇵🇰 ${t("deep.in_pkr")}`, data.setup_cost_pkr],
    [`⏱ ${t("deep.setup_time")}`, data.setup_time],
    [`🏢 ${t("deep.corp_tax")}`, data.corporate_tax],
    [`👤 ${t("deep.income_tax")}`, data.personal_income_tax],
    [`🧾 ${t("deep.vat")}`, data.vat],
    [`🌍 ${t("deep.foreign_own")}`, data.foreign_ownership],
    [`🏛 ${t("deep.stability")}`, data.political_stability],
    [`📊 ${t("deep.ease_rank")}`, data.ease_of_business_rank],
    [`👥 ${t("deep.best_for")}`, data.recommended_for],
  ];

  return (
    <div className="panel-neon p-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">// {t("deep.title")}</p>
        <div className="text-right">
          <div className="font-display text-2xl text-neon">{data.bspot_score}</div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{t("map.score")}</div>
        </div>
      </div>

      <div className="mt-3 flex border-b border-border">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`flex-1 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
              tab === tb.id ? "text-neon border-b-2 border-primary" : "text-muted-foreground hover:text-neon"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {tab === "overview" && (
          <>
            {overviewRows.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[140px_1fr] gap-2 text-xs">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
                <div>{value}</div>
              </div>
            ))}
            {data.pro_tip && (
              <div className="mt-4 panel p-3 border-l-2 border-primary">
                <p className="font-mono text-[10px] uppercase tracking-widest text-neon">⭐ {t("deep.pro_tip")}</p>
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
                <p className="text-xs text-muted-foreground mt-1">{t("deep.min_investment")}: {v.min_investment}</p>
              </li>
            ))}
          </ul>
        )}

        {tab === "laws" && (
          <div className="space-y-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">// {t("deep.laws_heading")}</p>
              <p className="text-xs mt-1 leading-relaxed">{data.laws_for_foreigners}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">// {t("deep.banking_heading")}</p>
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
                  {z.cost} · <span className="text-foreground">{t("deep.best_for")}:</span> {z.best_for}
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
        💼 {t("deep.calculate_for", { name })}
      </Link>
    </div>
  );
}
