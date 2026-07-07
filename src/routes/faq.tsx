import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { NeonLogo } from "@/components/NeonLogo";
import { SiteFooter } from "@/components/SiteFooter";
import { ChevronDown } from "lucide-react";

const OG_IMAGE = "https://www.bspot.info/__l5e/assets-v1/f64266aa-1489-436a-9b59-75bdc6a1acf4/og-share.png";

const faqs = [
  { q: "What is BSpot AI?", a: "An AI-powered platform that helps you plan cross-border investments — choose a country, estimate setup costs, generate a business roadmap, and track your portfolio in multiple currencies." },
  { q: "Is BSpot AI free to use?", a: "You can explore the platform in demo mode with 50 free AI credits. After signing up you get 100 free credits and 5 more every 24 hours. Additional credits can be purchased." },
  { q: "Is BSpot AI a licensed financial advisor?", a: "No. BSpot AI provides educational content, public data, and AI-generated analysis. It is NOT licensed financial, legal, tax, or immigration advice. Always confirm with a licensed professional before acting." },
  { q: "Where does your country and market data come from?", a: "Live FX rates from ExchangeRate-API, stock quotes from Finnhub, country macro data from the World Bank, and crypto from CoinGecko. AI synthesis is powered by Google Gemini via Lovable AI Gateway." },
  { q: "How accurate are the cost calculator and visa estimates?", a: "Figures are sourced from public government and consultancy data and updated regularly, but rules and fees change. Treat every number as a planning estimate, not a quote." },
  { q: "How is my data protected?", a: "Data is encrypted in transit and at rest. Documents are stored in private buckets with time-limited signed URLs. Row-level security ensures only you can read your records. See our Privacy Policy for details." },
  { q: "Can I delete my account and data?", a: "Yes — from Settings → Account, or by emailing bspot.ai.official@gmail.com. We remove your profile, documents, and history within 30 days." },
  { q: "Which payment methods will be supported?", a: "We're integrating Stripe to support major Visa, Mastercard, American Express, UnionPay, PayPal, Apple Pay and Google Pay. Card purchases will be live in the next release." },
  { q: "Do you offer refunds on credits?", a: "Yes — see our Refund Policy. Unused credit packs can be refunded within 14 days of purchase." },
  { q: "Who is behind BSpot AI?", a: "Team ApexMinds, a group of student developers and AI engineers backed by Aptech Learning. See the About page for details." },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — BSpot AI" },
      { name: "description", content: "Answers to common questions about BSpot AI, pricing, credits, data sources, and security." },
      { property: "og:title", content: "BSpot AI — Frequently Asked Questions" },
      { property: "og:url", content: "https://www.bspot.info/faq" },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: "https://www.bspot.info/faq" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: FAQPage,
});

function FAQItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <details
      className="px-5 py-4 group"
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className="flex items-start justify-between gap-3 cursor-pointer list-none font-display text-lg hover:text-neon">
        <span>{q}</span>
        <ChevronDown className={`h-4 w-4 mt-1.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </summary>
      <p className="mt-3 text-muted-foreground leading-relaxed">{a}</p>
    </details>
  );
}

function FAQPage() {
  return (
    <div>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <NeonLogo />
          <Link to="/" className="font-mono text-xs uppercase tracking-widest hover:text-neon">← Home</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// HELP</p>
        <h1 className="mt-3 font-display text-4xl md:text-5xl">Frequently asked <span className="text-neon">questions</span></h1>
        <p className="mt-4 text-muted-foreground">Can't find your answer? Email <a className="text-neon" href="mailto:bspot.ai.official@gmail.com">bspot.ai.official@gmail.com</a>.</p>
        <div className="mt-10 panel divide-y divide-border">
          {faqs.map((f, i) => (
            <FAQItem key={i} q={f.q} a={f.a} defaultOpen={i === 0} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
