import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Loader2, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { AuthShell } from "./signup";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

const HOME_COUNTRIES = [
  { code: "PK", label: "Pakistan 🇵🇰" },
  { code: "IN", label: "India 🇮🇳" },
  { code: "BD", label: "Bangladesh 🇧🇩" },
  { code: "EG", label: "Egypt 🇪🇬" },
  { code: "NG", label: "Nigeria 🇳🇬" },
  { code: "OTHER", label: "Other" },
];
const TARGET_COUNTRIES = [
  { code: "AE", label: "UAE 🇦🇪 — Dubai/Abu Dhabi" },
  { code: "GB", label: "United Kingdom 🇬🇧" },
  { code: "CA", label: "Canada 🇨🇦" },
  { code: "SG", label: "Singapore 🇸🇬" },
  { code: "US", label: "USA 🇺🇸" },
  { code: "OTHER", label: "Not sure yet" },
];
const BUDGETS = [
  { v: 10000, label: "< $10K" },
  { v: 50000, label: "$10K – $50K" },
  { v: 150000, label: "$50K – $150K" },
  { v: 500000, label: "$150K – $500K" },
  { v: 1000000, label: "$500K+" },
];
const INTERESTS = ["E-commerce", "Restaurants/F&B", "Real estate", "Tech/SaaS", "Trading/Import-Export", "Services", "Manufacturing", "Crypto/Fintech"];
const EXPERIENCE = ["First-time entrepreneur", "Run a business locally", "Already invest abroad", "Just exploring"];
const TIMELINES = ["Within 3 months", "3–6 months", "6–12 months", "12+ months / researching"];

function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [home, setHome] = useState("");
  const [target, setTarget] = useState("");
  const [budget, setBudget] = useState<number | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [exp, setExp] = useState("");
  const [timeline, setTimeline] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/signin" });
  }, [loading, user, navigate]);

  const total = 5;

  function toggleInterest(i: string) {
    setInterests((curr) => (curr.includes(i) ? curr.filter((x) => x !== i) : [...curr, i]));
  }

  async function finish() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        home_country: home,
        target_country: target,
        investment_budget_usd: budget,
        business_interests: interests,
        experience_level: exp,
        timeline,
        onboarded_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved — entering grid");
    navigate({ to: "/app" });
  }

  const canNext =
    (step === 1 && !!home) ||
    (step === 2 && !!target) ||
    (step === 3 && budget !== null) ||
    (step === 4 && interests.length > 0) ||
    (step === 5 && !!exp && !!timeline);

  return (
    <AuthShell title="Set up your profile" subtitle={`Step ${step} of ${total}`}>
      <div className="mb-6 flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={`h-1 flex-1 rounded ${i < step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      {step === 1 && (
        <Group label="Where are you based?">
          {HOME_COUNTRIES.map((c) => (
            <Choice key={c.code} active={home === c.code} onClick={() => setHome(c.code)}>{c.label}</Choice>
          ))}
        </Group>
      )}
      {step === 2 && (
        <Group label="Where do you want to invest or start a business?">
          {TARGET_COUNTRIES.map((c) => (
            <Choice key={c.code} active={target === c.code} onClick={() => setTarget(c.code)}>{c.label}</Choice>
          ))}
        </Group>
      )}
      {step === 3 && (
        <Group label="Investment budget (USD)?">
          {BUDGETS.map((b) => (
            <Choice key={b.v} active={budget === b.v} onClick={() => setBudget(b.v)}>{b.label}</Choice>
          ))}
        </Group>
      )}
      {step === 4 && (
        <Group label="Business interests (pick any)">
          {INTERESTS.map((i) => (
            <Choice key={i} active={interests.includes(i)} onClick={() => toggleInterest(i)}>
              <span className="flex items-center justify-between w-full">{i}{interests.includes(i) && <Check className="h-4 w-4" />}</span>
            </Choice>
          ))}
        </Group>
      )}
      {step === 5 && (
        <div className="space-y-6">
          <Group label="Your experience">
            {EXPERIENCE.map((e) => (
              <Choice key={e} active={exp === e} onClick={() => setExp(e)}>{e}</Choice>
            ))}
          </Group>
          <Group label="Timeline">
            {TIMELINES.map((t) => (
              <Choice key={t} active={timeline === t} onClick={() => setTimeline(t)}>{t}</Choice>
            ))}
          </Group>
        </div>
      )}

      <div className="mt-6 flex justify-between gap-3">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-md font-mono text-xs uppercase tracking-widest disabled:opacity-30"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        {step < total ? (
          <button
            disabled={!canNext}
            onClick={() => setStep((s) => s + 1)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-mono text-xs uppercase tracking-widest disabled:opacity-40"
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            disabled={!canNext || saving}
            onClick={finish}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-mono text-xs uppercase tracking-widest disabled:opacity-40"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Finish
          </button>
        )}
      </div>

      <button
        onClick={() => navigate({ to: "/app" })}
        className="mt-4 w-full text-center text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        Skip for now
      </button>
    </AuthShell>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">{label}</p>
      <div className="grid grid-cols-1 gap-2">{children}</div>
    </div>
  );
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left px-4 py-3 rounded-md border transition-colors text-sm ${
        active ? "border-primary bg-primary/10 text-foreground" : "border-border hover:border-primary/60"
      }`}
    >
      {children}
    </button>
  );
}
