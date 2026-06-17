import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/community-guidelines")({
  component: GuidelinesPage,
  head: () => ({
    meta: [
      { title: "Community Guidelines — BSpot AI" },
      { name: "description", content: "Acceptable use and community standards for BSpot AI." },
    ],
    links: [{ rel: "canonical", href: "https://bspot-ai.lovable.app/community-guidelines" }],
  }),
});

function GuidelinesPage() {
  const updated = "June 17, 2026";
  return (
    <div className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-3xl space-y-8">
        <header>
          <Link to="/" className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-neon">← Back home</Link>
          <h1 className="mt-4 font-display text-4xl">Community Guidelines</h1>
          <p className="text-sm text-muted-foreground mt-1">Last updated: {updated}</p>
        </header>

        <Section title="Acceptable use">
          <p>BSpot AI is built for honest cross-border investors. Use the platform to research countries, plan businesses, and track your own journey. Respect other users and the integrity of public market data.</p>
        </Section>

        <Section title="Prohibited content & behavior">
          <ul className="list-disc pl-5 space-y-1">
            <li>Money laundering, sanctions evasion, or any unlawful capital movement</li>
            <li>Submitting forged documents or impersonating another person</li>
            <li>Scraping, reverse-engineering, or overloading the platform's APIs</li>
            <li>Sharing other users' personal data without consent</li>
            <li>Harassment, hate speech, or threats in any communication channel</li>
          </ul>
        </Section>

        <Section title="Reporting">
          <p>Report abuse or suspicious activity to <a className="text-neon" href="mailto:trust@bspot-ai.lovable.app">trust@bspot-ai.lovable.app</a>. Include the user, URL, and a short description.</p>
        </Section>

        <Section title="Enforcement">
          <p>Violations may result in warnings, temporary suspension, or permanent account termination. Serious or unlawful conduct will be reported to the relevant authorities.</p>
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
