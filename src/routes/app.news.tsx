import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NewsFeed } from "@/components/NewsFeed";
import { COUNTRIES } from "@/lib/countries-data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/app/news")({
  head: () => ({
    meta: [
      { title: "News — BSpot AI" },
      { name: "description", content: "Live market and country headlines relevant to your cross-border investment plans." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  const { user } = useAuth();
  const [country, setCountry] = useState<string>("");
  const [term, setTerm] = useState("");
  const [applied, setApplied] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("target_country").eq("id", user.id).maybeSingle();
      if (data?.target_country) setCountry(data.target_country);
    })();
  }, [user?.id]);

  const countryName = COUNTRIES.find((c) => c.code === country)?.name ?? country;

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// NEWS</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">Market &amp; country headlines</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Free live headlines for global markets and for the country you are targeting. Use it to sanity-check what
          moved before you act on a dossier or an alert. No credits are consumed here.
        </p>
      </div>

      <div className="panel p-4 flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1">
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Target country</label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Pick a country" /></SelectTrigger>
            <SelectContent className="max-h-72">
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Search a topic or ticker</label>
          <div className="mt-1 flex gap-2">
            <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="e.g. AAPL, gold, UAE golden visa"
              onKeyDown={(e) => { if (e.key === "Enter") setApplied(term.trim()); }} />
            <Button onClick={() => setApplied(term.trim())} className="shrink-0">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <NewsFeed topic="markets" limit={10} title="Global markets" />
        {applied ? (
          <NewsFeed topic="custom" query={applied} limit={10} title={`Search: ${applied}`} />
        ) : country ? (
          <NewsFeed topic="country" country={countryName} limit={10} title={`${countryName} business & economy`} />
        ) : (
          <NewsFeed topic="custom" query="investor visa OR company formation OR free zone" limit={10} title="Relocation & company setup" />
        )}
      </div>
    </div>
  );
}
