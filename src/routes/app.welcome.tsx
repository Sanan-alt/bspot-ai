import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { track } from "@/lib/telemetry";

export const Route = createFileRoute("/app/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome — BSpot AI" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: WelcomePage,
});

const EXPERIENCE = [
  { id: "beginner", label: "Low — I'm just starting out", desc: "New to investing or moving abroad." },
  { id: "intermediate", label: "Medium — I've done some of this before", desc: "You've invested or run a business locally." },
  { id: "advanced", label: "High — I'm experienced", desc: "You've dealt with international investing or business." },
];

const SECTORS = [
  "Technology", "Real Estate", "E-commerce", "Finance", "Energy",
  "Manufacturing", "Healthcare", "Food & Retail", "Tourism", "Crypto & Web3",
  "Consulting", "Education",
];

const TIMELINES = [
  { id: "short_term", label: "Short-term (< 1 year)", desc: "Quick wins, active trading, near-term moves." },
  { id: "mid_term", label: "Mid-term (1–3 years)", desc: "Setting up a business, mid-horizon investing." },
  { id: "long_term", label: "Long-term (3+ years)", desc: "Wealth building, residency, retirement planning." },
];

function WelcomePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [experience, setExperience] = useState<string>("");
  const [sectors, setSectors] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { track("onboarding_started"); }, []);
  useEffect(() => { track("onboarding_step", { value: step }); }, [step]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/signin", search: { redirect: "/app/welcome" } });
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("experience_level,business_interests,timeline,onboarded_at")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.onboarded_at) {
        navigate({ to: "/app" });
        return;
      }
      if (data?.experience_level) setExperience(data.experience_level);
      if (data?.business_interests) setSectors(data.business_interests);
      if (data?.timeline) setTimeline(data.timeline);
    })();
  }, [user?.id, loading]);

  const toggleSector = (s: string) =>
    setSectors((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        experience_level: experience || null,
        business_interests: sectors.length ? sectors : null,
        timeline: timeline || null,
        onboarded_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome aboard!");
    track("onboarding_finished", { metadata: { experience, sectors: sectors.length, timeline } });
    navigate({ to: "/app" });
  };

  const skip = async () => {
    if (!user) return;
    track("onboarding_skipped", { value: step });
    await supabase
      .from("profiles")
      .update({ onboarded_at: new Date().toISOString() })
      .eq("id", user.id);
    navigate({ to: "/app" });
  };

  const canNext1 = !!experience;
  const canNext2 = sectors.length > 0;
  const canFinish = !!timeline;

  return (
    <div className="min-h-screen p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl panel-neon p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3 w-3 text-neon" /> Setup · {step} / 3
          </div>
          <button onClick={skip} className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-neon">
            Skip for now
          </button>
        </div>

        <div className="flex gap-1 mb-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className={`h-1 flex-1 rounded ${n <= step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>

        {step === 1 && (
          <>
            <h1 className="font-display text-2xl mb-1">What's your experience level?</h1>
            <p className="text-sm text-muted-foreground mb-5">We'll tailor advice, dossiers, and AI answers to match.</p>
            <div className="space-y-2">
              {EXPERIENCE.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setExperience(e.id)}
                  className={`w-full text-left p-4 rounded-md border transition ${experience === e.id ? "border-primary bg-primary/10 text-neon" : "border-border hover:border-primary/50"}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{e.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{e.desc}</div>
                    </div>
                    {experience === e.id && <Check className="h-4 w-4 text-neon" />}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="font-display text-2xl mb-1">Which sectors interest you?</h1>
            <p className="text-sm text-muted-foreground mb-5">Pick as many as you like. You can change these later.</p>
            <div className="flex flex-wrap gap-2">
              {SECTORS.map((s) => {
                const on = sectors.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleSector(s)}
                    className={`px-3 py-2 rounded-md border font-mono text-xs transition ${on ? "border-primary bg-primary/10 text-neon" : "border-border hover:border-primary/50"}`}
                  >
                    {on && <Check className="inline h-3 w-3 mr-1" />}
                    {s}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="font-display text-2xl mb-1">What's your investment horizon?</h1>
            <p className="text-sm text-muted-foreground mb-5">Helps the AI recommend strategies that match your goals.</p>
            <div className="space-y-2">
              {TIMELINES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeline(t.id)}
                  className={`w-full text-left p-4 rounded-md border transition ${timeline === t.id ? "border-primary bg-primary/10 text-neon" : "border-border hover:border-primary/50"}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{t.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
                    </div>
                    {timeline === t.id && <Check className="h-4 w-4 text-neon" />}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="px-4 py-2 rounded-md border border-border font-mono text-[10px] uppercase tracking-widest disabled:opacity-40 hover:border-primary hover:text-neon"
          >
            Back
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={(step === 1 && !canNext1) || (step === 2 && !canNext2)}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-widest glow-sm inline-flex items-center gap-2 disabled:opacity-40"
            >
              Next <ArrowRight className="h-3 w-3" />
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={!canFinish || saving}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-widest glow-sm inline-flex items-center gap-2 disabled:opacity-40"
            >
              {saving ? "Saving..." : "Finish"} <Check className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
