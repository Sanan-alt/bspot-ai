import { Link } from "@tanstack/react-router";
import { LanguageSelector } from "@/components/LanguageSelector";
import { NeonLogo } from "@/components/NeonLogo";

export function SiteFooter() {
  return (
    <footer className="relative mt-24 border-t border-border bg-card/40">
      <div className="neon-divider absolute top-0 left-0 right-0" />
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid md:grid-cols-4 gap-8 text-sm">
          <div className="md:col-span-2">
            <NeonLogo />
            <p className="mt-4 text-muted-foreground max-w-sm">
              Cross-border investment intelligence — live FX, country data, AI roadmaps, and portfolio tracking built for global investors.
            </p>
            <div className="mt-5">
              <LanguageSelector compact />
            </div>
          </div>

          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Company</div>
            <ul className="mt-3 space-y-2">
              <li><Link to="/about" className="hover:text-neon">About</Link></li>
              <li><Link to="/contact" className="hover:text-neon">Contact</Link></li>
              <li><Link to="/faq" className="hover:text-neon">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Legal</div>
            <ul className="mt-3 space-y-2">
              <li><Link to="/privacy" className="hover:text-neon">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-neon">Terms &amp; Conditions</Link></li>
              <li><Link to="/refund" className="hover:text-neon">Refund Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-mono">
          <span>© {new Date().getFullYear()} BSpot AI · All rights reserved.</span>
          <span>Built for cross-border investors.</span>
        </div>
      </div>
    </footer>
  );
}
