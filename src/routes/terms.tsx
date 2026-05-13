import { createFileRoute, Link } from "@tanstack/react-router";
import { NeonLogo } from "@/components/NeonLogo";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions — BSpot AI" },
      { name: "description", content: "BSpot AI terms of use, investment disclaimer, privacy and liability." },
    ],
  }),
  component: Terms,
});

const sections = [
  ["Acceptance of Terms", "By accessing BSpot AI you accept these Terms in full. If you disagree, do not use the platform."],
  ["User Responsibilities", "You are responsible for the accuracy of information you provide and for actions taken under your account."],
  ["Investment Disclaimer", "BSpot AI provides analytics and AI-generated suggestions for informational purposes only. It is not financial advice. All investments carry risk."],
  ["Data Privacy and Security", "We protect your data using modern encryption and access controls. We never sell your personal data."],
  ["Intellectual Property Rights", "All branding, designs, and code are owned by Team ApexMinds unless otherwise noted."],
  ["Limitation of Liability", "BSpot AI is provided as-is. We are not liable for losses arising from use of the platform."],
  ["Service Availability", "We strive for high uptime but do not guarantee uninterrupted access."],
  ["User Content and Conduct", "You agree not to upload illegal, abusive, or infringing content."],
  ["Termination of Service", "We may suspend or terminate accounts that violate these Terms."],
  ["Changes to Terms", "We may update these Terms; the latest version is always posted on this page."],
  ["Contact Information", "Questions? Reach out to Team ApexMinds via the support channel."],
];

function Terms() {
  return (
    <div>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <NeonLogo />
          <Link to="/" className="font-mono text-xs uppercase tracking-widest hover:text-neon">← Home</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// LEGAL</p>
        <h1 className="mt-3 font-display text-4xl md:text-5xl">Terms and Conditions</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        <div className="mt-10 space-y-8">
          {sections.map(([t, b], i) => (
            <section key={t}>
              <h2 className="font-display text-xl text-neon">{i + 1}. {t}</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">{b}</p>
            </section>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap gap-3">
          <Link to="/signup" className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-mono uppercase text-xs tracking-widest glow-sm">Accept & Sign Up</Link>
          <Link to="/" className="border border-border px-6 py-3 rounded-md font-mono uppercase text-xs tracking-widest hover:border-primary hover:text-neon">Decline</Link>
          <button onClick={() => window.print()} className="border border-border px-6 py-3 rounded-md font-mono uppercase text-xs tracking-widest hover:border-primary hover:text-neon">Print</button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
