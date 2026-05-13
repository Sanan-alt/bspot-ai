import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("conversions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    else setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const exportCSV = () => {
    if (!rows.length) { toast.error("No data to export"); return; }
    const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bspot-conversions-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} rows`);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("conversions").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { setRows(r => r.filter(x => x.id !== id)); toast.success("Deleted"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// CONVERSION HISTORY</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Conversion Log</h1>
          <p className="text-sm text-muted-foreground mt-1">{rows.length} entries</p>
        </div>
        <Button onClick={exportCSV} className="gap-2"><Download className="h-4 w-4" /> Export CSV</Button>
      </div>

      <div className="panel-neon overflow-hidden">
        {loading ? (
          <div className="p-10 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-neon" /></div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No conversions yet. Save one from the Converter.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-mono text-[10px] uppercase tracking-widest">Date</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-widest">Pair</TableHead>
                <TableHead className="text-right font-mono text-[10px] uppercase tracking-widest">Amount</TableHead>
                <TableHead className="text-right font-mono text-[10px] uppercase tracking-widest">Rate</TableHead>
                <TableHead className="text-right font-mono text-[10px] uppercase tracking-widest">Converted</TableHead>
                <TableHead className="text-right font-mono text-[10px] uppercase tracking-widest">USD</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell className="font-mono"><span className="text-neon">{r.from_currency}</span> → {r.to_currency}</TableCell>
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
