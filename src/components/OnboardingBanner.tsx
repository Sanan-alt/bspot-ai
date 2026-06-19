import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, X, ArrowRight, ArrowLeftRight, Globe2, Plane, Bot, Coins } from "lucide-react";

const STORAGE_KEY = "bspot.onboarding.dismissed.v1";

const steps = [
  { icon: ArrowLeftRight, title: "Convert currency", body: "Live rates for 180+ currencies — try the Converter first.", to: "/app/converter" as const },
  { icon: Globe2, title: "Pick a country", body: "Open Country Data and tap any nation for a live AI dossier.", to: "/app/countries" as const },
  { icon: Plane, title: "Plan your move", body: "Visa Guide shows residency programs, investment thresholds & timelines.", to: "/app/visa" as const },
  { icon: Bot, title: "Ask the AI", body: "The Assistant remembers your portfolio and target country.", to: "/app/assistant" as const },
  { icon: Coins, title: "Free credits, daily", body: "We top you up with 5 free credits every 24 hours — no card needed.", to: "/app/buy-credits" as const },
];

export function OnboardingBanner() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY) === "1";
      if (!dismissed) setShow(true);
    } catch {
      // ignore
    }
  }, []);

  if (!show) return null;
  const s = steps[step];
  const isLast = step === steps.length - 1;
  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
    setShow(false);
  };

  return (
    <div className="panel-neon scanline p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="h-10 w-10 rounded-md bg-primary/15 grid place-items-center text-neon shrink-0">
        <s.icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <Sparkles className="h-3 w-3 text-neon" /> Getting started · {step + 1} / {steps.length}
        </div>
        <div className="mt-1 font-display text-lg">{s.title}</div>
        <p className="text-sm text-muted-foreground">{s.body}</p>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
        <Link
          to={s.to}
          onClick={dismiss}
          className="px-3 py-2 rounded-md bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-widest glow-sm inline-flex items-center gap-1"
        >
          Open <ArrowRight className="h-3 w-3" />
        </Link>
        {!isLast ? (
          <button
            onClick={() => setStep((i) => i + 1)}
            className="px-3 py-2 rounded-md border border-border font-mono text-[10px] uppercase tracking-widest hover:border-primary hover:text-neon"
          >
            Next
          </button>
        ) : (
          <button
            onClick={dismiss}
            className="px-3 py-2 rounded-md border border-border font-mono text-[10px] uppercase tracking-widest hover:border-primary hover:text-neon"
          >
            Done
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="Dismiss tour"
          className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-neon"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
