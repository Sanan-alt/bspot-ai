import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Mail, RefreshCw, Send, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/use-credits";
import { verifyOwnerFn } from "@/lib/credits.functions";
import {
  listEmailLogFn,
  sendTestEmailFn,
  retryDlqFn,
} from "@/lib/email-admin.functions";

export const Route = createFileRoute("/app/admin/emails")({
  component: EmailsAdminPage,
});

type Row = {
  id: string;
  message_id: string | null;
  template_name: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  created_at: string;
};

type Stats = Record<string, number>;

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "sent") return "default";
  if (status === "pending") return "secondary";
  if (status === "dlq" || status === "failed" || status === "bounced" || status === "complained") return "destructive";
  return "outline";
}

function EmailsAdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOwner, loading: credLoading } = useCredits();
  const [serverVerified, setServerVerified] = useState<"pending" | "ok" | "denied">("pending");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await verifyOwnerFn();
        if (!cancelled) setServerVerified("ok");
      } catch {
        if (cancelled) return;
        setServerVerified("denied");
        toast.error("Owner access only");
        navigate({ to: "/app" });
      }
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  const [rows, setRows] = useState<Row[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [templateFilter, setTemplateFilter] = useState<string>("");
  const [testEmail, setTestEmail] = useState<string>(user?.email ?? "");
  const [sending, setSending] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const templates = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => s.add(r.template_name));
    return Array.from(s).sort();
  }, [rows]);

  async function load() {
    setLoading(true);
    try {
      const res = await listEmailLogFn({
        data: {
          limit: 200,
          status: statusFilter || null,
          template: templateFilter || null,
        },
      });
      setRows(res.rows as Row[]);
      setStats(res.stats as Stats);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load email log");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (serverVerified === "ok") load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverVerified, statusFilter, templateFilter]);

  async function sendTest() {
    if (!testEmail || !/^\S+@\S+\.\S+$/.test(testEmail)) {
      toast.error("Enter a valid email");
      return;
    }
    setSending(true);
    try {
      const res = await sendTestEmailFn({ data: { recipientEmail: testEmail } });
      toast.success(`Queued · ${res.messageId}`);
      setTimeout(load, 1500);
    } catch (e: any) {
      toast.error(e?.message ?? "Send failed");
    } finally {
      setSending(false);
    }
  }

  async function retryDlq(queue: "transactional_emails" | "auth_emails") {
    setRetrying(true);
    try {
      const res = await retryDlqFn({ data: { queue, max: 25 } });
      toast.success(`Re-queued ${res.requeued} of ${res.scanned} from ${queue}_dlq`);
      setTimeout(load, 1500);
    } catch (e: any) {
      toast.error(e?.message ?? "Retry failed");
    } finally {
      setRetrying(false);
    }
  }

  if (credLoading || serverVerified !== "ok" || !isOwner) {
    return (
      <div className="grid place-items-center h-64">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const cards = [
    { label: "Total", value: stats.total ?? 0, icon: Mail },
    { label: "Sent", value: stats.sent ?? 0, icon: CheckCircle2 },
    { label: "Pending", value: stats.pending ?? 0, icon: Clock },
    { label: "Failed / DLQ", value: (stats.dlq ?? 0) + (stats.failed ?? 0), icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// EMAIL OPERATIONS</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl flex items-center gap-3">
          <Mail className="h-8 w-8 text-neon" /> Email Monitoring
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Queued, sent, and failed emails for <code>notify.bspot.info</code>. Retry DLQ items and send a verification test.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{label}</span>
              <Icon className="h-4 w-4" />
            </div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="font-medium flex items-center gap-2"><Send className="h-4 w-4" /> Send verification test</div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <Label htmlFor="testEmail" className="text-xs text-muted-foreground">Recipient</Label>
            <Input id="testEmail" type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="self-end flex gap-2">
            <Button onClick={sendTest} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="ml-2">Send test</span>
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Uses the <code>test-verification</code> template. The send is queued and the result is logged below.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">Status</Label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-40 rounded-md border bg-background p-2 text-sm"
            >
              <option value="">All</option>
              <option value="sent">Sent</option>
              <option value="pending">Pending</option>
              <option value="dlq">DLQ</option>
              <option value="failed">Failed</option>
              <option value="suppressed">Suppressed</option>
              <option value="bounced">Bounced</option>
              <option value="complained">Complained</option>
            </select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Template</Label>
            <select
              value={templateFilter}
              onChange={(e) => setTemplateFilter(e.target.value)}
              className="block w-48 rounded-md border bg-background p-2 text-sm"
            >
              <option value="">All</option>
              {templates.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex-1" />
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Refresh</span>
          </Button>
          <Button variant="secondary" onClick={() => retryDlq("transactional_emails")} disabled={retrying}>
            Retry app DLQ
          </Button>
          <Button variant="secondary" onClick={() => retryDlq("auth_emails")} disabled={retrying}>
            Retry auth DLQ
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">When</th>
                <th className="py-2 pr-4">Template</th>
                <th className="py-2 pr-4">Recipient</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Error</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t align-top">
                  <td className="py-2 pr-4 whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4">{r.template_name}</td>
                  <td className="py-2 pr-4">{r.recipient_email}</td>
                  <td className="py-2 pr-4">
                    <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                  </td>
                  <td className="py-2 pr-4 text-xs text-destructive max-w-[360px]">
                    {r.error_message ? <span title={r.error_message}>{r.error_message}</span> : "—"}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">
                    No email events yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
