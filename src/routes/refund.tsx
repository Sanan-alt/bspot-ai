import { createFileRoute, Link } from "@tanstack/react-router";
import { NeonLogo } from "@/components/NeonLogo";
import { SiteFooter } from "@/components/SiteFooter";

const OG_IMAGE = "https://bspot.info/__l5e/assets-v1/f64266aa-1489-436a-9b59-75bdc6a1acf4/og-share.png";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund Policy — BSpot AI" },
      { name: "description", content: "BSpot AI's refund policy for credit purchases and subscriptions." },
      { property: "og:title", content: "Refund Policy — BSpot AI" },
      { property: "og:url", content: "https://bspot.info/refund" },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: "https://bspot.info/refund" }],
  }),
  component: RefundPage,
});

function RefundPage() {
  return (
    <div>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <NeonLogo />
          <Link to="/" className="font-mono text-xs uppercase tracking-widest hover:text-neon">← Home</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-16 space-y-8">
        <header>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// LEGAL</p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl">Refund Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: June 19, 2026</p>
        </header>

        <Section title="1. 14-day refund window">
          <p>You can request a full refund on any credit pack within <strong>14 days</strong> of purchase, provided you have used less than 20% of the credits in that pack. Refunds are issued to the original payment method within 5–10 business days.</p>
        </Section>

        <Section title="2. Used credits">
          <p>Credits that have already been spent on AI generations, dossiers, or other paid actions are non-refundable. We will calculate the unused portion and refund that pro-rata where applicable.</p>
        </Section>

        <Section title="3. Subscription plans">
          <p>Monthly subscriptions can be cancelled any time and will remain active until the end of the current billing cycle. We do not pro-rate refunds on partial months unless required by your local consumer law.</p>
        </Section>

        <Section title="4. Failed or duplicate charges">
          <p>If you were charged twice, or a transaction failed but funds were captured, contact us immediately at <a className="text-neon" href="mailto:bspot.ai.official@gmail.com">bspot.ai.official@gmail.com</a> with the transaction ID. We will reverse the charge within 3 business days.</p>
        </Section>

        <Section title="5. Chargebacks">
          <p>Please contact us before initiating a chargeback — most issues are resolved within a single email. Accounts with disputed chargebacks may be suspended pending review.</p>
        </Section>

        <Section title="6. How to request a refund">
          <p>Email <a className="text-neon" href="mailto:bspot.ai.official@gmail.com">bspot.ai.official@gmail.com</a> with the subject "Refund request" and include your account email and the transaction ID from your invoice.</p>
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
