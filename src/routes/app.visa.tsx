import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plane, CheckCircle2, XCircle, Search, Clock, Users, ExternalLink, ListChecks, FileCheck2, Info } from "lucide-react";
import { VISA_PROGRAMS, type VisaProgram } from "@/lib/visa-programs";

export const Route = createFileRoute("/app/visa")({
  component: VisaGuide,
  head: () => ({
    meta: [
      { title: "Visa & Residency Guide — BSpot AI" },
      { name: "description", content: "Investor, founder, golden, and digital-nomad visa programs across 20+ countries — investment thresholds, timelines, and official links." },
      { property: "og:title", content: "Visa & Residency Guide — BSpot AI" },
      { property: "og:description", content: "Compare investor, startup, golden, and digital-nomad visas across 20+ countries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const COUNTRY_LABELS: Record<string, string> = {
  AE: "UAE 🇦🇪", GB: "United Kingdom 🇬🇧", CA: "Canada 🇨🇦", SG: "Singapore 🇸🇬",
  US: "USA 🇺🇸", DE: "Germany 🇩🇪", AU: "Australia 🇦🇺", PT: "Portugal 🇵🇹",
  ES: "Spain 🇪🇸", CH: "Switzerland 🇨🇭", NL: "Netherlands 🇳🇱", FR: "France 🇫🇷",
  GR: "Greece 🇬🇷", MT: "Malta 🇲🇹", IE: "Ireland 🇮🇪", EE: "Estonia 🇪🇪",
  TR: "Türkiye 🇹🇷", MX: "Mexico 🇲🇽", TH: "Thailand 🇹🇭", JP: "Japan 🇯🇵",
};

const CATEGORIES = [
  "All", "Entrepreneur Visa", "Startup Visa", "Investor Visa",
  "Golden Visa", "Residency by Investment", "Work Permit", "Digital Nomad", "Citizenship",
] as const;

function VisaGuide() {
  const codes = Object.keys(VISA_PROGRAMS);
  const [selected, setSelected] = useState(codes[0]);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [query, setQuery] = useState("");

  const programs = useMemo<VisaProgram[]>(() => {
    const list = VISA_PROGRAMS[selected] ?? [];
    return list.filter((p) => {
      const catOk = category === "All" || p.category === category;
      const q = query.trim().toLowerCase();
      const qOk = !q || p.name.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [selected, category, query]);

  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <Plane className="h-6 w-6 text-neon mt-1" />
        <div>
          <h1 className="font-display text-3xl">Visa & Residency Guide</h1>
          <p className="text-sm text-muted-foreground">
            Investor, founder, golden, digital-nomad, and citizenship programs across {codes.length} countries.
            Every entry links to the official government source — always verify before you file.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-start">
        <div className="flex flex-wrap gap-2">
          {codes.map((c) => (
            <button
              key={c}
              onClick={() => setSelected(c)}
              className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
                selected === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:border-primary/60"
              }`}
            >
              {COUNTRY_LABELS[c] ?? c}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search programs…"
            className="w-full pl-8 pr-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-2.5 py-1 rounded-full border font-mono text-[10px] uppercase tracking-widest transition-colors ${
              category === c
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/60 hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {programs.map((p) => (
          <article key={p.name} className="border border-border rounded-lg p-5 hover:border-primary/60 transition-colors flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-lg leading-tight">{p.name}</h3>
              <span className="font-mono text-[10px] uppercase tracking-widest text-neon shrink-0">{p.category}</span>
            </div>
            <p className="text-sm text-muted-foreground">{p.summary}</p>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Min. investment</dt>
                <dd className="font-medium">{p.minInvestment}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Duration</dt>
                <dd className="font-medium">{p.duration}</dd>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{p.processingTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{p.familyIncluded ? "Family included" : "Applicant only"}</span>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                {p.pathToPR ? (
                  <><CheckCircle2 className="h-4 w-4 text-neon" /><span className="text-sm">Path to permanent residency</span></>
                ) : (
                  <><XCircle className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">No direct PR path</span></>
                )}
              </div>
            </dl>

            {p.requirements.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">
                  <FileCheck2 className="h-3 w-3" /> Key requirements
                </div>
                <ul className="text-sm space-y-1 list-disc pl-5">
                  {p.requirements.map((r) => <li key={r}>{r}</li>)}
                </ul>
              </div>
            )}

            {p.steps.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">
                  <ListChecks className="h-3 w-3" /> Application steps
                </div>
                <ol className="text-sm space-y-1 list-decimal pl-5">
                  {p.steps.map((s) => <li key={s}>{s}</li>)}
                </ol>
              </div>
            )}

            <a
              href={p.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex items-center gap-1.5 text-sm text-neon hover:underline"
            >
              Official source <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </article>
        ))}
        {programs.length === 0 && (
          <div className="col-span-full border border-dashed border-border rounded-lg p-6 flex items-start gap-3 text-sm text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 text-neon shrink-0" />
            <div>
              No programs match this filter for {COUNTRY_LABELS[selected] ?? selected}. Try clearing the search or switching category.
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground border-t border-border pt-4">
        Informational only. Immigration rules change frequently — always confirm current requirements with the official source or a licensed immigration lawyer before you apply.
      </p>
    </div>
  );
}
