import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Loader2, Shield, Plus, Trash2, Save, Coins, Users, Gift, BarChart3, TrendingUp, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/use-credits";
import { useAuth } from "@/hooks/use-auth";
import { adminGrantCredits } from "@/lib/credits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin")({ component: AdminPage });

type Pack = { id: string; label: string; credits: number; price_pkr: number };
type FeatureCosts = Record<string, number>;
type UserRow = {
  id: string;
  display_name: string | null;
  balance: number;
  roles: string[];
};

function AdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOwner, loading: credLoading } = useCredits();

  useEffect(() => {
    if (!credLoading && !isOwner) {
      toast.error("Owner access only");
      navigate({ to: "/app" });
    }
  }, [credLoading, isOwner, navigate]);

  if (credLoading || !isOwner) {
    return (
      <div className="grid place-items-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-neon" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// OWNER CONSOLE</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl flex items-center gap-3">
          <Shield className="h-8 w-8 text-neon" /> Admin Panel
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure pricing, feature costs, and manage user credits. Changes apply instantly.
        </p>
      </motion.div>

      <AnalyticsOverview />
      <CreditPacksEditor />
      <FeatureCostsEditor />
      <UsersManager currentUserId={user?.id} />
    </div>
  );
}

/* ---------- CREDIT PACKS ---------- */
function CreditPacksEditor() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "credit_packs")
      .maybeSingle()
      .then(({ data }) => {
        setPacks((data?.value as Pack[]) ?? []);
        setLoading(false);
      });
  }, []);

  const update = (i: number, patch: Partial<Pack>) =>
    setPacks((p) => p.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  const remove = (i: number) => setPacks((p) => p.filter((_, idx) => idx !== i));
  const add = () =>
    setPacks((p) => [
      ...p,
      { id: `pack-${Date.now()}`, label: "New Pack", credits: 100, price_pkr: 299 },
    ]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .update({ value: packs })
      .eq("key", "credit_packs");
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Credit packs updated");
  };

  if (loading) return <SectionLoader />;

  return (
    <section className="panel p-6">
      <SectionHeader icon={Coins} title="Credit Packs" subtitle="Pricing shown on Buy Credits page" />
      <div className="space-y-3 mt-4">
        {packs.map((p, i) => (
          <div key={i} className="grid grid-cols-12 gap-3 panel p-3 items-end">
            <div className="col-span-12 md:col-span-3">
              <Label className="text-xs">Label</Label>
              <Input value={p.label} onChange={(e) => update(i, { label: e.target.value })} />
            </div>
            <div className="col-span-6 md:col-span-3">
              <Label className="text-xs">Credits</Label>
              <Input
                type="number"
                value={p.credits}
                onChange={(e) => update(i, { credits: Number(e.target.value) })}
              />
            </div>
            <div className="col-span-6 md:col-span-3">
              <Label className="text-xs">Price (PKR)</Label>
              <Input
                type="number"
                value={p.price_pkr}
                onChange={(e) => update(i, { price_pkr: Number(e.target.value) })}
              />
            </div>
            <div className="col-span-12 md:col-span-3 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => remove(i)} className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <Button onClick={add} variant="outline">
          <Plus className="h-4 w-4 mr-1" /> Add pack
        </Button>
        <Button onClick={save} disabled={saving} className="glow">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          Save changes
        </Button>
      </div>
    </section>
  );
}

/* ---------- FEATURE COSTS ---------- */
const FEATURE_LABELS: Record<string, string> = {
  map_view: "Map / Live Location",
  market_data: "Market & Economic Data",
  export_file: "Export PDF / Excel / CSV",
  ai_tool: "AI Chatbot / AI Tool",
  business_analytics: "Business Analytics",
  premium_report: "Premium Report",
};

function FeatureCostsEditor() {
  const [costs, setCosts] = useState<FeatureCosts>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "feature_costs")
      .maybeSingle()
      .then(({ data }) => {
        setCosts((data?.value as FeatureCosts) ?? {});
        setLoading(false);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .update({ value: costs })
      .eq("key", "feature_costs");
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Feature costs updated");
  };

  if (loading) return <SectionLoader />;

  return (
    <section className="panel p-6">
      <SectionHeader
        icon={Coins}
        title="Feature Credit Costs"
        subtitle="How many credits each feature consumes per use"
      />
      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        {Object.entries(costs).map(([key, val]) => (
          <div key={key} className="panel p-3 flex items-center justify-between gap-3">
            <Label className="text-sm">{FEATURE_LABELS[key] ?? key}</Label>
            <Input
              type="number"
              className="w-24"
              value={val}
              onChange={(e) => setCosts((c) => ({ ...c, [key]: Number(e.target.value) }))}
            />
          </div>
        ))}
      </div>
      <Button onClick={save} disabled={saving} className="mt-4 glow">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
        Save costs
      </Button>
    </section>
  );
}

/* ---------- USERS ---------- */
function UsersManager({ currentUserId }: { currentUserId?: string }) {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState<string | null>(null);
  const [amount, setAmount] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: credits }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, display_name"),
      supabase.from("credits").select("user_id, balance"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const balMap = new Map((credits ?? []).map((c) => [c.user_id, c.balance]));
    const roleMap = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const list = roleMap.get(r.user_id) ?? [];
      list.push(r.role);
      roleMap.set(r.user_id, list);
    }
    setRows(
      (profiles ?? []).map((p) => ({
        id: p.id,
        display_name: p.display_name,
        balance: balMap.get(p.id) ?? 0,
        roles: roleMap.get(p.id) ?? [],
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const grant = async (userId: string) => {
    const amt = Number(amount[userId]);
    if (!amt || amt <= 0) return toast.error("Enter a positive amount");
    setGranting(userId);
    try {
      await adminGrantCredits(userId, amt, "Owner grant");
      toast.success(`Granted ${amt} credits`);
      setAmount((a) => ({ ...a, [userId]: "" }));
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGranting(null);
    }
  };

  return (
    <section className="panel p-6">
      <SectionHeader icon={Users} title="Users" subtitle="Grant credits or review balances" />
      {loading ? (
        <SectionLoader />
      ) : (
        <div className="mt-4 space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="grid grid-cols-12 gap-3 panel p-3 items-center">
              <div className="col-span-12 md:col-span-5">
                <div className="font-medium text-sm truncate">{r.display_name ?? "Unnamed"}</div>
                <div className="font-mono text-[10px] text-muted-foreground truncate">{r.id}</div>
                <div className="flex gap-1 mt-1">
                  {r.roles.map((role) => (
                    <span
                      key={role}
                      className={`text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded ${
                        role === "owner"
                          ? "bg-primary text-primary-foreground"
                          : role === "admin"
                            ? "bg-neon/20 text-neon"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
              <div className="col-span-4 md:col-span-2 text-right">
                <div className="font-mono text-[10px] text-muted-foreground">balance</div>
                <div className="font-display text-lg text-neon">{r.balance.toLocaleString()}</div>
              </div>
              <div className="col-span-8 md:col-span-5 flex gap-2">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={amount[r.id] ?? ""}
                  onChange={(e) => setAmount((a) => ({ ...a, [r.id]: e.target.value }))}
                  disabled={r.id === currentUserId}
                />
                <Button
                  size="sm"
                  onClick={() => grant(r.id)}
                  disabled={granting === r.id || r.id === currentUserId}
                  className="shrink-0"
                >
                  {granting === r.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Gift className="h-4 w-4 mr-1" /> Grant
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------- Bits ---------- */
function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-10 w-10 rounded-md bg-primary/10 grid place-items-center">
        <Icon className="h-5 w-5 text-neon" />
      </div>
      <div>
        <h2 className="font-display text-xl">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function SectionLoader() {
  return (
    <div className="grid place-items-center h-24">
      <Loader2 className="h-5 w-5 animate-spin text-neon" />
    </div>
  );
}

/* ---------- ANALYTICS ---------- */
function AnalyticsOverview() {
  const [data, setData] = useState({
    users: 0,
    credits_in_circulation: 0,
    total_granted: 0,
    total_spent: 0,
    conversions_24h: 0,
    top_features: [] as { feature: string; spent: number }[],
    signups_7d: [] as { day: string; count: number }[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ count: users }, { data: credits }, { data: txns }, { count: conv24 }, { data: profiles }] =
        await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("credits").select("balance"),
          supabase.from("credit_transactions").select("amount, type, feature, created_at"),
          supabase
            .from("conversions")
            .select("*", { count: "exact", head: true })
            .gte("created_at", new Date(Date.now() - 86400_000).toISOString()),
          supabase.from("profiles").select("created_at"),
        ]);

      const balance = (credits ?? []).reduce((s, c) => s + Number(c.balance ?? 0), 0);
      const granted = (txns ?? []).filter((t) => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0);
      const spent = (txns ?? []).filter((t) => Number(t.amount) < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

      const byFeature: Record<string, number> = {};
      for (const t of txns ?? []) {
        if (Number(t.amount) < 0 && t.feature) {
          byFeature[t.feature] = (byFeature[t.feature] ?? 0) + Math.abs(Number(t.amount));
        }
      }
      const top_features = Object.entries(byFeature)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([feature, spent]) => ({ feature, spent }));

      const days: { day: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400_000);
        const key = d.toISOString().slice(0, 10);
        const count = (profiles ?? []).filter((p) => (p.created_at ?? "").startsWith(key)).length;
        days.push({ day: key.slice(5), count });
      }

      setData({
        users: users ?? 0,
        credits_in_circulation: balance,
        total_granted: granted,
        total_spent: spent,
        conversions_24h: conv24 ?? 0,
        top_features,
        signups_7d: days,
      });
      setLoading(false);
    })();
  }, []);

  if (loading) return <SectionLoader />;
  const maxSpent = Math.max(...data.top_features.map((f) => f.spent), 1);
  const maxSignup = Math.max(...data.signups_7d.map((d) => d.count), 1);

  const kpis = [
    { label: "Total Users", value: data.users.toLocaleString(), icon: Users },
    { label: "Credits Circulating", value: data.credits_in_circulation.toLocaleString(), icon: Coins },
    { label: "Total Granted", value: data.total_granted.toLocaleString(), icon: Gift },
    { label: "Total Spent", value: data.total_spent.toLocaleString(), icon: Activity },
    { label: "Conversions (24h)", value: data.conversions_24h.toLocaleString(), icon: TrendingUp },
  ];

  return (
    <section className="panel p-6">
      <SectionHeader icon={BarChart3} title="Platform Analytics" subtitle="Live usage and credit economy" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
        {kpis.map((k) => (
          <div key={k.label} className="panel p-3">
            <k.icon className="h-4 w-4 text-neon" />
            <div className="font-display text-xl mt-2">{k.value}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div className="panel p-4">
          <h3 className="font-display text-sm mb-3">Top Features by Spend</h3>
          {data.top_features.length === 0 ? (
            <p className="text-xs text-muted-foreground">No spend yet.</p>
          ) : (
            <div className="space-y-2">
              {data.top_features.map((f) => (
                <div key={f.feature}>
                  <div className="flex justify-between text-xs font-mono">
                    <span>{f.feature}</span>
                    <span className="text-neon">{f.spent.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded overflow-hidden mt-1">
                    <div className="h-full bg-neon" style={{ width: `${(f.spent / maxSpent) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="panel p-4">
          <h3 className="font-display text-sm mb-3">Signups — Last 7 Days</h3>
          <div className="flex items-end gap-1 h-24">
            {data.signups_7d.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-neon rounded-t transition-all"
                  style={{ height: `${(d.count / maxSignup) * 100}%`, minHeight: d.count > 0 ? "4px" : "1px" }}
                  title={`${d.count} signups`}
                />
                <div className="font-mono text-[9px] text-muted-foreground">{d.day}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
