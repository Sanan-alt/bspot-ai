import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Passport, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { VISA_PROGRAMS } from "@/lib/visa-programs";

export const Route = createFileRoute("/app/visa")({ component: VisaGuide });

const COUNTRY_LABELS: Record<string, string> = {
  AE: "UAE 🇦🇪",
  GB: "United Kingdom 🇬🇧",
  CA: "Canada 🇨🇦",
  SG: "Singapore 🇸🇬",
  US: "USA 🇺🇸",
  DE: "Germany 🇩🇪",
  AU: "Australia 🇦🇺",
  PT: "Portugal 🇵🇹",
  ES: "Spain 🇪🇸",
  CH: "Switzerland 🇨🇭",
  NL: "Netherlands 🇳🇱",
  FR: "France 🇫🇷",
};

function VisaGuide() {
  const codes = Object.keys(VISA_PROGRAMS);
  const [selected, setSelected] = useState(codes[0]);
  const programs = VISA_PROGRAMS[selected] ?? [];

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <ChevronRight className="h-6 w-6 text-neon" />
        <div>
          <h1 className="font-display text-3xl">Visa & Residency Guide</h1>
          <p className="text-sm text-muted-foreground">Investor, founder, and residency routes for the world's top business destinations.</p>
        </div>
      </header>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {programs.map((p) => (
          <div key={p.name} className="border border-border rounded-lg p-5 hover:border-primary/60 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-lg leading-tight">{p.name}</h3>
              <span className="font-mono text-[10px] uppercase tracking-widest text-neon shrink-0">{p.category}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{p.summary}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Min. investment</dt>
                <dd className="font-medium">{p.minInvestment}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Duration</dt>
                <dd className="font-medium">{p.duration}</dd>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                {p.pathToPR ? (
                  <><CheckCircle2 className="h-4 w-4 text-neon" /><span className="text-sm">Path to permanent residency</span></>
                ) : (
                  <><XCircle className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">No direct PR path</span></>
                )}
              </div>
            </dl>
          </div>
        ))}
        {programs.length === 0 && (
          <p className="text-muted-foreground text-sm">No programs catalogued for this country yet.</p>
        )}
      </div>
    </div>
  );
}
