import { Link } from "@tanstack/react-router";
import { Coins, Crown, AlertTriangle } from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function CreditsBadge() {
  const { balance, loading, isOwner } = useCredits();
  const warned = useRef(false);

  useEffect(() => {
    if (loading || isOwner) return;
    if (balance <= 10 && balance > 0 && !warned.current) {
      warned.current = true;
      toast.warning(`Low credits: ${balance} left`, {
        description: "Top up to keep using premium features.",
        action: { label: "Buy", onClick: () => (window.location.href = "/app/buy-credits") },
      });
    }
    if (balance > 50) warned.current = false;
  }, [balance, loading, isOwner]);

  if (isOwner) {
    return (
      <Link
        to="/app/buy-credits"
        className="hidden sm:inline-flex items-center gap-2 h-9 px-3 rounded-md border border-primary/40 bg-primary/10 hover:bg-primary/20 transition-colors"
        title="Owner — unlimited credits"
      >
        <Crown className="h-4 w-4 text-neon" />
        <span className="font-mono text-xs uppercase tracking-widest text-neon">Owner · ∞</span>
      </Link>
    );
  }

  const low = balance <= 10;
  return (
    <Link
      to="/app/buy-credits"
      className={`inline-flex items-center gap-2 h-9 px-3 rounded-md border transition-colors ${
        low
          ? "border-destructive/60 bg-destructive/10 hover:bg-destructive/20 text-destructive"
          : "border-border hover:border-primary hover:text-neon"
      }`}
      title={low ? "Low credits — click to top up" : "Credit balance — click to buy more"}
    >
      {low ? <AlertTriangle className="h-4 w-4" /> : <Coins className="h-4 w-4" />}
      <span className="font-mono text-xs tabular-nums">
        {loading ? "—" : balance.toLocaleString()}
      </span>
      <span className="hidden md:inline font-mono text-[10px] uppercase tracking-widest opacity-60">credits</span>
    </Link>
  );
}
