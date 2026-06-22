import { createFileRoute, Link } from "@tanstack/react-router";
import { NeonLogo } from "@/components/NeonLogo";
import { SiteFooter } from "@/components/SiteFooter";

const OG_IMAGE = "https://bspot.info/__l5e/assets-v1/f64266aa-1489-436a-9b59-75bdc6a1acf4/og-share.png";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — BSpot AI" },
      { name: "description", content: "How BSpot AI collects, uses, stores, and protects your personal data, and the rights you have over it." },
      { property: "og:title", content: "Privacy Policy — BSpot AI" },
      { property: "og:url", content: "https://bspot.info/privacy" },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: "https://bspot.info/privacy" }],
  }),
});

function PrivacyPage() {
  const updated = "June 19, 2026";
  return (
    <div>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <NeonLogo />
          <Link to="/" className="font-mono text-xs uppercase tracking-widest hover:text-neon">← Home</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16 space-y-8">
        <header>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// LEGAL</p>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-1">Last updated: {updated}</p>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">This page is maintained by Team ApexMinds, the operator of BSpot AI, to explain how we handle your personal data. It is not a certification or independent audit.</p>
        </header>

        <Section title="1. Who we are">
          <p>BSpot AI is operated by Team ApexMinds, based in Karachi, Pakistan. We are the data controller for personal data you provide to the Service. Contact: <a className="text-neon" href="mailto:bspot.ai.official@gmail.com">bspot.ai.official@gmail.com</a>.</p>
        </Section>

        <Section title="2. Data we collect">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account data</strong> — email, display name, password hash, preferred language, MFA settings.</li>
            <li><strong>Profile data</strong> — home country, target country, business type, budget range, timeline, readiness inputs.</li>
            <li><strong>Uploaded documents</strong> — passport scans, bank statements, or other files you choose to store in the Document Vault.</li>
            <li><strong>Usage data</strong> — pages visited, features used, AI prompts and responses, credit transactions, error logs.</li>
            <li><strong>Device & technical data</strong> — IP address, browser type, operating system, and cookies for session and preferences.</li>
            <li><strong>Payment data</strong> — handled directly by our payment processor; we store only the transaction ID and last 4 digits of the card for receipts.</li>
          </ul>
        </Section>

        <Section title="3. How we use your data">
          <p>To (a) operate and secure the Service; (b) personalize country guidance, roadmaps, and AI advice; (c) process credit purchases and prevent fraud; (d) communicate service updates and respond to support requests; (e) comply with legal obligations. We do <strong>not</strong> sell your personal data and we do not use it for third-party advertising.</p>
        </Section>

        <Section title="4. Legal bases (GDPR/UK GDPR)">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Contract</strong> — to deliver the features you sign up for.</li>
            <li><strong>Legitimate interest</strong> — to secure the platform, improve features, and prevent abuse.</li>
            <li><strong>Consent</strong> — for optional marketing emails (you can opt out anytime).</li>
            <li><strong>Legal obligation</strong> — to comply with tax, accounting, and law-enforcement requests.</li>
          </ul>
        </Section>

        <Section title="5. Third-party services">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Lovable Cloud</strong> — authentication, database, file storage, edge functions.</li>
            <li><strong>Lovable AI Gateway (Google Gemini)</strong> — generates AI dossiers and assistant responses from your prompts.</li>
            <li><strong>ExchangeRate-API, Finnhub, CoinGecko, World Bank</strong> — public market and macro data feeds.</li>
            <li><strong>Payment processor</strong> — handles card payments, PayPal, and wallets (PCI-DSS Level 1 certified).</li>
          </ul>
          <p className="mt-2">These providers receive only the data necessary to deliver the requested feature and are bound by their own data-processing terms.</p>
        </Section>

        <Section title="6. Data retention">
          <p>Account and profile data are retained for as long as your account is active. Uploaded documents remain until you delete them or close your account. Backups are purged within 30 days of deletion. Billing records may be retained for up to 7 years to comply with tax law.</p>
        </Section>

        <Section title="7. Your rights">
          <p>You have the right to access, correct, export, restrict, or delete your personal data, to object to processing based on legitimate interest, and to withdraw consent. Most actions are self-service in Settings; for others email <a className="text-neon" href="mailto:bspot.ai.official@gmail.com">bspot.ai.official@gmail.com</a>. We respond within 30 days. EU/UK residents may lodge a complaint with their local data-protection authority.</p>
        </Section>

        <Section title="8. International transfers">
          <p>The Service is hosted on global infrastructure and your data may be processed in regions outside your home country (typically EU, US, or Asia-Pacific). Where required, we rely on Standard Contractual Clauses or equivalent safeguards.</p>
        </Section>

        <Section title="9. Security">
          <p>Data is encrypted in transit (TLS 1.2+) and at rest. Documents are stored in private buckets with time-limited signed URLs. Row-level security restricts every record to its owner. Optional MFA (TOTP + recovery codes) is available from Settings. No system is 100% secure — we will notify affected users within 72 hours of any confirmed breach involving personal data.</p>
        </Section>

        <Section title="10. Cookies">
          <p>We use strictly necessary cookies for session and preferences (theme, language, sidebar state). We do not use third-party advertising cookies. You can clear cookies anytime in your browser; doing so may sign you out.</p>
        </Section>

        <Section title="11. Children">
          <p>The Service is not directed to anyone under 18. We do not knowingly collect data from minors. If you believe a minor has provided us data, contact us and we will delete it.</p>
        </Section>

        <Section title="12. Changes to this policy">
          <p>We may update this Policy. Material changes will be notified in-app or by email. The "Last updated" date above always reflects the current version.</p>
        </Section>

        <Section title="13. Contact">
          <p>Privacy, data, and security requests: <a className="text-neon" href="mailto:bspot.ai.official@gmail.com">bspot.ai.official@gmail.com</a></p>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel p-6 space-y-2">
      <h2 className="font-display text-xl text-neon">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}
