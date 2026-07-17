import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2, TrendingUp, TrendingDown, Loader2, Sparkles, Pencil, FileDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { COUNTRIES } from "@/lib/countries-data";
import { optimizePortfolio } from "@/lib/portfolio.functions";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, Legend, LineChart, Line, CartesianGrid } from "recharts";
import { formatCurrency, formatDate, formatPercent } from "@/lib/i18n-format";
import { track } from "@/lib/telemetry";

export const Route = createFileRoute("/app/portfolio")({ component: PortfolioPage });

type Investment = {
  id: string;
  name: string;
  country: string | null;
  currency: string;
  initial_amount: number;
  current_value: number;
  notes: string | null;
  created_at: string;
};

const empty = { name: "", country: "", currency: "USD", initial_amount: "", current_value: "", notes: "" };

function PortfolioPage() {
  const optimizeFn = useServerFn(optimizePortfolio);
  const { user } = useAuth();
  const [items, setItems] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [form, setForm] = useState(empty);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d" | "1y" | "all">("30d");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const t0 = performance.now();
    const { data, error } = await supabase
      .from("investments").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as Investment[]);
    setLoading(false);
    track("portfolio_loaded", { value: Math.round(performance.now() - t0), metadata: { count: data?.length ?? 0 } });
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const totals = useMemo(() => {
    const invested = items.reduce((s, i) => s + Number(i.initial_amount), 0);
    const current = items.reduce((s, i) => s + Number(i.current_value), 0);
    const pl = current - invested;
    const pct = invested ? (pl / invested) * 100 : 0;
    return { invested, current, pl, pct };
  }, [items]);

  const byCountry = useMemo(() => {
    const map: Record<string, number> = {};
    for (const it of items) {
      const key = it.country || "Unspecified";
      map[key] = (map[key] || 0) + Number(it.current_value);
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [items]);

  const timeframeDays = { "7d": 7, "30d": 30, "90d": 90, "1y": 365, all: Infinity }[timeframe];

  const filteredByTime = useMemo(() => {
    if (timeframeDays === Infinity) return items;
    const cutoff = Date.now() - timeframeDays * 86_400_000;
    return items.filter(i => new Date(i.created_at).getTime() >= cutoff);
  }, [items, timeframeDays]);

  const perAsset = useMemo(
    () => filteredByTime.map(i => ({
      name: i.name.slice(0, 12),
      pl: Number(i.current_value) - Number(i.initial_amount),
      invested: Number(i.initial_amount),
      current: Number(i.current_value),
    })),
    [filteredByTime]
  );

  // Cumulative P/L history built from investment creation dates within the window.
  const plHistory = useMemo(() => {
    const sorted = [...filteredByTime].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    let cum = 0;
    return sorted.map(i => {
      cum += Number(i.current_value) - Number(i.initial_amount);
      return { date: formatDate(i.created_at, { month: "short", day: "numeric" }), pl: Number(cum.toFixed(2)) };
    });
  }, [filteredByTime]);

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (it: Investment) => {
    setEditing(it);
    setForm({
      name: it.name, country: it.country ?? "", currency: it.currency,
      initial_amount: String(it.initial_amount), current_value: String(it.current_value),
      notes: it.notes ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!user) return;
    if (!form.name || !form.initial_amount || !form.current_value) {
      toast.error("Name, initial amount, and current value are required");
      return;
    }
    const payload = {
      user_id: user.id,
      name: form.name,
      country: form.country || null,
      currency: form.currency,
      initial_amount: Number(form.initial_amount),
      current_value: Number(form.current_value),
      notes: form.notes || null,
    };
    const q = editing
      ? supabase.from("investments").update(payload).eq("id", editing.id)
      : supabase.from("investments").insert(payload);
    const { error } = await q;
    if (error) return toast.error(error.message);
    toast.success(editing ? "Investment updated" : "Investment added");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("investments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    load();
  };

  const optimize = async () => {
    if (items.length === 0) return toast.error("Add some investments first");
    setAiLoading(true);
    setAiAdvice(null);
    try {
      const summary = items.map(i =>
        `${i.name} (${i.country || "n/a"}, ${i.currency}): invested ${i.initial_amount}, now ${i.current_value}`
      ).join("\n");
      const { advice } = await optimizeFn({ data: { summary } });
      setAiAdvice(advice);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAiLoading(false);
    }
  };

  const exportCsv = () => {
    const header = ["Name", "Country", "Currency", "Invested", "Current", "P/L", "Return %", "Created"];
    const rows = filteredByTime.map(i => {
      const pl = Number(i.current_value) - Number(i.initial_amount);
      const pct = Number(i.initial_amount) ? (pl / Number(i.initial_amount)) * 100 : 0;
      return [i.name, i.country ?? "", i.currency, i.initial_amount, i.current_value, pl.toFixed(2), pct.toFixed(2), i.created_at];
    });
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `bspot-portfolio-${timeframe}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    track("portfolio_export", { metadata: { format: "csv", timeframe, rows: rows.length } });
  };

  const exportPdf = async () => {
    const [{ default: jsPDF }, autoTableMod] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const autoTable = (autoTableMod as { default: (doc: unknown, opts: unknown) => void }).default;
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("BSpot AI — Portfolio Report", 14, 18);
    doc.setFontSize(10); doc.setTextColor(120);
    doc.text(`Timeframe: ${timeframe.toUpperCase()}   ·   Generated: ${new Date().toLocaleString()}`, 14, 25);
    doc.setTextColor(0);
    doc.text(`Invested: ${formatCurrency(totals.invested)}    Current: ${formatCurrency(totals.current)}    P/L: ${formatCurrency(totals.pl)} (${formatPercent(totals.pct)})`, 14, 33);
    autoTable(doc, {
      startY: 40,
      head: [["Name", "Country", "CCY", "Invested", "Current", "P/L", "Return %"]],
      body: filteredByTime.map(i => {
        const pl = Number(i.current_value) - Number(i.initial_amount);
        const pct = Number(i.initial_amount) ? (pl / Number(i.initial_amount)) * 100 : 0;
        return [i.name, i.country ?? "-", i.currency, formatCurrency(Number(i.initial_amount), i.currency), formatCurrency(Number(i.current_value), i.currency), formatCurrency(pl, i.currency), `${pct.toFixed(2)}%`];
      }),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 30, 30] },
    });
    doc.save(`bspot-portfolio-${timeframe}-${new Date().toISOString().slice(0,10)}.pdf`);
    track("portfolio_export", { metadata: { format: "pdf", timeframe, rows: filteredByTime.length } });
  };

  const COLORS = ["oklch(0.88 0.19 95)", "oklch(0.68 0.18 50)", "oklch(0.65 0.18 200)", "oklch(0.65 0.18 320)", "oklch(0.70 0.15 150)", "oklch(0.60 0.15 30)"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// PORTFOLIO</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Portfolio Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">Track every investment, watch your P/L move in real time.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={exportCsv} disabled={items.length === 0} title="Export current timeframe as CSV">
            <FileDown className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" onClick={exportPdf} disabled={items.length === 0} title="Export current timeframe as PDF">
            <FileText className="h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" onClick={optimize} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            AI Review (15 cr)
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button onClick={openCreate}><Plus className="h-4 w-4" /> Add</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Edit investment" : "Add investment"}</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Apple stock" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Country</Label>
                    <Select value={form.country} onValueChange={v => setForm({ ...form, country: v })}>
                      <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Currency</Label><Input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value.toUpperCase() })} maxLength={6} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Initial amount</Label><Input type="number" value={form.initial_amount} onChange={e => setForm({ ...form, initial_amount: e.target.value })} /></div>
                  <div><Label>Current value</Label><Input type="number" value={form.current_value} onChange={e => setForm({ ...form, current_value: e.target.value })} /></div>
                </div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              </div>
              <DialogFooter><Button onClick={save}>{editing ? "Save" : "Add"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Invested" value={formatCurrency(totals.invested)} />
        <Stat label="Current" value={formatCurrency(totals.current)} />
        <Stat label="P/L" value={`${totals.pl >= 0 ? "+" : ""}${formatCurrency(totals.pl)}`} accent={totals.pl >= 0 ? "up" : "down"} />
        <Stat label="Return" value={formatPercent(totals.pct)} accent={totals.pct >= 0 ? "up" : "down"} />
      </div>

      {aiAdvice && (
        <div className="panel-neon p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neon mb-2">// AI Advice</p>
          <pre className="whitespace-pre-wrap text-sm font-sans">{aiAdvice}</pre>
        </div>
      )}

      {items.length > 0 && (
        <>
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="panel p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">// Allocation by Country</p>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={byCountry} dataKey="value" nameKey="name" outerRadius={80} label>
                    {byCountry.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "oklch(0.12 0.005 95)", border: "1px solid oklch(0.25 0.01 95)" }}
                    formatter={(v: number, name) => [formatCurrency(v), name as string]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="panel p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">// P/L per Asset</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={perAsset}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.01 95)" />
                  <XAxis dataKey="name" stroke="oklch(0.55 0.01 95)" fontSize={10} />
                  <YAxis stroke="oklch(0.55 0.01 95)" fontSize={10} tickFormatter={(v) => formatCurrency(v, "USD", { notation: "compact", maximumFractionDigits: 1 })} />
                  <Tooltip
                    contentStyle={{ background: "oklch(0.12 0.005 95)", border: "1px solid oklch(0.25 0.01 95)" }}
                    formatter={(v: number, key) => [formatCurrency(v), key === "pl" ? "P/L" : (key as string)]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} formatter={() => "P/L per asset"} />
                  <Bar dataKey="pl" fill="oklch(0.88 0.19 95)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">// Cumulative P/L over time</p>
              <div className="flex gap-1">
                {(["7d", "30d", "90d", "1y", "all"] as const).map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`text-[10px] font-mono px-2 py-1 rounded border ${timeframe === tf ? "border-neon text-neon" : "border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    {tf.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            {plHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No investments in the selected window.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={plHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.01 95)" />
                  <XAxis dataKey="date" stroke="oklch(0.55 0.01 95)" fontSize={10} />
                  <YAxis stroke="oklch(0.55 0.01 95)" fontSize={10} tickFormatter={(v) => formatCurrency(v, "USD", { notation: "compact", maximumFractionDigits: 1 })} />
                  <Tooltip
                    contentStyle={{ background: "oklch(0.12 0.005 95)", border: "1px solid oklch(0.25 0.01 95)" }}
                    formatter={(v: number) => [formatCurrency(v), "Cumulative P/L"]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} formatter={() => "Cumulative P/L"} />
                  <Line type="monotone" dataKey="pl" stroke="oklch(0.88 0.19 95)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}

      <div className="panel p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-neon" /></div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No investments yet. Click <span className="text-neon">Add</span> to start.</div>
        ) : (
          <div className="divide-y divide-border">
            {items.map(it => {
              const pl = Number(it.current_value) - Number(it.initial_amount);
              const pct = Number(it.initial_amount) ? (pl / Number(it.initial_amount)) * 100 : 0;
              return (
                <div key={it.id} className="p-4 flex items-center gap-4 hover:bg-accent/30">
                  <div className="flex-1 min-w-0">
                    <div className="font-display">{it.name}</div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {it.country ?? "—"} · {it.currency} · {formatDate(it.created_at)}
                    </div>
                    {it.notes && <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{it.notes}</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-display text-sm">{formatCurrency(Number(it.current_value), it.currency)}</div>
                    <div className={`text-xs flex items-center justify-end gap-1 ${pl >= 0 ? "text-neon" : "text-destructive"}`}>
                      {pl >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {formatPercent(pct)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(it)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "up" | "down" }) {
  return (
    <div className="panel p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-2xl ${accent === "up" ? "text-neon" : accent === "down" ? "text-destructive" : ""}`}>{value}</p>
    </div>
  );
}
