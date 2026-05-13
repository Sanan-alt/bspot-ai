import { Link } from "@tanstack/react-router";

export function NeonLogo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2 group">
      <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-display text-lg glow-sm pulse-neon">
        B
      </span>
      <span className="font-display text-xl tracking-widest">
        BSPOT<span className="text-neon">.AI</span>
      </span>
    </Link>
  );
}
