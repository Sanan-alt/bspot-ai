import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Loader2, Save, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/app/converter")({ component: ConverterPage });

const CURRENCIES = [
  "USD","EUR","GBP","JPY","CHF","AUD","CAD","CNY","INR","PKR","IRR","BRL","MXN","ZAR","NGN","EGP","TRY","SEK","NOK","DKK","PLN","CZK","HUF","SGD","HKD","KRW","NZD","AED","SAR","THB","IDR","MYR","PHP","VND","RUB","UAH",
];

async function fetchRate(from: string, to: string): Promise<number> {
  const r = await fetch(`https://api.exchangerate.host/convert?from=${from}&to=${to}`);
  const j = await r.json();
  if (typeof j?.result === "number") return j.result;
  // fallback
  const r2 = await fetch(`https://open.er-api.com/v6/latest/${from}`);
  const j2 = await r2.json();
  const rate = j2?.rates?.[to];
  if (!rate) throw new Error("Rate unavailable");
  return rate;
}

function ConverterPage() {
  const { user } = useAuth();
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [amount, setAmount] = useState<string>("100");
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fromPerUsd, setFromPerUsd] = useState<number | null>(null);
  const [toPerUsd, setToPerUsd] = useState<number | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await fetchRate(from, to);
      setRate(r);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [from, to]);

  // Independent USD strength fetch — used for the comparison panel
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [f, t] = await Promise.all([
          from === "USD" ? Promise.resolve(1) : fetchRate("USD", from),
          to === "USD" ? Promise.resolve(1) : fetchRate("USD", to),
        ]);
        if (!cancelled) { setFromPerUsd(f); setToPerUsd(t); }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [from, to]);

  const amt = parseFloat(amount) || 0;
  const converted = rate ? amt * rate : 0;

  // Strength comparison: lower units-per-USD = stronger currency.
  const strength = useMemo(() => {
    if (!fromPerUsd || !toPerUsd) return null;
    const fromStrongerPct = ((toPerUsd / fromPerUsd) - 1) * 100; // >0 = from is stronger
    const stronger = fromStrongerPct >= 0 ? from : to;
    const weaker = fromStrongerPct >= 0 ? to : from;
    const magnitude = Math.abs(fromStrongerPct);
    // Normalize to a 0-100 "strength index" relative to USD baseline (USD = 50)
    const idx = (v: number) => {
      if (!v) return 0;
      // log scale so 1 unit/USD maps high, large units/USD map low
      const score = 50 - Math.log10(v) * 18;
      return Math.max(1, Math.min(99, Math.round(score)));
    };
    return {
      fromStrongerPct,
      stronger,
      weaker,
      magnitude,
      fromIdx: idx(fromPerUsd),
      toIdx: idx(toPerUsd),
    };
  }, [fromPerUsd, toPerUsd, from, to]);

  const swap = () => { setFrom(to); setTo(from); };

  const save = async () => {
    if (!user || !rate) return;
    setSaving(true);
    try {
      let usd_value: number | null = null;
      if (from === "USD") usd_value = amt;
      else {
        try { const r = await fetchRate(from, "USD"); usd_value = amt * r; } catch { /* ignore */ }
      }
      const { error } = await supabase.from("conversions").insert({
        user_id: user.id,
        from_currency: from,
        to_currency: to,
        amount: amt,
        exchange_rate: rate,
        converted_amount: converted,
        usd_value,
      });
      if (error) throw error;
      toast.success("Saved to history");
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// CURRENCY CONVERTER</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">Live FX Converter</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time rates · save runs to history</p>
      </div>

      <div className="panel-neon p-6 space-y-5">
        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
          <div className="space-y-2">
            <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">From</Label>
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="font-mono text-lg" />
          </div>
          <Button variant="outline" size="icon" onClick={swap} className="mb-1 hover:text-neon" aria-label="Swap">
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
          <div className="space-y-2">
            <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">To</Label>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <div className="terminal px-3 py-2 text-lg truncate">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : converted.toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </div>
          </div>
        </div>

        <div className="neon-divider" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="font-mono text-xs text-muted-foreground">
            1 {from} = <span className="text-neon">{rate ? rate.toFixed(6) : "—"}</span> {to}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={refresh} disabled={loading}>Refresh</Button>
            <Button onClick={save} disabled={!rate || saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
