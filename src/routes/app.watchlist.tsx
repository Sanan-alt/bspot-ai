import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Star, Plus, Trash2, Bell, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/app/watchlist")({ component: WatchlistPage });

type Item = {
  id: string;
  symbol: string;
  kind: string;
  label: string | null;
  alert_above: number | null;
  alert_below: number | null;
};

const POPULAR = [
  { symbol: "USD/PKR", kind: "currency" },
  { symbol: "EUR/USD", kind: "currency" },
  { symbol: "GBP/USD", kind: "currency" },
  { symbol: "USD/IRR", kind: "currency" },
  { symbol: "BTC", kind: "crypto" },
  { symbol: "ETH", kind: "crypto" },
  { symbol: "AAPL", kind: "stock" },
  { symbol: "TSLA", kind: "stock" },
];

function WatchlistPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [kind, setKind] = useState("currency");
  const [prices, setPrices] = useState<Record<string, number>>({});

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("watchlists" as never)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as Item[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // mock live prices — replace with real provider later
    const tick = () => {
      setPrices((p) => {
        const next = { ...p };
        for (const it of items) {
          const base = next[it.id] ?? 100 + Math.random() * 200;
          next[it.id] = +(base * (1 + (Math.random() - 0.5) * 0.01)).toFixed(4);
        }
        return next;
      });
    };
    tick();
    const id = setInterval(tick, 2500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, items.length]);

  const add = async (sym: string, k: string) => {
    if (!user || !sym.trim()) return;
    setAdding(true);
    const { error } = await supabase
      .from("watchlists" as never)
      .insert({ user_id: user.id, symbol: sym.trim().toUpperCase(), kind: k } as never);
    setAdding(false);
    if (error) return toast.error(error.message);
    toast.success(`${sym} added to watchlist`);
    setSymbol("");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("watchlists" as never).delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems((x) => x.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// WATCHLIST</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl flex items-center gap-3">
          <Star className="h-8 w-8 text-neon" /> Your Watchlist
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Track currencies, crypto, and stocks. Live updates every few seconds.</p>
      </motion.div>

      <section className="panel p-6">
        <h2 className="font-display text-lg mb-4">Add new symbol</h2>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-5">
            <Label className="text-xs">Symbol</Label>
            <Input placeholder="e.g. USD/PKR, BTC, AAPL" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
          </div>
          <div className="col-span-6 md:col-span-3">
            <Label className="text-xs">Type</Label>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="currency">Currency</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
                <SelectItem value="stock">Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-6 md:col-span-4 flex items-end">
            <Button onClick={() => add(symbol, kind)} disabled={adding || !symbol.trim()} className="glow w-full">
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Add</>}
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-2">// Popular</div>
          <div className="flex flex-wrap gap-2">
            {POPULAR.map((p) => (
              <button
                key={p.symbol}
                onClick={() => add(p.symbol, p.kind)}
                className="text-xs px-2 py-1 rounded border border-border hover:border-neon hover:text-neon transition"
              >
                + {p.symbol}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="panel p-6">
        <h2 className="font-display text-lg mb-4">Tracked ({items.length})</h2>
        {loading ? (
          <div className="grid place-items-center h-32"><Loader2 className="h-6 w-6 animate-spin text-neon" /></div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No symbols yet. Add one above to get started.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((it) => {
              const price = prices[it.id];
              const up = (price ?? 0) > 100;
              return (
                <div key={it.id} className="panel p-4 flex items-center justify-between hover:panel-neon transition">
                  <div>
                    <div className="font-display text-lg text-neon">{it.symbol}</div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{it.kind}</div>
                    <div className="mt-2 font-mono text-sm flex items-center gap-1">
                      {price ? price.toFixed(4) : "—"}
                      {up ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button size="icon" variant="ghost" title="Set alert"><Bell className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(it.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
