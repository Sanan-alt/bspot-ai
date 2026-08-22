import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BellPlus, CalendarClock, CheckCircle2, Circle, Loader2, Plus, RotateCcw, Trash2, Info, Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { COUNTRIES } from "@/lib/countries-data";
import { ROADMAP_TEMPLATE } from "@/lib/roadmap-template";
import { formatDate } from "@/lib/i18n-format";
import { track } from "@/lib/telemetry";

export const Route = createFileRoute("/app/roadmap")({
  head: () => ({
    meta: [
      { title: "Roadmap & Reminders — BSpot AI" },
      { name: "description", content: "Track every step of your relocation and company-setup journey, with reminders." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RoadmapPage,
});

type Step = {
  id: string;
  target_country: string | null;
  business_type: string | null;
  step_index: number;
  phase: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  notes: string | null;
};

type Reminder = {
  id: string;
  title: string;
  description: string | null;
  remind_at: string | null;
  active: boolean;
  created_at: string;
};

const PHASES = ["Research", "Setup", "Launch", "Scale"] as const;
const BUSINESS_TYPES = ["ecommerce", "consulting", "trading", "tech startup", "real estate", "other"];

function RoadmapPage() {
  const { user } = useAuth();
  const [steps, setSteps] = useState<Step[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [country, setCountry] = useState("AE");
  const [biz, setBiz] = useState("ecommerce");
  const [noteFor, setNoteFor] = useState<Step | null>(null);
  const [noteText, setNoteText] = useState("");
  const [remOpen, setRemOpen] = useState(false);
  const [remForm, setRemForm] = useState({ title: "", description: "", remind_at: "" });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: s }, { data: r }] = await Promise.all([
      supabase.from("roadmap_steps").select("*").eq("user_id", user.id).order("step_index", { ascending: true }),
      supabase.from("reminders").select("*").eq("user_id", user.id).order("remind_at", { ascending: true, nullsFirst: false }),
    ]);
    setSteps((s ?? []) as Step[]);
    setReminders((r ?? []) as Reminder[]);
    setLoading(false);
    track("roadmap_loaded", { metadata: { steps: s?.length ?? 0, reminders: r?.length ?? 0 } });
  };

  useEffect(() => {
    load();
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("target_country").eq("id", user.id).maybeSingle();
      if (data?.target_country) setCountry(data.target_country);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const generate = async () => {
    if (!user) return;
    setGenerating(true);
    const today = new Date();
    const rows = ROADMAP_TEMPLATE.map((t) => {
      const due = new Date(today);
      due.setDate(due.getDate() + t.due_days);
      return {
        user_id: user.id,
        target_country: country,
        business_type: biz,
        step_index: t.step_index,
        phase: t.phase,
        title: t.title,
        description: t.description,
        status: "pending",
        due_date: due.toISOString().slice(0, 10),
      };
    });
    // Replace any existing plan so indexes stay unique and dates stay realistic.
    await supabase.from("roadmap_steps").delete().eq("user_id", user.id);
    const { error } = await supabase.from("roadmap_steps").insert(rows);
    setGenerating(false);
    if (error) return toast.error(error.message);
    toast.success(`Roadmap created — ${rows.length} steps for ${country}`);
    track("roadmap_generated", { metadata: { country, biz } });
    load();
  };

  const setStatus = async (step: Step, status: string) => {
    const patch: Record<string, any> = {
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
    };
    setSteps((prev) => prev.map((s) => (s.id === step.id ? { ...s, ...(patch as object) } as Step : s)));
    const { error } = await supabase.from("roadmap_steps").update(patch).eq("id", step.id);
    if (error) { toast.error(error.message); load(); }
  };

  const saveNote = async () => {
    if (!noteFor) return;
    const { error } = await supabase.from("roadmap_steps").update({ notes: noteText }).eq("id", noteFor.id);
    if (error) return toast.error(error.message);
    setNoteFor(null);
    toast.success("Note saved");
    load();
  };

  const remindForStep = async (step: Step) => {
    if (!user) return;
    const { error } = await supabase.from("reminders").insert({
      user_id: user.id,
      title: step.title,
      description: `Roadmap step ${step.step_index} · ${step.phase}`,
      remind_at: step.due_date ? new Date(step.due_date).toISOString() : null,
      active: true,
    });
    if (error) return toast.error(error.message);
    toast.success("Reminder added");
    load();
  };

  const addReminder = async () => {
    if (!user || !remForm.title.trim()) return;
    const { error } = await supabase.from("reminders").insert({
      user_id: user.id,
      title: remForm.title.trim(),
      description: remForm.description.trim() || null,
      remind_at: remForm.remind_at ? new Date(remForm.remind_at).toISOString() : null,
      active: true,
    });
    if (error) return toast.error(error.message);
    setRemOpen(false);
    setRemForm({ title: "", description: "", remind_at: "" });
    toast.success("Reminder added");
    load();
  };

  const toggleReminder = async (r: Reminder) => {
    const { error } = await supabase.from("reminders").update({ active: !r.active }).eq("id", r.id);
    if (error) return toast.error(error.message);
    load();
  };

  const deleteReminder = async (r: Reminder) => {
    const { error } = await supabase.from("reminders").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    load();
  };

  const done = steps.filter((s) => s.status === "done").length;
  const pct = steps.length ? Math.round((done / steps.length) * 100) : 0;
  const byPhase = useMemo(
    () => PHASES.map((p) => ({ phase: p, items: steps.filter((s) => s.phase === p) })).filter((g) => g.items.length),
    [steps],
  );

  if (loading) {
    return <div className="flex items-center gap-2 text-muted-foreground py-16"><Loader2 className="h-4 w-4 animate-spin" /> Loading roadmap…</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// ROADMAP</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Your relocation &amp; setup plan</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            A step-by-step plan from research to scale — company structure, bank account, visa, launch. Tick steps off
            as you go and turn any step into a reminder. Free to use, no credits.
          </p>
        </div>
        {steps.length > 0 && (
          <div className="panel p-4 min-w-[220px]">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">// Progress</div>
            <div className="font-display text-3xl text-neon">{pct}%</div>
            <Progress value={pct} className="mt-2" />
            <div className="text-xs text-muted-foreground mt-1">{done} of {steps.length} steps complete</div>
          </div>
        )}
      </div>

      <div className="panel p-5 flex flex-col md:flex-row gap-4 md:items-end">
        <div className="flex-1">
          <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Target country</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72">
              {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Business type</Label>
          <Select value={biz} onValueChange={setBiz}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {BUSINESS_TYPES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={generate} disabled={generating} className="shrink-0">
          {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : steps.length ? <RotateCcw className="h-4 w-4 mr-2" /> : <Rocket className="h-4 w-4 mr-2" />}
          {steps.length ? "Regenerate plan" : "Build my roadmap"}
        </Button>
      </div>

      {steps.length === 0 ? (
        <div className="panel p-10 text-center">
          <Rocket className="h-8 w-8 mx-auto text-neon mb-3" />
          <h2 className="font-display text-xl">No roadmap yet</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Pick a target country and business type above, then generate a 15-step plan with realistic due dates.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {byPhase.map(({ phase, items }) => (
            <div key={phase} className="space-y-3">
              <h2 className="font-display text-xl flex items-center gap-2">
                {phase}
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {items.filter((i) => i.status === "done").length}/{items.length}
                </span>
              </h2>
              <div className="space-y-2">
                {items.map((s) => {
                  const isDone = s.status === "done";
                  const overdue = !isDone && s.due_date && new Date(s.due_date) < new Date();
                  return (
                    <div key={s.id} className={`panel p-4 flex items-start gap-3 ${isDone ? "opacity-60" : ""}`}>
                      <button
                        onClick={() => setStatus(s, isDone ? "pending" : "done")}
                        aria-label={isDone ? "Mark step as pending" : "Mark step as done"}
                        className="mt-0.5 shrink-0"
                      >
                        {isDone ? <CheckCircle2 className="h-5 w-5 text-neon" /> : <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className={`font-medium ${isDone ? "line-through" : ""}`}>
                          <span className="font-mono text-xs text-muted-foreground mr-2">{String(s.step_index).padStart(2, "0")}</span>
                          {s.title}
                        </div>
                        {s.description && <p className="text-sm text-muted-foreground mt-0.5">{s.description}</p>}
                        {s.notes && <p className="text-xs mt-1 rounded border border-border p-2 bg-muted/30">{s.notes}</p>}
                        <div className="flex flex-wrap items-center gap-3 mt-2 font-mono text-[10px] uppercase tracking-widest">
                          {s.due_date && (
                            <span className={overdue ? "text-destructive" : "text-muted-foreground"}>
                              <CalendarClock className="h-3 w-3 inline mr-1" />
                              due {formatDate(new Date(s.due_date))}{overdue ? " · overdue" : ""}
                            </span>
                          )}
                          <button className="text-muted-foreground hover:text-neon" onClick={() => { setNoteFor(s); setNoteText(s.notes ?? ""); }}>
                            <Info className="h-3 w-3 inline mr-1" /> note
                          </button>
                          <button className="text-muted-foreground hover:text-neon" onClick={() => remindForStep(s)}>
                            <BellPlus className="h-3 w-3 inline mr-1" /> remind me
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reminders */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl">Reminders</h2>
            <p className="text-sm text-muted-foreground">Personal to-dos and deadlines — visa filings, bank appointments, renewals.</p>
          </div>
          <Dialog open={remOpen} onOpenChange={setRemOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Plus className="h-4 w-4 mr-2" /> Add reminder</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New reminder</DialogTitle>
                <DialogDescription>Give it a title and an optional date so it sorts by urgency.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Title</Label>
                  <Input value={remForm.title} onChange={(e) => setRemForm({ ...remForm, title: e.target.value })} placeholder="Submit investor visa medical" />
                </div>
                <div>
                  <Label>Details (optional)</Label>
                  <Textarea value={remForm.description} onChange={(e) => setRemForm({ ...remForm, description: e.target.value })} />
                </div>
                <div>
                  <Label>Remind me on (optional)</Label>
                  <Input type="date" value={remForm.remind_at} onChange={(e) => setRemForm({ ...remForm, remind_at: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={addReminder} disabled={!remForm.title.trim()}>Save reminder</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {reminders.length === 0 ? (
          <div className="panel p-6 text-sm text-muted-foreground">No reminders yet. Add one, or hit "remind me" on any roadmap step.</div>
        ) : (
          <div className="space-y-2">
            {reminders.map((r) => (
              <div key={r.id} className={`panel p-4 flex items-start gap-3 ${r.active ? "" : "opacity-60"}`}>
                <button onClick={() => toggleReminder(r)} className="mt-0.5 shrink-0" aria-label={r.active ? "Mark done" : "Reactivate"}>
                  {r.active ? <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" /> : <CheckCircle2 className="h-5 w-5 text-neon" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className={`font-medium ${r.active ? "" : "line-through"}`}>{r.title}</div>
                  {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                  {r.remind_at && (
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                      <CalendarClock className="h-3 w-3 inline mr-1" /> {formatDate(new Date(r.remind_at))}
                    </div>
                  )}
                </div>
                <button onClick={() => deleteReminder(r)} className="text-muted-foreground hover:text-destructive" aria-label="Delete reminder">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!noteFor} onOpenChange={(o) => !o && setNoteFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Note</DialogTitle>
            <DialogDescription>{noteFor?.title}</DialogDescription>
          </DialogHeader>
          <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={5} placeholder="Contacts, quotes, document numbers…" />
          <DialogFooter>
            <Button onClick={saveNote}>Save note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
