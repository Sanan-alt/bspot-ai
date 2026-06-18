import { createFileRoute } from "@tanstack/react-router";
import { Check, Coins, Sparkles, Zap } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/use-credits";

import { toast } from "sonner";

export const Route = createFileRoute("/app/buy-credits")({ component: BuyCreditsPage });

const PACKS = [
  {
    id: "starter",
    label: "Starter",
    credits: 200,
    pkr: 150,
    usd: 0.55,
    perks: ["Great for trying premium tools", "≈40 AI tool runs", "≈3 file exports"],
    highlight: false,
  },
  {
    id: "pro",
    label: "Pro",
    credits: 1000,
    pkr: 800,
    usd: 2.85,
    perks: ["Best value — save 25%", "≈200 AI tool runs", "≈20 file exports", "Priority AI processing"],
    highlight: true,
  },
  {
    id: "power",
    label: "Power",
    credits: 5000,
    pkr: 3500,
    usd: 12.5,
    perks: ["Unlimited browsing-feel", "≈1000 AI tool runs", "≈100 file exports", "Early access to new tools"],
    highlight: false,
  },
];

function BuyCreditsPage() {
  const { user } = useAuth();
  const { balance, isOwner, refresh } = useCredits();

  const buy = async (pack: (typeof PACKS)[number]) => {
    if (!user) return;
    if (isOwner) {
      toast.info("You're the owner — credits are unlimited.");
      return;
    }
    try {
      const { purchaseCreditsMock } = await import("@/lib/credits");
      await purchaseCreditsMock(user.id, pack.credits, pack.label);
      await refresh();
      toast.success(`+${pack.credits.toLocaleString()} credits added`, {
        description: `${pack.label} pack — demo grant (real Stripe checkout coming soon).`,
      });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not complete purchase");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// BUY CREDITS</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Power up your grid</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pricing in PKR. Real Stripe checkout (USD equivalent) coming next phase — purchases here are demo grants.
          </p>
        </div>
        <div className="panel p-4 text-right">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">// Current balance</div>
          <div className="font-display text-3xl text-neon flex items-center gap-2 justify-end">
            <Coins className="h-6 w-6" />
            {isOwner ? "∞" : balance.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {PACKS.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`relative panel p-6 flex flex-col ${
              p.highlight
                ? "panel-neon scanline ring-2 ring-primary/50 glow"
                : "hover:border-primary/40 transition-colors"
            }`}
          >
            {p.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-mono uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Most popular
              </div>
            )}

            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-2xl">{p.label}</h3>
              <Zap className={`h-5 w-5 ${p.highlight ? "text-neon" : "text-muted-foreground"}`} />
            </div>

            <div className="mt-4">
              <div className="font-display text-5xl text-neon">{p.credits.toLocaleString()}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">credits</div>
            </div>

            <div className="mt-5 flex items-baseline gap-2">
              <span className="font-display text-3xl">PKR {p.pkr}</span>
              <span className="font-mono text-xs text-muted-foreground">≈ ${p.usd.toFixed(2)}</span>
            </div>

            <ul className="mt-5 space-y-2 flex-1">
              {p.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-neon mt-0.5 shrink-0" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => buy(p)}
              disabled
              className={`mt-6 w-full ${p.highlight ? "glow" : ""}`}
              variant={p.highlight ? "default" : "outline"}
              title="Stripe checkout will be enabled before launch"
            >
              {isOwner ? "Owner — unlimited" : "Coming soon"}
            </Button>
          </motion.div>
        ))}
      </div>

      <div className="panel p-6">
        <h2 className="font-display text-xl mb-4">What credits cost</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {[
            ["Map / live location", 20],
            ["Market & economic data", 15],
            ["Export PDF / Excel / CSV", 50],
            ["AI chatbot or AI tool", 5],
            ["Business analytics / BI", 20],
            ["Premium reports", 100],
          ].map(([label, cost]) => (
            <div key={label as string} className="flex items-center justify-between panel p-3">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-mono text-neon">{cost}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs font-mono text-muted-foreground">
        Secure payment integration (Stripe) ready to wire — switch from demo mode in Phase B.
      </p>
    </div>
  );
}
