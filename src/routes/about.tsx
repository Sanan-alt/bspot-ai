import { createFileRoute, Link } from "@tanstack/react-router";
import { NeonLogo } from "@/components/NeonLogo";
import { SiteFooter } from "@/components/SiteFooter";
import { Target, Compass, Users, Sparkles } from "lucide-react";

const OG_IMAGE = "https://www.bspot.info/__l5e/assets-v1/f64266aa-1489-436a-9b59-75bdc6a1acf4/og-share.png";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About BSpot AI — Built for Cross-Border Investors" },
      { name: "description", content: "BSpot AI helps South Asian and African investors plan, fund, and execute cross-border businesses with AI-powered country intelligence." },
      { property: "og:title", content: "About BSpot AI" },
      { property: "og:description", content: "The story behind BSpot AI and the team building it." },
      { property: "og:url", content: "https://www.bspot.info/about" },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: "https://www.bspot.info/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <NeonLogo />
          <Link to="/" className="font-mono text-xs uppercase tracking-widest hover:text-neon">← Home</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-16 space-y-12">
        <section>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// ABOUT</p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl">Built for investors crossing <span className="text-neon">borders</span>.</h1>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            BSpot AI is investment intelligence for people the global financial system overlooks — entrepreneurs and professionals in South Asia, Africa, and emerging markets who want to deploy capital across borders, set up businesses abroad, and secure a second residency without paying a $30,000 consultant fee for information that should be free.
          </p>
        </section>

        <div className="grid md:grid-cols-2 gap-5">
          {[
            { icon: Target, title: "Our Mission", body: "Democratize cross-border investment planning so that anyone with a laptop can understand visa, tax, and capital rules as well as a top-tier advisor." },
            { icon: Compass, title: "Our Approach", body: "Live data + AI synthesis. Every number is sourced; every recommendation explains itself." },
            { icon: Users, title: "Who It's For", body: "Founders, freelancers, traders, and families planning a move to the US, UK, Germany, Canada, UAE, and more." },
            { icon: Sparkles, title: "Why We're Different", body: "No commission. No referral fees. You get the same advice a paying consultant would give — without the upsell." },
          ].map((b) => (
            <div key={b.title} className="panel p-5">
              <b.icon className="h-6 w-6 text-neon" />
              <h2 className="mt-3 font-display text-xl">{b.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.body}</p>
            </div>
          ))}
        </div>

        <section className="panel-neon p-6">
          <h2 className="font-display text-2xl">The Team</h2>
          <p className="mt-2 text-sm text-muted-foreground">BSpot AI is built by Team ApexMinds — a group of students, developers, and AI engineers backed by Aptech Learning and supported by Hackroid.</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
