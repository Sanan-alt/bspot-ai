import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Loader2, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/app/history")({ component: HistoryPage });

type Row = {
  id: string;
  from_currency: string;
  to_currency: string;
  amount: number;
  exchange_rate: number;
  converted_amount: number;
  usd_value: number | null;
  created_at: string;
};

type SortKey = "created_at" | "from_currency" | "to_currency" | "amount" | "exchange_rate" | "converted_amount" | "usd_value";
type SortDir = "asc" | "desc";

function toCSV(rows: Row[]): string {
  const headers = ["created_at","from_currency","to_currency","amount","exchange_rate","converted_amount","usd_value"];
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = rows.map(r => headers.map(h => escape((r as unknown as Record<string, unknown>)[h])).join(","));
  return [headers.join(","), ...body].join("\n");
}

function HistoryPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("conversions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) toast.error(error.message);
    else setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const filtered = useMemo(() => {
    const fromTs = from ? new Date(from + "T00:00:00").getTime() : null;
    const toTs = to ? new Date(to + "T23:59:59").getTime() : null;
    const term = q.trim().toLowerCase();
    return rows.filter(r => {
      const ts = new Date(r.created_at).getTime();
      if (fromTs && ts < fromTs) return false;
      if (toTs && ts > toTs) return false;
      if (term) {
        const pair = `${r.from_currency} ${r.to_currency} ${r.from_currency}/${r.to_currency}`.toLowerCase();
        if (!pair.includes(term)) return false;
      }
      return true;
    });
  }, [rows, q, from, to]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = a[sortKey] as number | string | null;
      const bv = b[sortKey] as number | string | null;
      if (av === null) return 1;
      if (bv === null) return -1;
      if (sortKey === "created_at") {
        const d = new Date(av as string).getTime() - new Date(bv as string).getTime();
        return sortDir === "asc" ? d : -d;
      }
      if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir(key === "created_at" ? "desc" : "asc"); }
  };

  const exportCSV = () => {
    if (!sorted.length) { toast.error("No rows match the current filters"); return; }
    const blob = new Blob([toCSV(sorted)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const range = from || to ? `_${from || "start"}_to_${to || "now"}` : "";
    a.download = `bspot-conversions${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${sorted.length} rows`);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("conversions").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { setRows(r => r.filter(x => x.id !== id)); toast.success("Deleted"); }
  };

  const clearFilters = () => { setQ(""); setFrom(""); setTo(""); };
  const hasFilters = q || from || to;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// CONVERSION HISTORY</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Conversion Log</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="text-neon">{sorted.length}</span> shown · {rows.length} total
          </p>
        </div>
        <Button onClick={exportCSV} className="gap-2"><Download className="h-4 w-4" /> Export CSV</Button>
      </div>

      <div className="panel-neon p-4 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search currency pair (e.g. USD, EUR)…" className="pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">From</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[150px]" />
        </div>
        <div className="flex items-center gap-2">
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">To</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[150px]" />
        </div>
        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters} className="gap-2"><X className="h-4 w-4" /> Clear</Button>
        )}
      </div>

      <div className="panel-neon overflow-hidden">
        {loading ? (
          <div className="p-10 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-neon" /></div>
        ) : sorted.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            {rows.length === 0 ? "No conversions yet. Save one from the Converter." : "No rows match the current filters."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <SortHead label="Date" k="created_at" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <SortHead label="From" k="from_currency" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <SortHead label="To" k="to_currency" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <SortHead label="Amount" k="amount" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                <SortHead label="Rate" k="exchange_rate" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                <SortHead label="Converted" k="converted_amount" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                <SortHead label="USD" k="usd_value" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell className="font-mono text-neon">{r.from_currency}</TableCell>
                  <TableCell className="font-mono">{r.to_currency}</TableCell>
                  <TableCell className="text-right font-mono">{Number(r.amount).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">{Number(r.exchange_rate).toFixed(4)}</TableCell>
                  <TableCell className="text-right font-mono">{Number(r.converted_amount).toLocaleString(undefined,{maximumFractionDigits:4})}</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">{r.usd_value ? `$${Number(r.usd_value).toLocaleString(undefined,{maximumFractionDigits:2})}` : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => remove(r.id)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function SortHead({
  label, k, sortKey, sortDir, onClick, align,
}: { label: string; k: SortKey; sortKey: SortKey; sortDir: SortDir; onClick: (k: SortKey) => void; align?: "right" }) {
  const active = sortKey === k;
  const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead className={align === "right" ? "text-right" : ""}>
      <button
        onClick={() => onClick(k)}
        className={`inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest hover:text-neon ${active ? "text-neon" : ""}`}
      >
        {label}
        <Icon className="h-3 w-3" />
      </button>
    </TableHead>
  );
}
