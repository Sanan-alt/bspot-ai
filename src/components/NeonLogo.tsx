import { Link } from "@tanstack/react-router";
import logoUrl from "@/assets/bspot-logo.png";

export function NeonLogo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="inline-flex items-center group" aria-label="BSpot AI — Cross-border Investment Intelligence">
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
