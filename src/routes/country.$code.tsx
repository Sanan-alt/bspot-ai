import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { COUNTRIES, COUNTRY_BY_CODE } from "@/lib/countries-data";
import { COUNTRY_DEEP } from "@/lib/country-deep";
import { VISA_PROGRAMS } from "@/lib/visa-programs";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Plane, Building2, Landmark } from "lucide-react";
import { track } from "@/lib/telemetry";

const ALPHA2_TO_ALPHA3: Record<string, string> = {
  AE: "ARE", GB: "GBR", CA: "CAN", SG: "SGP", SA: "SAU",
  DE: "DEU", US: "USA", TR: "TUR", PT: "PRT", AU: "AUS",
};

type Country = (typeof COUNTRIES)[number];
type Deep = (typeof COUNTRY_DEEP)[keyof typeof COUNTRY_DEEP];
type Visa = import("@/lib/visa-programs").VisaProgram;
type Faq = { q: string; a: string };
type HowTo = { name: string; description: string; steps: { name: string; text: string }[] };

function buildFaqs(country: Country, deep: Deep | null, visas: Visa[]): Faq[] {
  const faqs: Faq[] = [];
  if (deep) {
    faqs.push({ q: `How much does it cost to start a business in ${country.name}?`, a: `Year-one setup typically ranges ${deep.setup_cost_range}. This covers registration, licensing, and initial compliance for a foreign-owned company.` });
    faqs.push({ q: `What is the corporate tax rate in ${country.name}?`, a: `${country.name} applies a corporate tax of ${deep.corporate_tax}. Personal income tax is ${deep.personal_income_tax}, and VAT/sales tax is ${deep.vat}.` });
    faqs.push({ q: `Can foreigners fully own a company in ${country.name}?`, a: deep.foreign_ownership });
    faqs.push({ q: `How long does incorporation take in ${country.name}?`, a: `Standard incorporation completes in about ${deep.setup_time}, assuming documents are in order.` });
  }
  if (visas.length || deep?.visa_programs.length) {
    const first = visas[0]?.name ?? deep?.visa_programs[0]?.name;
    faqs.push({ q: `Which visa is best for investors in ${country.name}?`, a: `Popular routes include ${(visas.length ? visas : deep?.visa_programs ?? []).slice(0, 3).map(v => (v as { name: string }).name).join(", ")}. ${first ? `The ${first} program is a common starting point.` : ""}` });
  }
  faqs.push({ q: `Is ${country.name} a good country for cross-border investment?`, a: `${country.name} scores well on our BSpot index for ${country.region} founders looking to diversify. Open the full profile for stability, growth, and risk scores.` });
  return faqs;
}

function buildHowTo(country: Country, deep: Deep | null): HowTo | null {
  if (!deep) return null;
  return {
    name: `How to start a business in ${country.name}`,
    description: `Step-by-step guide to incorporating and moving capital into ${country.name}.`,
    steps: [
      { name: "Choose the right entity", text: `Decide between mainland, free-zone, or offshore structures based on your activity. ${deep.foreign_ownership}` },
      { name: "Reserve a company name", text: `Submit 2-3 name options to the registrar. Names must comply with local naming conventions.` },
      { name: "Prepare KYC documents", text: `Notarized passport copies, proof of address, bank references, and a business plan for licensed activities.` },
      { name: "Submit incorporation", text: `File Memorandum & Articles with the registrar. Processing takes about ${deep.setup_time}.` },
      { name: "Open a corporate bank account", text: `Most banks require the director to be physically present for KYC. Prepare source-of-funds evidence.` },
      { name: "Register for tax & payroll", text: `Corporate tax ${deep.corporate_tax}, VAT ${deep.vat}. Register before invoicing customers.` },
    ],
  };
}


export const Route = createFileRoute("/country/$code")({
  loader: ({ params }) => {
    const code = params.code.toUpperCase();
    const country = COUNTRY_BY_CODE[code];
    if (!country) throw notFound();
    const deepKey = ALPHA2_TO_ALPHA3[code];
    const deep = deepKey ? COUNTRY_DEEP[deepKey] : null;
    const visas = VISA_PROGRAMS[code] ?? [];
    const faqs = buildFaqs(country, deep, visas);
    const howto = buildHowTo(country, deep);
    return { country, deep, visas, faqs, howto };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { country, deep, faqs, howto } = loaderData;
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
      scripts: [
        ...(deep ? [{
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
        }] : []),
        ...(faqs.length ? [{
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map(f => ({
              "@type": "Question", name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }] : []),
        ...(howto ? [{
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: howto.name,
            description: howto.description,
            step: howto.steps.map((s, i) => ({
              "@type": "HowToStep", position: i + 1, name: s.name, text: s.text,
            })),
          }),
        }] : []),
      ],
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
  const { country, deep, visas, faqs, howto } = Route.useLoaderData();
  useEffect(() => {
    track("country_page_view", { metadata: { code: country.code, name: country.name, hasDeep: !!deep } });
  }, [country.code]);
  const related = COUNTRIES.filter(c => c.code !== country.code && c.region === country.region).slice(0, 6);
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
                {deep.visa_programs.map((v: { name: string; duration: string; type: string; min_investment: string }) => (
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
              {visas.map((v: import("@/lib/visa-programs").VisaProgram) => (
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

        {howto && (
          <section>
            <h2 className="font-display text-2xl mb-3">{howto.name}</h2>
            <p className="text-sm text-muted-foreground mb-4">{howto.description}</p>
            <ol className="space-y-3">
              {howto.steps.map((s: { name: string; text: string }, i: number) => (
                <li key={s.name} className="panel p-4 flex gap-3">
                  <span className="font-display text-neon text-xl leading-none">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <div className="font-display text-sm">{s.name}</div>
                    <p className="text-sm text-muted-foreground mt-1">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {faqs.length > 0 && (
          <section>
            <h2 className="font-display text-2xl mb-3">Frequently Asked Questions</h2>
            <div className="space-y-2">
              {faqs.map((f) => (
                <details key={f.q} className="panel p-4 group">
                  <summary className="cursor-pointer font-display text-sm list-none flex items-center justify-between">
                    <span>{f.q}</span>
                    <span className="text-neon text-xs group-open:rotate-45 transition">+</span>
                  </summary>
                  <p className="text-sm text-muted-foreground mt-3">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-wrap gap-3 pt-6 border-t border-border">
          <Link to="/app/countries" search={{ code: country.code }}>
            <Button>Open full profile <ArrowRight className="h-4 w-4" /></Button>
          </Link>
          <Link to="/app/calculator"><Button variant="outline">Setup cost calculator</Button></Link>
          <Link to="/app/visa"><Button variant="outline">Compare visas</Button></Link>
          <Link to="/"><Button variant="outline">Back to home</Button></Link>
        </div>

        {related.length > 0 && (
          <nav aria-label={`Other ${country.region} countries`} className="pt-8 border-t border-border">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">// More in {country.region}</p>
            <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
              {related.map((c) => (
                <li key={c.code}>
                  <Link to="/country/$code" params={{ code: c.code }} className="panel p-3 flex items-center gap-2 hover:border-neon hover:text-neon transition">
                    <span className="text-xl">{c.flag}</span>
                    <div className="text-sm">
                      <div className="font-display">{c.name}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">Start a business in {c.name}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <nav aria-label="All countries" className="pt-8 border-t border-border">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">// Explore all destinations</p>
          <ul className="flex flex-wrap gap-2">
            {COUNTRIES.filter(c => c.code !== country.code).map((c) => (
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
