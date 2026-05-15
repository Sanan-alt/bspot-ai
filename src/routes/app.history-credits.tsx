import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ArrowDownCircle, ArrowUpCircle, Gift, ShoppingCart, Shield, RefreshCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/app/history-credits")({ component: CreditHistoryPage });

type Tx = {
  id: string;
  amount: number;
  type: string;
  feature: string | null;
  description: string | null;
  balance_after: number;
  created_at: string;
};

const TYPE_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  signup_bonus: { label: "Signup bonus", icon: Gift, tone: "text-neon" },
  weekly_reward: { label: "Weekly reward", icon: Gift, tone: "text-neon" },
  purchase: { label: "Purchase", icon: ShoppingCart, tone: "text-neon" },
  admin_grant: { label: "Admin grant", icon: Shield, tone: "text-neon" },
  refund: { label: "Refund", icon: RefreshCcw, tone: "text-neon" },
  usage: { label: "Usage", icon: ArrowDownCircle, tone: "text-destructive" },
};

function CreditHistoryPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("credit_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      setRows((data ?? []) as Tx[]);
      setLoading(false);
    })();
    const ch = supabase
      .channel(`credit_tx:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "credit_transactions", filter: `user_id=eq.${user.id}` },
        (payload) => setRows((r) => [payload.new as Tx, ...r]),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// CREDIT HISTORY</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">Credits & Transactions</h1>
        <p className="text-sm text-muted-foreground mt-1">Every grant, purchase, deduction and reward.</p>
      </div>

      <div className="panel-neon overflow-hidden">
        {loading ? (
          <div className="p-10 grid place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-neon" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No transactions yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const meta = TYPE_META[r.type] ?? { label: r.type, icon: ArrowUpCircle, tone: "text-muted-foreground" };
                const Icon = meta.icon;
                const positive = r.amount >= 0;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest ${meta.tone}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {meta.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.feature ? <span className="font-mono text-xs">{r.feature}</span> : null}
                      {r.description ? <span className="block">{r.description}</span> : null}
                    </TableCell>
                    <TableCell className={`text-right font-mono ${positive ? "text-neon" : "text-destructive"}`}>
                      {positive ? "+" : ""}
                      {r.amount}
                    </TableCell>
                    <TableCell className="text-right font-mono">{r.balance_after}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
