import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, Bot, Briefcase, Globe2, Mail, Sparkles, TrendingUp, Zap, Plane, Building2, Award } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { NeonLogo } from "@/components/NeonLogo";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StockTicker } from "@/components/StockTicker";
import { COUNTRY_BY_CODE } from "@/lib/countries-data";
import { TOP_INVESTMENT_COUNTRIES, VISA_PROGRAMS } from "@/lib/visa-programs";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen">

      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <NeonLogo />
          <nav className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <a href="#top-countries" className="hover:text-neon">{t("nav.countries")}</a>
            <a href="#features" className="hover:text-neon">{t("nav.features")}</a>
            <a href="#success" className="hover:text-neon">{t("nav.success")}</a>
            <a href="#contact" className="hover:text-neon">{t("nav.contact")}</a>
            <Link to="/terms" className="hover:text-neon">{t("nav.terms")}</Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <LanguageSelector compact />
            <Link to="/signin" className="text-sm font-mono uppercase tracking-widest hover:text-neon">{t("nav.signin")}</Link>
            <Link to="/signup" className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest glow-sm hover:scale-105 transition-transform">
              {t("nav.launch")}
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 pt-4">
        <StockTicker />
      </div>

      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pt-24 pb-32 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 panel-neon px-3 py-1 text-xs font-mono uppercase tracking-widest">
              <Sparkles className="h-3 w-3 text-neon" /> {t("hero.badge")}
            </div>
            <h1 className="mt-6 font-display text-4xl md:text-6xl leading-[1.05]">
              {t("hero.headline_a")} <span className="text-neon">{t("hero.headline_b")}</span> {t("hero.headline_d")}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              {t("hero.subhead")}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/signup" className="group inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-mono uppercase tracking-widest text-sm glow hover:scale-105 transition-transform">
                {t("hero.cta_start")} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={async () => {
                  try {
                    const { supabase } = await import("@/integrations/supabase/client");
                    const { error } = await supabase.auth.signInAnonymously();
                    if (error) throw error;
                    try {
                      localStorage.setItem(
                        "bspot.demo_profile",
                        JSON.stringify({
                          name: "Ahmed (Demo)",
                          home_country: "Pakistan",
                          target_country: "UAE",
                          business_type: "Trading LLC",
                          budget: "PKR 3,000,000",
                          timeline: "6 months",
                          readiness_score: 54,
                        }),
                      );
                    } catch {}
                    window.location.href = "/app";
                  } catch (e) {
                    console.error("Demo sign-in failed", e);
                    window.location.href = "/signup";
                  }
                }}
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-md border-2 border-primary text-neon font-mono uppercase tracking-widest text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Zap className="h-4 w-4" /> {t("hero.cta_demo")}
              </button>
              <Link to="/signin" className="px-6 py-3 rounded-md border border-border font-mono uppercase tracking-widest text-sm hover:border-primary hover:text-neon">
                {t("hero.cta_signin")}
              </Link>
            </div>
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
              {[
                { k: "10", v: t("stats.countries"), d: t("stats.countries_d") },
                { k: "📋", v: t("stats.roadmaps"), d: t("stats.roadmaps_d") },
                { k: "180+", v: t("stats.fx"), d: t("stats.fx_d") },
                { k: "🤖", v: t("stats.ai"), d: t("stats.ai_d") },
              ].map((s) => (
                <div key={s.v} className="panel p-3">
                  <div className="font-display text-2xl text-neon">{s.k}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{s.v}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground leading-tight">{s.d}</div>
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

      {/* TOP 5 INVESTMENT COUNTRIES */}
      <section id="top-countries" className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center mb-12">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// HOT DESTINATIONS</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">Top <span className="text-neon">5 investment</span> countries</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">Where global investors are placing their capital — explore visa, residency, and citizenship pathways.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {TOP_INVESTMENT_COUNTRIES.map((code) => {
            const c = COUNTRY_BY_CODE[code];
            const programs = VISA_PROGRAMS[code] ?? [];
            return (
              <Link key={code} to="/app/countries" className="panel p-5 hover:panel-neon transition-all group">
                <div className="flex items-center justify-between">
                  <span className="text-5xl">{c.flag}</span>
                  <Award className="h-5 w-5 text-neon opacity-60 group-hover:opacity-100" />
                </div>
                <div className="mt-3 font-display text-lg group-hover:text-neon">{c.name}</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{c.code} · {c.currency}</div>
                <div className="mt-3 space-y-1">
                  {programs.slice(0, 2).map((p) => (
                    <div key={p.name} className="text-xs flex gap-1.5">
                      <Plane className="h-3 w-3 text-neon shrink-0 mt-0.5" />
                      <span className="leading-tight">{p.name}</span>
                    </div>
                  ))}
                  {programs.length > 2 && (
                    <div className="text-[10px] font-mono text-muted-foreground">+{programs.length - 2} more programs</div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section id="success" className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center mb-12">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// REAL OUTCOMES</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">Before · <span className="text-neon">After</span></h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">From local hustle to global lifestyle — what investment immigration unlocks.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="panel p-0 overflow-hidden">
            <div className="aspect-[4/3] bg-gradient-to-br from-[oklch(0.18_0.005_95)] to-[oklch(0.10_0.005_95)] relative">
              <img
                src="https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?auto=format&fit=crop&w=900&q=80"
                alt="Entrepreneur working in a modest local setup before immigration"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-70 grayscale"
              />
              <div className="absolute top-3 left-3 px-2 py-1 panel-neon font-mono text-[10px] uppercase tracking-widest">Before</div>
            </div>
            <div className="p-5">
              <h3 className="font-display text-xl">Local horizons</h3>
              <p className="mt-2 text-sm text-muted-foreground">Working hard, but limited by local markets, currency volatility, and regulation.</p>
            </div>
          </div>
          <div className="panel-neon p-0 overflow-hidden">
            <div className="aspect-[4/3] relative">
              <img
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=80"
                alt="Professional business family thriving after investment immigration"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute top-3 left-3 px-2 py-1 bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-widest">After</div>
            </div>
            <div className="p-5">
              <h3 className="font-display text-xl text-neon">Global opportunity</h3>
              <p className="mt-2 text-sm text-muted-foreground">A golden visa, a scaled business, hard-currency income, and a future for the whole family.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT / SUGGESTIONS */}
      <section id="contact" className="mx-auto max-w-5xl px-6 py-16">
        <div className="panel-neon p-8 md:p-10 text-center">
          <Mail className="h-8 w-8 text-neon mx-auto" />
          <h2 className="mt-3 font-display text-3xl md:text-4xl">Got an <span className="text-neon">idea</span> to improve BSpot?</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            If any user, admin, or website worker has suggestions or ideas to improve the platform, reach out — we read every message.
          </p>
          <a
            href="mailto:bspot.ai.official@gmail.com?subject=BSpot%20AI%20—%20Suggestion"
            className="mt-6 inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-mono uppercase tracking-widest text-sm glow hover:scale-105 transition-transform"
          >
            <Mail className="h-4 w-4" />
            <span>bspot.ai.official@gmail.com</span>
          </a>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground font-mono">
            <Building2 className="h-3 w-3" /> Partnerships · Press · Product feedback
          </div>
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
