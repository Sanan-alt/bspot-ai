import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — BSpot AI" },
      { name: "description", content: "How BSpot AI collects, uses, and protects your data." },
    ],
    links: [{ rel: "canonical", href: "https://bspot-ai.lovable.app/privacy" }],
  }),
});

function PrivacyPage() {
  const updated = "June 17, 2026";
  return (
    <div className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-3xl space-y-8">
        <header>
          <Link to="/" className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-neon">← Back home</Link>
          <h1 className="mt-4 font-display text-4xl">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-1">Last updated: {updated}</p>
        </header>

        <Section title="1. Data we collect">
          <p>We collect account information (email, display name, language), profile data you provide during onboarding (home country, target country, business type, budget, timeline), files you upload (passports, bank statements), and usage activity needed to operate the product.</p>
        </Section>

        <Section title="2. How we use your data">
          <p>To operate the platform, personalize country guidance and roadmaps, generate AI advice, calculate costs, and secure your account. We do not sell your personal data.</p>
        </Section>

        <Section title="3. Third-party services">
          <ul className="list-disc pl-5 space-y-1">
            <li>Lovable Cloud / Supabase — authentication, database, storage</li>
            <li>Finnhub, CoinGecko, ExchangeRate-API, World Bank — public market and country data feeds</li>
            <li>Lovable AI Gateway — model inference for the AI assistant</li>
          </ul>
          <p className="mt-2">These providers receive only the data necessary to serve the requested feature.</p>
        </Section>

        <Section title="4. Your rights">
          <p>You may access, update, export, or delete your account data at any time from Settings, or by contacting us at <a className="text-neon" href="mailto:privacy@bspot-ai.lovable.app">privacy@bspot-ai.lovable.app</a>.</p>
        </Section>

        <Section title="5. Security">
          <p>Data is encrypted in transit (TLS) and at rest. Sensitive documents are stored in private buckets with time-limited signed URLs. Row-level security restricts every record to its owner.</p>
        </Section>

        <Section title="6. Contact">
          <p>Questions: <a className="text-neon" href="mailto:privacy@bspot-ai.lovable.app">privacy@bspot-ai.lovable.app</a></p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel p-6 space-y-2">
      <h2 className="font-display text-xl">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}
