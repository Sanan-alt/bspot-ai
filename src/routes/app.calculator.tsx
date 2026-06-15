import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Calculator, TrendingUp } from "lucide-react";
import {
  BUSINESS_LABELS,
  COSTS,
  COUNTRY_META,
  computeTotal,
  type BusinessType,
  type CostCountry,
} from "@/lib/cost-data";

export const Route = createFileRoute("/app/calculator")({ component: CostCalculator });

const HOME_CURRENCIES: { code: string; label: string; usd: number }[] = [
  { code: "USD", label: "USD 🇺🇸", usd: 1 },
  { code: "PKR", label: "PKR 🇵🇰", usd: 280 },
  { code: "INR", label: "INR 🇮🇳", usd: 83.5 },
  { code: "BDT", label: "BDT 🇧🇩", usd: 117 },
  { code: "EGP", label: "EGP 🇪🇬", usd: 49 },
  { code: "NGN", label: "NGN 🇳🇬", usd: 1550 },
];

function fmt(n: number, code: string) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n) + " " + code;
}

function CostCalculator() {
  const [biz, setBiz] = useState<BusinessType>("ecommerce");
  const [country, setCountry] = useState<CostCountry>("AE");
  const [home, setHome] = useState(HOME_CURRENCIES[1]);

  const breakdown = COSTS[biz][country];
  const totalUsd = useMemo(() => computeTotal(breakdown), [breakdown]);
  const meta = COUNTRY_META[country];

  const lines: { key: string; label: string; usd: number }[] = [
    { key: "license", label: "Trade license / registration", usd: breakdown.license },
    { key: "visa", label: "Investor / founder visa", usd: breakdown.visa },
    { key: "office", label: "Office (12 months)", usd: breakdown.office },
    { key: "staff", label: "Minimum staffing (12 months)", usd: breakdown.staff },
    { key: "inventory", label: "Inventory / equipment", usd: breakdown.inventory },
    { key: "marketing", label: "Marketing (12 months)", usd: breakdown.marketing },
    { key: "legal", label: "Legal / accounting", usd: breakdown.legal },
    { key: "bank_deposit", label: "Min. bank balance / deposit", usd: breakdown.bank_deposit },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Calculator className="h-6 w-6 text-neon" />
        <div>
          <h1 className="font-display text-3xl">Cost Calculator</h1>
          <p className="text-sm text-muted-foreground">First-year estimate to start a business abroad — in your local currency.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Field label="Business type">
          <select
            value={biz}
            onChange={(e) => setBiz(e.target.value as BusinessType)}
            className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm"
          >
            {Object.entries(BUSINESS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Target country">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value as CostCountry)}
            className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm"
          >
            {Object.entries(COUNTRY_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Show me in">
          <select
            value={home.code}
            onChange={(e) => setHome(HOME_CURRENCIES.find((c) => c.code === e.target.value)!)}
            className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm"
          >
            {HOME_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="border border-primary/40 bg-primary/5 rounded-lg p-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Estimated total — first year</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <span className="font-display text-4xl text-neon">{fmt(totalUsd, "USD")}</span>
          <span className="text-2xl text-foreground/80">≈ {fmt(totalUsd * meta.usdRate, meta.currency)}</span>
          {home.code !== "USD" && (
            <span className="text-lg text-muted-foreground">≈ {fmt(totalUsd * home.usd, home.code)}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-3">{meta.notes}</p>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">Line item</th>
              <th className="text-right px-4 py-3">USD</th>
              <th className="text-right px-4 py-3">{meta.currency}</th>
              <th className="text-right px-4 py-3">{home.code}</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.key} className="border-t border-border">
                <td className="px-4 py-2">{l.label}</td>
                <td className="px-4 py-2 text-right font-mono">{fmt(l.usd, "")}</td>
                <td className="px-4 py-2 text-right font-mono text-muted-foreground">{fmt(l.usd * meta.usdRate, "")}</td>
                <td className="px-4 py-2 text-right font-mono text-muted-foreground">{fmt(l.usd * home.usd, "")}</td>
              </tr>
            ))}
            <tr className="border-t border-border bg-muted/20">
              <td className="px-4 py-2 italic text-muted-foreground">+ 10% contingency buffer</td>
              <td colSpan={3}></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="border border-border rounded-lg p-4 flex gap-3 items-start">
        <TrendingUp className="h-5 w-5 text-neon shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <strong className="text-foreground">Next action:</strong> Ask the AI Assistant <em>"Build me a 12-month launch plan for a {BUSINESS_LABELS[biz].toLowerCase()} in {meta.label.split(" ")[0]} with a ${totalUsd.toLocaleString()} budget."</em>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">{label}</span>
      {children}
    </label>
  );
}
