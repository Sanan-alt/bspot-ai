import { Link } from "@tanstack/react-router";
import logoUrl from "@/assets/bspot-logo.png";
import { useAuth } from "@/hooks/use-auth";

export function NeonLogo({ to }: { to?: string }) {
  const { user } = useAuth();
  // Authenticated users go to their dashboard; guests go to the public home.
  // Explicit `to` prop overrides this.
  const target = to ?? (user ? "/app" : "/");
  return (
    <Link to={target} className="inline-flex items-center group" aria-label="BSpot AI — Cross-border Investment Intelligence">
      <img
        src={logoUrl}
        alt="BSpot AI logo"
        className="h-9 w-auto md:h-10 object-contain"
        width={1536}
        height={1024}
        loading="eager"
        decoding="async"
      />
    </Link>
  );
}
