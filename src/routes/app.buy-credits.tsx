import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Coins, Sparkles, Zap, Lock, CreditCard } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
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
  const { balance, isOwner } = useCredits();

  const notify = (label: string) => {
    toast.info("Card checkout is launching soon", {
      description: `${label} pack will be available once secure checkout goes live in the next release.`,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// BUY CREDITS</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Power up your grid</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Secure card checkout (Visa, Mastercard, UnionPay, PayPal, Apple Pay, Google Pay) is integrating now. In the meantime, you keep earning 5 free credits every 24 hours automatically.
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

      <div className="panel-neon p-5 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 grid place-items-center rounded-md bg-primary/15 text-neon">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-lg">Card checkout — coming soon</div>
            <p className="text-xs text-muted-foreground max-w-xl">
              Real payments aren't live yet. The buttons below are placeholders. We will notify you the moment checkout opens.
            </p>
          </div>
        </div>
        <Link to="/app/history" className="md:ml-auto px-4 py-2 rounded-md border border-border font-mono text-xs uppercase tracking-widest hover:border-primary hover:text-neon text-center">
          View credit history
        </Link>
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
              onClick={() => notify(p.label)}
              disabled={isOwner}
              className={`mt-6 w-full ${p.highlight ? "glow" : ""}`}
              variant={p.highlight ? "default" : "outline"}
              title={isOwner ? "Owner — unlimited credits" : "Card checkout launching soon"}
            >
              {isOwner ? (
                "Owner — unlimited"
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5 mr-2" />
                  Notify me when live
                </>
              )}
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
        Payments will be processed by certified partners — your card details never touch our servers.
      </p>
    </div>
  );
}
