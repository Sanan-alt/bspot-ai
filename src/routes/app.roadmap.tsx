import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Loader2, Map, CheckCircle2, Circle, PlayCircle, RefreshCw, Trash2 } from "lucide-react";
import { ROADMAP_TEMPLATE } from "@/lib/roadmap-template";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/app/roadmap")({ component: Roadmap });

type Step = {
  id: string;
  step_index: number;
  phase: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "done" | "skipped";
  due_date: string | null;
  target_country: string | null;
  business_type: string | null;
};

function Roadmap() {
  const { user } = useAuth();
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [profile, setProfile] = useState<{ target_country: string | null; business_interests: string[] | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  async function load() {
    if (!user) return;
    setLoading(true);
    const [{ data: stepsData }, { data: prof }] = await Promise.all([
      supabase.from("roadmap_steps").select("*").eq("user_id", user.id).order("step_index"),
      supabase.from("profiles").select("target_country, business_interests").eq("id", user.id).maybeSingle(),
    ]);
    setSteps((stepsData as Step[]) ?? []);
    setProfile(prof as any);
    setLoading(false);
  }

  async function generate() {
    if (!user) return;
    setGenerating(true);
    const today = new Date();
    const rows = ROADMAP_TEMPLATE.map((s) => {
      const due = new Date(today);
      due.setDate(due.getDate() + s.due_days);
      return {
        user_id: user.id,
        step_index: s.step_index,
        phase: s.phase,
        title: s.title,
        description: s.description,
        status: "pending" as const,
        due_date: due.toISOString().slice(0, 10),
        target_country: profile?.target_country ?? null,
        business_type: (profile?.business_interests?.[0] as string) ?? null,
      };
    });
    // wipe existing first
    await supabase.from("roadmap_steps").delete().eq("user_id", user.id);
    const { error } = await supabase.from("roadmap_steps").insert(rows);
    setGenerating(false);
    if (error) return toast.error(error.message);
    toast.success("Roadmap generated");
    load();
  }

  async function updateStatus(id: string, status: Step["status"]) {
    const { error } = await supabase
      .from("roadmap_steps")
      .update({ status, completed_at: status === "done" ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) return toast.error(error.message);
    setSteps((s) => s.map((x) => (x.id === id ? { ...x, status } : x)));
  }

  async function clearAll() {
    if (!user) return;
    if (!confirm("Delete the entire roadmap?")) return;
    await supabase.from("roadmap_steps").delete().eq("user_id", user.id);
    setSteps([]);
  }

  const done = steps.filter((s) => s.status === "done").length;
  const pct = steps.length ? Math.round((done / steps.length) * 100) : 0;
  const byPhase = steps.reduce<Record<string, Step[]>>((acc, s) => {
    (acc[s.phase] ||= []).push(s);
    return acc;
  }, {});

  if (loading) {
    return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-neon" /></div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Map className="h-6 w-6 text-neon" />
          <div>
            <h1 className="font-display text-3xl">Your Journey Roadmap</h1>
            <p className="text-sm text-muted-foreground">A step-by-step plan from research to launch and beyond.</p>
          </div>
        </div>
        <div className="flex gap-2">
          {steps.length > 0 && (
            <button onClick={clearAll} className="inline-flex items-center gap-2 border border-border px-3 py-2 rounded-md text-xs font-mono uppercase tracking-widest text-destructive hover:bg-destructive/10">
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </button>
          )}
          <button
            onClick={generate}
            disabled={generating}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-md text-xs font-mono uppercase tracking-widest disabled:opacity-50"
          >
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {steps.length ? "Regenerate" : "Generate roadmap"}
          </button>
        </div>
      </header>

      {steps.length > 0 && (
        <div className="border border-border rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Overall progress</span>
            <span className="font-mono">{done} / {steps.length} · {pct}%</span>
          </div>
          <Progress value={pct} />
        </div>
      )}

      {steps.length === 0 && (
        <div className="border border-dashed border-border rounded-lg p-10 text-center">
          <p className="text-muted-foreground">No roadmap yet. Generate one to get a 15-step plan tailored to your profile.</p>
        </div>
      )}

      {Object.entries(byPhase).map(([phase, items]) => (
        <section key={phase} className="space-y-2">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-neon">// {phase}</h2>
          <div className="space-y-2">
            {items.map((s) => (
              <StepCard key={s.id} step={s} onChange={(st) => updateStatus(s.id, st)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function StepCard({ step, onChange }: { step: Step; onChange: (s: Step["status"]) => void }) {
  const Icon = step.status === "done" ? CheckCircle2 : step.status === "in_progress" ? PlayCircle : Circle;
  const color = step.status === "done" ? "text-neon" : step.status === "in_progress" ? "text-yellow-400" : "text-muted-foreground";
  return (
    <div className="border border-border rounded-lg p-4 hover:border-primary/40 transition-colors">
      <div className="flex gap-3">
        <button
          onClick={() => onChange(step.status === "done" ? "pending" : step.status === "pending" ? "in_progress" : "done")}
          className="shrink-0 mt-0.5"
        >
          <Icon className={`h-5 w-5 ${color}`} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <h3 className={`font-medium ${step.status === "done" ? "line-through text-muted-foreground" : ""}`}>
              {step.step_index}. {step.title}
            </h3>
            {step.due_date && (
              <span className="font-mono text-[10px] text-muted-foreground">due {step.due_date}</span>
            )}
          </div>
          {step.description && <p className="text-sm text-muted-foreground mt-1">{step.description}</p>}
        </div>
      </div>
    </div>
  );
}
