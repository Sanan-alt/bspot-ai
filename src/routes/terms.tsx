import { createFileRoute, Link } from "@tanstack/react-router";
import { NeonLogo } from "@/components/NeonLogo";
import { SiteFooter } from "@/components/SiteFooter";

const OG_IMAGE = "https://bspot.info/__l5e/assets-v1/f64266aa-1489-436a-9b59-75bdc6a1acf4/og-share.png";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions — BSpot AI" },
      { name: "description", content: "BSpot AI terms of service: acceptable use, account responsibilities, investment disclaimer, liability, and dispute resolution." },
      { property: "og:title", content: "Terms and Conditions — BSpot AI" },
      { property: "og:url", content: "https://bspot.info/terms" },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: "https://bspot.info/terms" }],
  }),
  component: Terms,
});

const sections: [string, React.ReactNode][] = [
  ["Acceptance of Terms", "By accessing or using BSpot AI (the \"Service\"), operated by Team ApexMinds (\"we\", \"us\"), you agree to these Terms and our Privacy Policy. If you do not agree, do not use the Service. These Terms form a binding contract between you and BSpot AI."],
  ["Eligibility", "You must be at least 18 years old and legally capable of entering binding contracts in your jurisdiction. By using the Service you represent that you meet these requirements and that your use does not violate any law applicable to you."],
  ["Accounts and Security", "You are responsible for safeguarding your credentials and for all activity under your account. Notify us immediately of any unauthorized access. We may suspend accounts showing signs of abuse, fraud, or compromise."],
  ["Investment Disclaimer", "BSpot AI provides educational content, public market data, and AI-generated analysis. NOTHING ON THE PLATFORM CONSTITUTES FINANCIAL, LEGAL, TAX, OR IMMIGRATION ADVICE. Past performance does not predict future results. Always consult a licensed professional in your jurisdiction before making a decision based on platform output."],
  ["Credits, Purchases & Billing", "AI-powered features consume credits. Free credits are granted on signup and periodically thereafter at our discretion. Paid credit packs are billed in advance through our payment processor. Pricing may change; changes apply only to future purchases. Refunds are governed by our Refund Policy."],
  ["Third-Party Data and Services", "The Service relies on third-party APIs and AI models (including but not limited to Lovable Cloud, Lovable AI Gateway, Finnhub, ExchangeRate-API, CoinGecko, and the World Bank). We do not guarantee the accuracy, availability, or timeliness of such data and are not liable for losses arising from its use."],
  ["Acceptable Use", "You agree not to: (a) reverse-engineer, scrape, or overload the Service; (b) use it for unlawful capital movement, money laundering, sanctions evasion, or tax fraud; (c) upload malware or infringing content; (d) impersonate others or submit false KYC information; (e) resell access without written consent."],
  ["Intellectual Property", "All Service code, branding, designs, and AI prompts are owned by Team ApexMinds and protected by applicable IP laws. You retain ownership of content you upload and grant us a limited license to host and process it solely to operate the Service."],
  ["Limitation of Liability", "TO THE MAXIMUM EXTENT PERMITTED BY LAW, BSPOT AI AND TEAM APEXMINDS ARE NOT LIABLE FOR INDIRECT, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, DATA, OR INVESTMENTS. Our total aggregate liability for any claim shall not exceed the amount you paid us in the 12 months preceding the claim, or USD 100, whichever is greater."],
  ["Indemnity", "You agree to indemnify and hold harmless BSpot AI and Team ApexMinds from any claim or demand arising from your use of the Service, your content, or your violation of these Terms."],
  ["Service Availability and Changes", "We aim for high uptime but do not warrant uninterrupted service. We may add, modify, suspend, or discontinue features at any time."],
  ["Termination", "We may suspend or terminate your access at any time for breach of these Terms or suspected unlawful use. You may close your account at any time from Settings; data retention is governed by our Privacy Policy."],
  ["Governing Law and Disputes", "These Terms are governed by the laws of Pakistan, without regard to conflict-of-law principles. Disputes shall first be resolved by good-faith negotiation; failing that, by courts of competent jurisdiction in Karachi, Pakistan, unless your local consumer law requires otherwise."],
  ["Changes to These Terms", "We may update these Terms from time to time. Material changes will be notified via in-app banner or email. Continued use of the Service after the effective date constitutes acceptance."],
  ["Contact", <>Questions about these Terms? Email <a className="text-neon" href="mailto:bspot.ai.official@gmail.com">bspot.ai.official@gmail.com</a>.</>],
];

function Terms() {
  return (
    <div>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <NeonLogo />
          <Link to="/" className="font-mono text-xs uppercase tracking-widest hover:text-neon">← Home</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// LEGAL</p>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl">Terms and Conditions</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: June 19, 2026</p>
        <p className="mt-6 text-sm text-muted-foreground leading-relaxed">Please read these Terms carefully. They limit our liability and explain how the Service works, how purchases are billed, and how disputes are resolved.</p>
        <div className="mt-10 space-y-8">
          {sections.map(([t, b], i) => (
            <section key={t}>
              <h2 className="font-display text-xl text-neon">{i + 1}. {t}</h2>
              <div className="mt-2 text-muted-foreground leading-relaxed">{b}</div>
            </section>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap gap-3">
          <Link to="/signup" className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-mono uppercase text-xs tracking-widest glow-sm">Accept & Sign Up</Link>
          <Link to="/" className="border border-border px-6 py-3 rounded-md font-mono uppercase text-xs tracking-widest hover:border-primary hover:text-neon">Back home</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
