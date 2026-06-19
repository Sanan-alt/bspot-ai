import { createFileRoute, Link } from "@tanstack/react-router";
import { NeonLogo } from "@/components/NeonLogo";
import { SiteFooter } from "@/components/SiteFooter";
import { Mail, MessageSquare, Building2, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact BSpot AI — Support, Partnerships, Press" },
      { name: "description", content: "Get in touch with the BSpot AI team for support, partnerships, press, or security reports." },
      { property: "og:title", content: "Contact BSpot AI" },
      { property: "og:url", content: "https://bspot-ai.lovable.app/contact" },
    ],
    links: [{ rel: "canonical", href: "https://bspot-ai.lovable.app/contact" }],
  }),
  component: ContactPage,
});

const channels = [
  { icon: MessageSquare, title: "General support", email: "bspot.ai.official@gmail.com", body: "Questions about features, your account, or how to use the platform." },
  { icon: Building2, title: "Partnerships & press", email: "bspot.ai.official@gmail.com", body: "Collaborations, integrations, media inquiries." },
  { icon: ShieldAlert, title: "Security & abuse", email: "trust@bspot-ai.lovable.app", body: "Report a vulnerability, abuse, or suspicious activity." },
  { icon: Mail, title: "Privacy & data requests", email: "privacy@bspot-ai.lovable.app", body: "Export or delete your data, or ask a privacy question." },
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
              <p className="mt-3 font-mono text-xs text-neon break-all">{c.email}</p>
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
