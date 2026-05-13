import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeftRight, Briefcase, Globe2, History, Lightbulb, Sparkles, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: Home,
});

const stats = [
  { label: "Total Conversions", value: "0", icon: ArrowLeftRight },
  { label: "Saved History", value: "0", icon: History },
  { label: "Active Suggestions", value: "12", icon: Lightbulb },
  { label: "Countries Explored", value: "0", icon: Globe2 },
  { label: "Portfolio Value", value: "$ 0", icon: Briefcase },
  { label: "P/L %", value: "+ 0.0%", icon: TrendingUp },
];

const quick = [
  { to: "/app/converter", title: "Convert Currency", body: "Live FX, save to history.", icon: ArrowLeftRight },
  { to: "/app/countries", title: "Explore Countries", body: "Interactive map + AI scoring.", icon: Globe2 },
  { to: "/app/portfolio", title: "Track Portfolio", body: "Multi-currency P/L, AI optimizer.", icon: Briefcase },
  { to: "/app/suggestions", title: "Business Ideas", body: "AI-curated by your budget.", icon: Lightbulb },
] as const;

function Home() {
  const { user } = useAuth();
  const name = user?.email?.split("@")[0] ?? "investor";

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// HOME OVERVIEW</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">
          Welcome back, <span className="text-neon">{name}</span>
        </h1>
        <p className="text-muted-foreground mt-1">Your investment grid is online. Here's the live snapshot.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="panel p-4">
            <s.icon className="h-4 w-4 text-neon" />
            <div className="mt-3 font-display text-2xl">{s.value}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl">Activity Log</h2>
            <span className="font-mono text-[10px] text-muted-foreground">LIVE</span>
          </div>
          <div className="terminal p-4 text-sm space-y-1">
            <div>$ session.start <span className="text-muted-foreground">--user={name}</span></div>
            <div className="text-muted-foreground">→ session authenticated</div>
            <div className="text-muted-foreground">→ markets connected</div>
            <div>$ awaiting commands…</div>
          </div>
        </div>
        <div className="panel p-6">
          <h2 className="font-display text-xl flex items-center gap-2"><Sparkles className="h-4 w-4 text-neon" /> AI Tip</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Diversify across at least 3 currencies and 2 emerging markets to reduce volatility exposure.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {quick.map((q) => (
          <Link key={q.to} to={q.to} className="panel p-5 hover:panel-neon transition-all group">
            <q.icon className="h-5 w-5 text-neon" />
            <div className="mt-3 font-display">{q.title}</div>
            <div className="text-sm text-muted-foreground">{q.body}</div>
            <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-neon opacity-0 group-hover:opacity-100 transition-opacity">Open →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
