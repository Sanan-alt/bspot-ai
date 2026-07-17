import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { COUNTRIES, COUNTRY_BY_CODE } from "@/lib/countries-data";
import { COUNTRY_DEEP } from "@/lib/country-deep";
import { VISA_PROGRAMS } from "@/lib/visa-programs";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Plane, Building2, Landmark } from "lucide-react";

const ALPHA2_TO_ALPHA3: Record<string, string> = {
  AE: "ARE", GB: "GBR", CA: "CAN", SG: "SGP", SA: "SAU",
  DE: "DEU", US: "USA", TR: "TUR", PT: "PRT", AU: "AUS",
};

export const Route = createFileRoute("/country/$code")({
  loader: ({ params }) => {
    const code = params.code.toUpperCase();
    const country = COUNTRY_BY_CODE[code];
    if (!country) throw notFound();
    const deepKey = ALPHA2_TO_ALPHA3[code];
    const deep = deepKey ? COUNTRY_DEEP[deepKey] : null;
    const visas = VISA_PROGRAMS[code] ?? [];
    return { country, deep, visas };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { country, deep } = loaderData;
    const title = `${country.name} — Setup Cost, Visa & Tax Guide | BSpot AI`;
    const description = deep
      ? `Start a business in ${country.name}: setup cost ${deep.setup_cost_range}, corporate tax ${deep.corporate_tax}, ${deep.visa_programs.length} visa pathways.`
      : `Explore ${country.name} as an investment destination — visas, taxes, and business setup for cross-border founders.`;
    const url = `https://www.bspot.info/country/${country.code}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: deep
        ? [{
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: title,
              description,
              about: country.name,
              url,
              publisher: { "@type": "Organization", name: "BSpot AI", url: "https://www.bspot.info" },
            }),
          }]
        : [],
    };
  },
  component: CountryPublicPage,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center p-8 text-center">
      <div>
        <h1 className="font-display text-3xl">Country not found</h1>
        <p className="text-muted-foreground mt-2">We don't have data on that country yet.</p>
        <Link to="/" className="text-neon underline mt-4 inline-block">Back home</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen grid place-items-center p-8 text-center">
      <div>
        <h1 className="font-display text-2xl">Something went wrong</h1>
        <p className="text-muted-foreground mt-2">{error.message}</p>
        <Button onClick={reset} className="mt-4">Retry</Button>
      </div>
    </div>
  ),
});

function CountryPublicPage() {
  const { country, deep, visas } = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{country.flag}</span>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
              // {country.region} · {country.currency}
            </p>
            <h1 className="font-display text-4xl md:text-5xl">{country.name}</h1>
          </div>
        </div>

        {deep ? (
          <>
            <div className="grid md:grid-cols-3 gap-3">
              <Info icon={Building2} label="Setup Cost (Year 1)" value={deep.setup_cost_range} />
              <Info icon={Landmark} label="Corporate Tax" value={deep.corporate_tax} />
              <Info icon={MapPin} label="Setup Time" value={deep.setup_time} />
            </div>

            <section>
              <h2 className="font-display text-2xl mb-3">Overview</h2>
              <p className="text-muted-foreground">{deep.recommended_for}</p>
              <p className="mt-3">{deep.laws_for_foreigners}</p>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-3 flex items-center gap-2"><Plane className="h-5 w-5 text-neon" /> Visa Programs</h2>
              <ul className="grid md:grid-cols-2 gap-3">
                {deep.visa_programs.map((v) => (
                  <li key={v.name} className="panel p-4">
                    <div className="font-display">{v.name}</div>
                    <p className="text-xs text-muted-foreground mt-1">{v.duration} · {v.type}</p>
                    <p className="text-xs mt-1">Min: {v.min_investment}</p>
                  </li>
                ))}
              </ul>
            </section>

            {deep.pro_tip && (
              <section className="panel-neon p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-neon mb-2">// BSpot Pro Tip</p>
                <p>{deep.pro_tip}</p>
              </section>
            )}
          </>
        ) : (
          <section>
            <p className="text-muted-foreground">
              We're preparing a full profile for {country.name}. In the meantime, explore related visa pathways below.
            </p>
          </section>
        )}

        {visas.length > 0 && (
          <section>
            <h2 className="font-display text-2xl mb-3">Curated Visa Pathways</h2>
            <ul className="space-y-2">
              {visas.map((v) => (
                <li key={v.name} className="panel p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-display text-sm">{v.name}</div>
                    <p className="text-xs text-muted-foreground">{v.category} · {v.duration} · {v.minInvestment}</p>
                  </div>
                  {v.pathToPR && <span className="text-[10px] font-mono px-2 py-1 border border-neon text-neon rounded">PR</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex flex-wrap gap-3 pt-6 border-t border-border">
          <Link to="/app/countries" search={{ code: country.code }}>
            <Button>Open full profile <ArrowRight className="h-4 w-4" /></Button>
          </Link>
          <Link to="/">
            <Button variant="outline">Back to home</Button>
          </Link>
        </div>

        <nav aria-label="Other countries" className="pt-8 border-t border-border">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">// Explore more</p>
          <ul className="flex flex-wrap gap-2">
            {COUNTRIES.slice(0, 20).filter(c => c.code !== country.code).map((c) => (
              <li key={c.code}>
                <Link to="/country/$code" params={{ code: c.code }} className="text-xs px-3 py-1.5 border border-border rounded hover:border-neon hover:text-neon">
                  {c.flag} {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="font-mono text-[10px] uppercase tracking-widest">{label}</span>
      </div>
      <p className="mt-2 font-display text-sm">{value}</p>
    </div>
  );
}
