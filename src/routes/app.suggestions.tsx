import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Sparkles, Lightbulb, TrendingUp, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { suggestBusinesses, type Suggestion } from "@/lib/suggestions.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/app/suggestions")({ component: SuggestionsPage });

function SuggestionsPage() {
  const [budget, setBudget] = useState("10000");
  const [country, setCountry] = useState("");
  const [sector, setSector] = useState("");
  const [risk, setRisk] = useState<"low" | "medium" | "high">("medium");
  const [horizon, setHorizon] = useState("5");
  const fn = useServerFn(suggestBusinesses);

  const m = useMutation<Suggestion[], Error>({
    mutationFn: async () => {
      const { spendCredits } = await import("@/lib/credits");
      const ok = await spendCredits(5, "ai_suggestions", "Generate business suggestions");
      if (!ok) throw new Error("Insufficient credits");
      return fn({ data: {
        budget_usd: Math.max(100, parseFloat(budget) || 0),
        country: country || undefined,
        sector: sector || undefined,
        risk,
        horizon_years: Math.max(1, parseInt(horizon) || 5),
      }});
    },
    onError: (e) => { if (e.message !== "Insufficient credits") toast.error(e.message); },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// BUSINESS SUGGESTIONS</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">AI Investment Ideas</h1>
        <p className="text-sm text-muted-foreground mt-1">Tell the AI your constraints. Get tailored opportunities.</p>
      </div>

      <div className="panel-neon p-6 grid gap-4 md:grid-cols-5">
        <div className="space-y-2">
          <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Budget (USD)</Label>
          <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} className="font-mono" />
        </div>
        <div className="space-y-2">
          <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Country (optional)</Label>
          <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Vietnam" />
        </div>
        <div className="space-y-2">
          <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Sector (optional)</Label>
          <Input value={sector} onChange={(e) => setSector(e.target.value)} placeholder="e.g. Renewable energy" />
        </div>
        <div className="space-y-2">
          <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Risk</Label>
          <Select value={risk} onValueChange={(v) => setRisk(v as typeof risk)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Horizon (years)</Label>
          <Input type="number" value={horizon} onChange={(e) => setHorizon(e.target.value)} className="font-mono" />
        </div>
        <div className="md:col-span-5 flex justify-end">
          <Button onClick={() => m.mutate()} disabled={m.isPending} className="gap-2">
            {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate Ideas
          </Button>
        </div>
      </div>

      {m.isPending && (
        <div className="terminal p-10 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-neon" />
          <p className="mt-3 font-mono text-xs">// Querying Lovable AI gateway…</p>
        </div>
      )}

      {m.data && (
        <div className="grid gap-4 md:grid-cols-2">
          {m.data.map((s, i) => <SuggestionCard key={i} s={s} />)}
        </div>
      )}

      {!m.data && !m.isPending && (
        <div className="panel p-10 text-center scanline">
          <Lightbulb className="h-10 w-10 text-neon mx-auto" />
          <p className="mt-4 font-display text-xl">Awaiting input</p>
          <p className="mt-2 text-sm text-muted-foreground">Set your constraints above and hit Generate.</p>
        </div>
      )}
    </div>
  );
}

function SuggestionCard({ s }: { s: Suggestion }) {
  const riskColor = s.risk_level === "low" ? "text-success" : s.risk_level === "high" ? "text-destructive" : "text-warning";
  return (
    <div className="panel-neon p-5 space-y-4 hover:glow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{s.type} · {s.country}</p>
          <h3 className="mt-1 font-display text-lg">{s.title}</h3>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl text-neon">{s.est_roi_pct}%</p>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">est. ROI</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{s.summary}</p>

      <div className="flex items-center gap-4 text-xs font-mono">
        <span className={`inline-flex items-center gap-1 ${riskColor}`}>
          <ShieldAlert className="h-3 w-3" /> {s.risk_level.toUpperCase()}
        </span>
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <TrendingUp className="h-3 w-3" /> ${s.capital_required_usd.toLocaleString()} req
        </span>
      </div>

      <div className="neon-divider" />

      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">// Steps</p>
        <ol className="space-y-1 text-sm">
          {s.steps.map((st, i) => (
            <li key={i} className="flex gap-2"><span className="text-neon font-mono">{i + 1}.</span><span>{st}</span></li>
          ))}
        </ol>
      </div>

      {s.risks?.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">// Risks</p>
          <ul className="space-y-1 text-sm">
            {s.risks.map((r, i) => (
              <li key={i} className="flex gap-2 text-muted-foreground"><span className="text-destructive">›</span><span>{r}</span></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
