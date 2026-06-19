import { Link } from "@tanstack/react-router";
import { LanguageSelector } from "@/components/LanguageSelector";

const team = [
  { name: "M. Sanan Abid", role: "Team Leader" },
  { name: "Sir Ali Raza", role: "Helper & Support Faculty" },
  { name: "M. Ahmed", role: "Python Junior Programmer" },
  { name: "Mahraj", role: "CSS Programmer" },
  { name: "Ebad", role: "HTML Programmer" },
  { name: "Khizer Siddique", role: "AI Expert" },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-24 border-t border-border bg-card/40">
      <div className="neon-divider absolute top-0 left-0 right-0" />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center mb-10">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// developed by</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-display text-neon">Team ApexMinds</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {team.map((m) => (
            <div key={m.name} className="panel p-4 text-center hover:panel-neon transition-all">
              <div className="font-display text-sm">{m.name}</div>
              <div className="font-mono text-[10px] text-muted-foreground mt-1">{m.role}</div>
            </div>
          ))}
        </div>
        <div className="mt-10 grid md:grid-cols-3 gap-6 text-sm">
          <div className="panel p-5">
            <div className="font-mono text-xs text-muted-foreground">SUPPORT</div>
            <div className="mt-2">With support of <span className="text-neon">Aptech Learning</span></div>
            <div className="mt-1">Leading Support: <span className="text-neon">Hackroid</span></div>
          </div>
          <div className="panel p-5">
            <div className="font-mono text-xs text-muted-foreground">COMPANY</div>
            <ul className="mt-2 space-y-1">
              <li><Link to="/about" className="hover:text-neon">About</Link></li>
              <li><Link to="/contact" className="hover:text-neon">Contact</Link></li>
              <li><Link to="/faq" className="hover:text-neon">FAQ</Link></li>
              <li><Link to="/refund" className="hover:text-neon">Refund Policy</Link></li>
              <li><Link to="/privacy" className="hover:text-neon">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-neon">Terms &amp; Conditions</Link></li>
              <li><Link to="/community-guidelines" className="hover:text-neon">Community Guidelines</Link></li>
            </ul>
          </div>

          <div className="panel p-5">
            <div className="font-mono text-xs text-muted-foreground">BSPOT AI</div>
            <p className="mt-2 text-muted-foreground">Futuristic full-stack investment intelligence — currency, countries, portfolios, and AI insights.</p>
          </div>
        </div>
        <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-mono">
          <span>© {new Date().getFullYear()} BSpot AI · Team ApexMinds</span>
          <div className="flex items-center gap-4">
            <LanguageSelector compact />
            <span>Beta v1.0 · Built on Lovable Cloud</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
