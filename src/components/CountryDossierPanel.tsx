import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2, X, Building2, Plane, Vote, Sparkles, RefreshCw, MapPin,
  TrendingUp, ShieldAlert, CheckCircle2, AlertTriangle, Globe2,
  Landmark, Users, LineChart, Shield, Wrench,
} from "lucide-react";

import { COUNTRY_BY_CODE } from "@/lib/countries-data";
import { COUNTRY_DEEP } from "@/lib/country-deep";
import { VISA_PROGRAMS } from "@/lib/visa-programs";
import { getHubCities, type HubCity } from "@/lib/hub-cities";
import { getCountryDossier, getCityDossier, type Dossier } from "@/lib/dossier.functions";
import { toast } from "sonner";

const ALPHA2_TO_ALPHA3: Record<string, string> = {
  AE: "ARE", GB: "GBR", CA: "CAN", SG: "SGP", SA: "SAU",
  DE: "DEU", US: "USA", TR: "TUR", PT: "PRT", AU: "AUS",
};

type Tab = "overview" | "regions" | "visa" | "dossier";

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value * 10));
  const color = value >= 8 ? "bg-emerald-500" : value >= 6 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold">{value.toFixed(1)}/10</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DossierView({ dossier }: { dossier: Dossier }) {
  return (
    <div className="space-y-5">
      <div className="panel p-4">
        <p className="font-display text-base leading-snug">{dossier.headline}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <ScoreBar label="Overall" value={dossier.overall_score} />
          <ScoreBar label="Political stability" value={dossier.political_stability} />
          <ScoreBar label="Investment climate" value={dossier.investment_climate} />
          <ScoreBar label="Business-friendly" value={dossier.business_friendliness} />
        </div>
      </div>

      <section>
        <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
          <Vote className="h-3 w-3" /> Latest political events
        </h4>
        <ul className="space-y-2">
          {dossier.latest_political_events.map((ev, i) => (
            <li key={i} className="panel p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug">{ev.title}</p>
                <span className="font-mono text-[10px] text-muted-foreground shrink-0">{ev.date_hint}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{ev.impact}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel p-4">
        <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          Politics → Investment
        </h4>
        <p className="text-sm">{dossier.politics_to_investment}</p>
      </section>

      <section className="panel p-4">
        <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
          Tax landscape
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground text-xs">Corporate</span><p className="font-mono font-semibold">{dossier.taxes.corporate_pct}</p></div>
          <div><span className="text-muted-foreground text-xs">Personal</span><p className="font-mono font-semibold">{dossier.taxes.personal_pct}</p></div>
          <div><span className="text-muted-foreground text-xs">Capital gains</span><p className="font-mono font-semibold">{dossier.taxes.capital_gains_pct}</p></div>
          <div><span className="text-muted-foreground text-xs">VAT / Sales</span><p className="font-mono font-semibold">{dossier.taxes.vat_pct}</p></div>
        </div>
        {dossier.taxes.notes && <p className="text-xs text-muted-foreground mt-3">{dossier.taxes.notes}</p>}
      </section>

      <section className="panel p-4">
        <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3" /> Profit & loss reality
        </h4>
        <p className="text-sm">{dossier.profit_margins}</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <section className="panel p-4">
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Opportunities
          </h4>
          <ul className="space-y-1.5 text-sm">
            {dossier.opportunities.map((o, i) => <li key={i} className="flex gap-2"><span className="text-emerald-500">+</span>{o}</li>)}
          </ul>
        </section>
        <section className="panel p-4">
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-amber-500" /> Risks
          </h4>
          <ul className="space-y-1.5 text-sm">
            {dossier.risks.map((r, i) => <li key={i} className="flex gap-2"><span className="text-amber-500">!</span>{r}</li>)}
          </ul>
        </section>
      </div>

      <section className="panel p-4">
        <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
          <Globe2 className="h-3 w-3" /> Role in world politics & stability
        </h4>
        <p className="text-sm">{dossier.world_role}</p>
        <p className="text-xs text-muted-foreground mt-2">{dossier.geopolitical_role}</p>
      </section>

      <section className="panel-neon p-4">
        <h4 className="font-mono text-[10px] uppercase tracking-widest text-neon mb-2">Bottom line</h4>
        <p className="text-sm font-medium leading-relaxed">{dossier.bottom_line}</p>
      </section>
    </div>
  );
}

export function CountryDossierPanel({
  countryCode,
  onClose,
}: {
  countryCode: string;
  onClose: () => void;
}) {
  const country = COUNTRY_BY_CODE[countryCode];
  const deep = COUNTRY_DEEP[ALPHA2_TO_ALPHA3[countryCode] ?? ""];
  const regions = getHubCities(countryCode);
  const visa = VISA_PROGRAMS[countryCode] ?? [];

  const [tab, setTab] = useState<Tab>("overview");
  const [selectedCity, setSelectedCity] = useState<HubCity | null>(null);

  const countryFn = useServerFn(getCountryDossier);
  const cityFn = useServerFn(getCityDossier);

  const countryQ = useQuery<Dossier>({
    queryKey: ["dossier", "country", countryCode],
    queryFn: () => countryFn({ data: { country_code: countryCode, country_name: country?.name ?? countryCode } }),
    enabled: tab === "dossier" && !selectedCity && !!country,
    staleTime: 1000 * 60 * 60 * 6,
    retry: false,
  });

  const cityQ = useQuery<Dossier>({
    queryKey: ["dossier", "city", countryCode, selectedCity?.name],
    queryFn: () => cityFn({ data: {
      country_code: countryCode,
      country_name: country?.name ?? countryCode,
      city_name: selectedCity!.name,
    }}),
    enabled: tab === "dossier" && !!selectedCity,
    staleTime: 1000 * 60 * 60 * 6,
    retry: false,
  });

  const activeQ = selectedCity ? cityQ : countryQ;

  if (!country) return null;

  return (
    <div className="panel-neon p-0 overflow-hidden">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/60">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl">{country.flag}</span>
          <div className="min-w-0">
            <h2 className="font-display text-lg leading-tight truncate">
              {selectedCity ? `${selectedCity.name}, ${country.name}` : country.name}
            </h2>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {country.region} · {country.code}
              {selectedCity && (
                <button
                  onClick={() => setSelectedCity(null)}
                  className="ml-2 text-neon hover:underline"
                >
                  ← back to country
                </button>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="p-1.5 rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <nav className="flex border-b border-border bg-background/40 px-2 overflow-x-auto">
        {([
          ["overview", "Overview", Building2],
          ["regions", "States & Cities", MapPin],
          ["visa", "Visa Guide", Plane],
          ["dossier", selectedCity ? "City Dossier" : "Country Dossier", Sparkles],
        ] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-mono uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
              tab === id
                ? "border-primary text-neon"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3 w-3" /> {label}
          </button>
        ))}
      </nav>

      <div className="p-4 max-h-[70vh] overflow-y-auto">
        {tab === "overview" && (
          <div className="space-y-4">
            {deep ? (
              <>
                <div className="panel p-4">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-3xl text-neon">{deep.bspot_score}</span>
                    <span className="text-xs text-muted-foreground">BSpot Score / 10</span>
                  </div>
                  <p className="text-sm mt-2 text-muted-foreground">{deep.recommended_for}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="panel p-3"><span className="text-xs text-muted-foreground">Corporate tax</span><p className="font-mono">{deep.corporate_tax}</p></div>
                  <div className="panel p-3"><span className="text-xs text-muted-foreground">Personal tax</span><p className="font-mono">{deep.personal_income_tax}</p></div>
                  <div className="panel p-3"><span className="text-xs text-muted-foreground">VAT</span><p className="font-mono">{deep.vat}</p></div>
                  <div className="panel p-3"><span className="text-xs text-muted-foreground">Foreign ownership</span><p className="font-mono">{deep.foreign_ownership}</p></div>
                  <div className="panel p-3 col-span-2"><span className="text-xs text-muted-foreground">Political stability</span><p className="font-mono">{deep.political_stability}</p></div>
                  <div className="panel p-3 col-span-2"><span className="text-xs text-muted-foreground">Setup</span><p className="font-mono">{deep.setup_cost_range} · {deep.setup_time}</p></div>
                </div>
              </>
            ) : (
              <div className="panel p-4 text-sm text-muted-foreground">
                Basic profile only — open the <button onClick={() => setTab("dossier")} className="text-neon hover:underline">Country Dossier</button> tab for a full AI-generated political & investment briefing.
              </div>
            )}
          </div>
        )}

        {tab === "regions" && (
          <div className="space-y-4">
            {regions ? (
              <>
                <section>
                  <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">States / Provinces</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {regions.states.map((s) => (
                      <span key={s} className="px-2.5 py-1 rounded-md border border-border text-xs">{s}</span>
                    ))}
                  </div>
                </section>
                <section>
                  <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Building2 className="h-3 w-3" /> Business-hub cities — click for dossier
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {regions.cities.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => { setSelectedCity(c); setTab("dossier"); }}
                        className="panel p-3 text-left hover:border-primary transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-display text-base">{c.name}</p>
                          {c.state && <span className="font-mono text-[10px] text-muted-foreground">{c.state}</span>}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {c.tags.map((t) => (
                            <span key={t} className="font-mono text-[9px] uppercase tracking-widest text-neon">{t}</span>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">{c.why}</p>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No detailed states/cities catalogued for this country yet — try the dossier tab.</p>
            )}
          </div>
        )}

        {tab === "visa" && (
          <div className="space-y-3">
            {visa.length === 0 ? (
              <p className="text-sm text-muted-foreground">No visa programs catalogued for this country yet.</p>
            ) : visa.map((p) => (
              <div key={p.name} className="panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-base leading-tight">{p.name}</h3>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-neon shrink-0">{p.category}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1.5">{p.summary}</p>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Min. investment</dt>
                    <dd className="font-medium">{p.minInvestment}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Duration</dt>
                    <dd className="font-medium">{p.duration}</dd>
                  </div>
                  <div className="col-span-2 flex items-center gap-2 text-xs">
                    {p.pathToPR
                      ? <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />Path to permanent residency</>
                      : <><ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">No direct PR path</span></>}
                  </div>
                </dl>
              </div>
            ))}
          </div>
        )}

        {tab === "dossier" && (
          <div className="space-y-4">
            {activeQ.isLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-neon" />
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Generating {selectedCity ? `${selectedCity.name}` : country.name} dossier… (5 credits)
                </p>
              </div>
            )}
            {activeQ.isError && (
              <div className="panel p-4 text-sm">
                <p className="text-rose-500 font-medium">Could not generate dossier.</p>
                <p className="text-xs text-muted-foreground mt-1">{(activeQ.error as Error)?.message}</p>
                <button
                  onClick={() => activeQ.refetch()}
                  className="mt-3 px-3 h-8 rounded-md border border-border text-xs font-mono hover:bg-accent inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="h-3 w-3" /> Retry
                </button>
              </div>
            )}
            {activeQ.data && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    AI-generated dossier · {selectedCity ? "City" : "Country"}
                  </p>
                  <button
                    onClick={() => {
                      toast.info("Refreshing dossier (5 credits)");
                      activeQ.refetch();
                    }}
                    className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-neon inline-flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" /> Refresh
                  </button>
                </div>
                <DossierView dossier={activeQ.data} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
