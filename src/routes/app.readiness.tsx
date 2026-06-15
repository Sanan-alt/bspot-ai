import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Gauge, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/app/readiness")({ component: Readiness });

type Question = {
  id: string;
  text: string;
  weight: number;
  options: { label: string; value: number }[]; // value 0-1
};

const QUESTIONS: Question[] = [
  {
    id: "funds",
    text: "Do you have liquid capital ready to deploy?",
    weight: 25,
    options: [
      { label: "Yes, full amount in the bank", value: 1 },
      { label: "About half, raising the rest", value: 0.6 },
      { label: "Less than a quarter", value: 0.25 },
      { label: "Not yet — still saving", value: 0 },
    ],
  },
  {
    id: "docs",
    text: "Are your KYC documents (passport, bank statements, tax returns) ready?",
    weight: 15,
    options: [
      { label: "All scanned and organized", value: 1 },
      { label: "Most ready, some missing", value: 0.6 },
      { label: "Need to start gathering", value: 0.2 },
    ],
  },
  {
    id: "business_plan",
    text: "How clear is your business plan?",
    weight: 15,
    options: [
      { label: "Written plan + financial projections", value: 1 },
      { label: "Idea is clear, no document yet", value: 0.5 },
      { label: "Still exploring options", value: 0.15 },
    ],
  },
  {
    id: "experience",
    text: "Have you run a business before?",
    weight: 10,
    options: [
      { label: "Yes, currently operating", value: 1 },
      { label: "Previously owned one", value: 0.7 },
      { label: "Senior role at one", value: 0.5 },
      { label: "No prior experience", value: 0.2 },
    ],
  },
  {
    id: "country_research",
    text: "How well do you know your target country's rules?",
    weight: 10,
    options: [
      { label: "Spoken to lawyers/consultants there", value: 1 },
      { label: "Read official gov sites in detail", value: 0.7 },
      { label: "Casual research only", value: 0.3 },
      { label: "Haven't researched yet", value: 0 },
    ],
  },
  {
    id: "timeline",
    text: "Your target launch timeline?",
    weight: 10,
    options: [
      { label: "Within 3 months", value: 1 },
      { label: "3–6 months", value: 0.8 },
      { label: "6–12 months", value: 0.5 },
      { label: "12+ months", value: 0.3 },
    ],
  },
  {
    id: "support",
    text: "Do you have local contacts or partners in the target country?",
    weight: 10,
    options: [
      { label: "Yes, business partner on the ground", value: 1 },
      { label: "Friends/family, no business contacts", value: 0.5 },
      { label: "No contacts yet", value: 0 },
    ],
  },
  {
    id: "english",
    text: "Comfortable with business English / target country language?",
    weight: 5,
    options: [
      { label: "Fluent", value: 1 },
      { label: "Conversational", value: 0.6 },
      { label: "Basic", value: 0.3 },
    ],
  },
];

function band(score: number) {
  if (score >= 80) return { label: "Launch-ready", color: "text-neon", advice: "You can start your application this month. Generate your roadmap and book a consultation." };
  if (score >= 60) return { label: "Almost there", color: "text-yellow-400", advice: "Tighten the gaps below, then you're ready. 4–8 weeks of prep." };
  if (score >= 40) return { label: "Foundation stage", color: "text-orange-400", advice: "You have direction but need core pieces in place. Focus on funds and documentation first." };
  return { label: "Exploration stage", color: "text-muted-foreground", advice: "Spend time on research and the cost calculator before committing. That's totally fine." };
}

function Readiness() {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [savedScore, setSavedScore] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("readiness_score").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data?.readiness_score != null) setSavedScore(data.readiness_score);
    });
  }, [user]);

  const totalWeight = QUESTIONS.reduce((a, q) => a + q.weight, 0);
  const earned = QUESTIONS.reduce((a, q) => a + (answers[q.id] ?? 0) * q.weight, 0);
  const score = Math.round((earned / totalWeight) * 100);
  const answeredAll = QUESTIONS.every((q) => answers[q.id] !== undefined);
  const b = band(score);

  async function save() {
    if (!user || !answeredAll) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ readiness_score: score }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    setSavedScore(score);
    toast.success("Score saved to your profile");
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Gauge className="h-6 w-6 text-neon" />
        <div>
          <h1 className="font-display text-3xl">Readiness Score</h1>
          <p className="text-sm text-muted-foreground">
            8 quick questions to gauge how ready you are to invest abroad.
            {savedScore != null && <> Last saved: <span className="text-foreground font-mono">{savedScore}</span>.</>}
          </p>
        </div>
      </header>

      <div className="border border-primary/40 bg-primary/5 rounded-lg p-6">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Current score</p>
            <div className="flex items-baseline gap-3 mt-1">
              <span className={`font-display text-5xl ${b.color}`}>{answeredAll ? score : "—"}</span>
              <span className="text-muted-foreground">/ 100</span>
              {answeredAll && <span className={`font-mono text-xs uppercase tracking-widest ${b.color}`}>{b.label}</span>}
            </div>
          </div>
          <button
            onClick={save}
            disabled={!answeredAll || saving}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-xs font-mono uppercase tracking-widest disabled:opacity-40"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save to profile
          </button>
        </div>
        <Progress value={answeredAll ? score : 0} className="mt-4" />
        {answeredAll && <p className="text-sm text-muted-foreground mt-3">{b.advice}</p>}
      </div>

      <div className="space-y-4">
        {QUESTIONS.map((q, i) => (
          <div key={q.id} className="border border-border rounded-lg p-4">
            <div className="flex items-baseline justify-between gap-2 mb-3">
              <h3 className="font-medium">{i + 1}. {q.text}</h3>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{q.weight} pts</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options.map((o) => {
                const active = answers[q.id] === o.value;
                return (
                  <button
                    key={o.label}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: o.value }))}
                    className={`text-left text-sm px-3 py-2 rounded-md border transition-colors ${
                      active ? "border-primary bg-primary/10 text-foreground" : "border-border hover:border-primary/60"
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
