import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeftRight,
  Briefcase,
  Globe2,
  History,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Coins,
  Star,
  Bell,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/use-credits";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { OnboardingBanner } from "@/components/OnboardingBanner";

export const Route = createFileRoute("/app/")({ component: Home });

const quick = [
  { to: "/app/converter", title: "Convert Currency", body: "Live FX, save to history.", icon: ArrowLeftRight },
  { to: "/app/watchlist", title: "Watchlist", body: "Live track favorites.", icon: Star },
  { to: "/app/portfolio", title: "Portfolio", body: "P/L, AI optimizer.", icon: Briefcase },
  { to: "/app/suggestions", title: "Business Ideas", body: "AI-curated.", icon: Lightbulb },
] as const;

function Home() {
  const { user } = useAuth();
  const { balance } = useCredits();
  const name = user?.email?.split("@")[0] ?? "investor";

  const [stats, setStats] = useState({
    conversions: 0,
    portfolio: 0,
    watchlist: 0,
    notifications: 0,
    pl: 0,
  });
  const [recent, setRecent] = useState<Array<{ from: string; to: string; amount: number; result: number; created_at: string }>>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ count: cConv }, { data: portfolio }, { count: cWatch }, { count: cNotif }, { data: lastConv }] =
        await Promise.all([
          supabase.from("conversions").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("investments").select("initial_amount, current_value").eq("user_id", user.id),
          supabase.from("watchlists" as never).select("*", { count: "exact", head: true }),
          supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false),
          supabase
            .from("conversions")
            .select("from_currency, to_currency, amount, converted_amount, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);
      const invested = (portfolio ?? []).reduce((s, r) => s + Number(r.initial_amount ?? 0), 0);
      const current = (portfolio ?? []).reduce((s, r) => s + Number(r.current_value ?? r.initial_amount ?? 0), 0);
      const pl = invested > 0 ? ((current - invested) / invested) * 100 : 0;
      setStats({
        conversions: cConv ?? 0,
        portfolio: current,
        watchlist: cWatch ?? 0,
        notifications: cNotif ?? 0,
        pl,
      });
      setRecent(
        (lastConv ?? []).map((r) => ({
          from: r.from_currency,
          to: r.to_currency,
          amount: Number(r.amount),
          result: Number(r.converted_amount),
          created_at: r.created_at,
        })),
      );
    })();
  }, [user?.id]);

  const cards = [
    { label: "Credits", value: balance.toLocaleString(), icon: Coins, accent: true },
    { label: "Conversions", value: stats.conversions, icon: ArrowLeftRight },
    { label: "Portfolio Value", value: `$${stats.portfolio.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: Briefcase },
    { label: "P/L %", value: `${stats.pl >= 0 ? "+" : ""}${stats.pl.toFixed(2)}%`, icon: TrendingUp },
    { label: "Watchlist", value: stats.watchlist, icon: Star },
    { label: "Alerts", value: stats.notifications, icon: Bell },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// HOME OVERVIEW</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">
          Welcome back, <span className="text-neon">{name}</span>
        </h1>
        <p className="text-muted-foreground mt-1">Your investment grid is online. Live snapshot below.</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`panel p-4 ${s.accent ? "panel-neon" : ""}`}
          >
            <s.icon className="h-4 w-4 text-neon" />
            <div className="mt-3 font-display text-2xl">{s.value}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl flex items-center gap-2">
              <History className="h-4 w-4 text-neon" /> Recent Conversions
            </h2>
            <Link to="/app/history" className="font-mono text-[10px] text-neon">VIEW ALL →</Link>
          </div>
          {recent.length === 0 ? (
            <div className="terminal p-4 text-sm">
              <div>$ session.start <span className="text-muted-foreground">--user={name}</span></div>
              <div className="text-muted-foreground">→ no conversions yet — try the converter</div>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm panel p-3">
                  <div className="font-mono">
                    <span className="text-neon">{r.amount.toLocaleString()} {r.from}</span>
                    <span className="text-muted-foreground mx-2">→</span>
                    <span className="text-neon">{r.result.toLocaleString(undefined, { maximumFractionDigits: 2 })} {r.to}</span>
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="panel p-6">
          <h2 className="font-display text-xl flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-neon" /> AI Tip
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Diversify across at least 3 currencies and 2 emerging markets to reduce volatility exposure.
          </p>
          <Link to="/app/assistant" className="mt-4 inline-block font-mono text-[10px] uppercase tracking-widest text-neon">
            Ask the AI →
          </Link>
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl mb-3">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quick.map((q) => (
            <Link key={q.to} to={q.to} className="panel p-5 hover:panel-neon transition-all group">
              <q.icon className="h-5 w-5 text-neon" />
              <div className="mt-3 font-display">{q.title}</div>
              <div className="text-sm text-muted-foreground">{q.body}</div>
              <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-neon opacity-0 group-hover:opacity-100 transition-opacity">
                Open →
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl mb-3 flex items-center gap-2"><Globe2 className="h-4 w-4 text-neon" /> Explore</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link to="/app/countries" className="panel p-4 hover:panel-neon">
            <div className="font-display">Country Data</div>
            <div className="text-xs text-muted-foreground">Live world map & AI scoring</div>
          </Link>
          <Link to="/app/notifications" className="panel p-4 hover:panel-neon">
            <div className="font-display">Notifications</div>
            <div className="text-xs text-muted-foreground">{stats.notifications} unread</div>
          </Link>
          <Link to="/app/buy-credits" className="panel p-4 hover:panel-neon">
            <div className="font-display">Buy Credits</div>
            <div className="text-xs text-muted-foreground">Top up to unlock premium AI</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
