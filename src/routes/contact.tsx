import { createFileRoute, Link } from "@tanstack/react-router";
import { NeonLogo } from "@/components/NeonLogo";
import { SiteFooter } from "@/components/SiteFooter";
import { Mail, MessageSquare, Building2, ShieldAlert } from "lucide-react";

const OG_IMAGE = "https://www.bspot.info/__l5e/assets-v1/f64266aa-1489-436a-9b59-75bdc6a1acf4/og-share.png";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact BSpot AI — Support, Partnerships, Press" },
      { name: "description", content: "Get in touch with the BSpot AI team for support, partnerships, press, or security reports." },
      { property: "og:title", content: "Contact BSpot AI" },
      { property: "og:description", content: "Reach support, partnerships, press, privacy, or security at BSpot AI." },
      { property: "og:url", content: "https://www.bspot.info/contact" },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: "https://www.bspot.info/contact" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "BSpot AI",
          url: "https://www.bspot.info/contact",
          email: "support@bspot.info",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Karachi",
            addressCountry: "PK",
          },
          areaServed: "Worldwide",
        }),
      },
    ],
  }),
  component: ContactPage,
});

const channels = [
  { icon: MessageSquare, title: "General support", email: "support@bspot.info", body: "Questions about features, your account, or how to use the platform." },
  { icon: Building2, title: "Partnerships & press", email: "partnerships@bspot.info", body: "Collaborations, integrations, media inquiries." },
  { icon: ShieldAlert, title: "Security & abuse", email: "security@bspot.info", body: "Report a vulnerability, abuse, or suspicious activity." },
  { icon: Mail, title: "Privacy & data requests", email: "privacy@bspot.info", body: "Export or delete your data, or ask a privacy question." },
];

function ContactPage() {
  return (
    <div>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <NeonLogo />
          <Link to="/" className="font-mono text-xs uppercase tracking-widest hover:text-neon">← Home</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-16 space-y-10">
        <section>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// CONTACT</p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl">We read every <span className="text-neon">message</span>.</h1>
          <p className="mt-4 text-muted-foreground">Pick the right channel below — we typically respond within 2 business days.</p>
        </section>

        <div className="grid sm:grid-cols-2 gap-4">
          {channels.map((c) => (
            <a key={c.title} href={`mailto:${c.email}`} className="panel p-5 hover:panel-neon transition-all block">
              <c.icon className="h-5 w-5 text-neon" />
              <h2 className="mt-3 font-display text-lg">{c.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{c.body}</p>
              <p className="mt-3 font-mono text-xs text-neon">Email us →</p>
            </a>
          ))}
        </div>

        <section className="panel p-6">
          <h2 className="font-display text-xl">Mailing address</h2>
          <p className="mt-2 text-sm text-muted-foreground">Team ApexMinds · Karachi, Pakistan · In partnership with Aptech Learning.</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
