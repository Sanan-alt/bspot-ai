import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bot, Briefcase, Globe2, Sparkles, TrendingUp, Zap } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { NeonLogo } from "@/components/NeonLogo";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <NeonLogo />
          <nav className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <a href="#features" className="hover:text-neon">Features</a>
            <a href="#stack" className="hover:text-neon">Stack</a>
            <Link to="/terms" className="hover:text-neon">Terms</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/signin" className="text-sm font-mono uppercase tracking-widest hover:text-neon">Sign In</Link>
            <Link to="/signup" className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest glow-sm hover:scale-105 transition-transform">
              Launch →
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pt-24 pb-32 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 panel-neon px-3 py-1 text-xs font-mono uppercase tracking-widest">
              <Sparkles className="h-3 w-3 text-neon" /> AI-driven · Real-time
            </div>
            <h1 className="mt-6 font-display text-5xl md:text-7xl leading-[0.95]">
              Invest <span className="text-neon">smarter</span><br/>
              across <span className="text-neon">borders</span>.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              BSpot AI is your futuristic command center for currency, country intelligence, AI business recommendations, and live portfolio tracking.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/signup" className="group inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-mono uppercase tracking-widest text-sm glow hover:scale-105 transition-transform">
                Get started <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/signin" className="px-6 py-3 rounded-md border border-border font-mono uppercase tracking-widest text-sm hover:border-primary hover:text-neon">
                Sign in
              </Link>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-md">
              {[
                { k: "180+", v: "Currencies" },
                { k: "200+", v: "Countries" },
                { k: "AI", v: "Optimizer" },
              ].map((s) => (
                <div key={s.v}>
                  <div className="font-display text-3xl text-neon">{s.k}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="panel-neon scanline p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs text-muted-foreground">PORTFOLIO_LIVE.exe</span>
                <span className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
                </span>
              </div>
              <div className="terminal p-4 text-sm">
                <div>$ bspot status</div>
                <div className="text-muted-foreground">→ scanning markets…</div>
                <div>USD/EUR <span className="text-neon">0.9214</span> ▲ 0.31%</div>
                <div>USD/JPY <span className="text-neon">149.21</span> ▼ 0.12%</div>
                <div>USD/PKR <span className="text-neon">279.45</span> ▲ 0.04%</div>
                <div className="mt-3">$ bspot portfolio.value</div>
                <div className="text-2xl font-display text-neon">$ 124,580.32</div>
                <div className="text-success">+ $4,210.55 (+3.5%) today</div>
                <div className="mt-3 text-muted-foreground">▎AI: rebalance toward EM equities</div>
              </div>
            </div>
            <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-primary/30 blur-3xl pointer-events-none" />
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center mb-14">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// CORE MODULES</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">Built for <span className="text-neon">global investors</span></h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: TrendingUp, title: "Live Currency Converter", body: "180+ currencies with real-time rates and smart save-to-history." },
            { icon: Globe2, title: "Country Intelligence", body: "Interactive world map with AI scoring, taxes, and laws per country." },
            { icon: Briefcase, title: "Portfolio Tracker", body: "Multi-currency P/L, performance charts, AI optimization." },
            { icon: Bot, title: "AI Assistant", body: "Chatbot with reminders, stock alerts, and economic monitoring." },
            { icon: Sparkles, title: "Business Suggestions", body: "AI-generated business ideas tailored to your budget and risk." },
            { icon: Zap, title: "Real-time Alerts", body: "Push notifications for rate changes, reminders, and portfolio events." },
          ].map((f) => (
            <div key={f.title} className="panel p-6 hover:panel-neon transition-all group">
              <f.icon className="h-7 w-7 text-neon mb-4" />
              <h3 className="font-display text-xl">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="stack" className="mx-auto max-w-5xl px-6 pb-24">
        <div className="panel-neon p-10 text-center scanline">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// READY?</p>
          <h2 className="mt-3 font-display text-4xl">Step into the <span className="text-neon">grid</span>.</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Create your account and unlock AI-powered investment intelligence in under a minute.</p>
          <Link to="/signup" className="mt-6 inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-md font-mono uppercase tracking-widest text-sm glow hover:scale-105 transition-transform">
            Create account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
