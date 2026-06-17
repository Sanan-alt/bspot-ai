import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, KeyRound, Download, Copy, RefreshCw, Check } from "lucide-react";
import { toast } from "sonner";

export function RecoveryCodes() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ total: number; remaining: number }>({ total: 0, remaining: 0 });
  const [codes, setCodes] = useState<string[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("mfa_recovery_codes" as never)
      .select("used_at");
    const rows = (data ?? []) as { used_at: string | null }[];
    setStats({ total: rows.length, remaining: rows.filter((r) => !r.used_at).length });
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const generate = async () => {
    setGenerating(true);
    const { data, error } = await supabase.rpc("regenerate_mfa_recovery_codes" as never);
    setGenerating(false);
    if (error) return toast.error(error.message);
    setCodes((data as string[]) ?? []);
    toast.success("New recovery codes generated. Save them now — they won't be shown again.");
    load();
  };

  const copyAll = async () => {
    if (!codes) return;
    await navigator.clipboard.writeText(codes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    if (!codes) return;
    const blob = new Blob(
      [
        "BSpot AI — Two-factor backup recovery codes\n",
        `Generated: ${new Date().toISOString()}\n`,
        "Each code can be used once. Store them somewhere safe.\n\n",
        codes.join("\n"),
        "\n",
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bspot-recovery-codes-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Loader2 className="h-4 w-4 animate-spin text-neon" />;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-sm flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-neon" />
            Backup recovery codes
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {stats.total === 0
              ? "No codes generated yet. Create a set so you can sign in if you lose your authenticator."
              : `${stats.remaining} of ${stats.total} codes remaining.`}
            {stats.total > 0 && stats.remaining <= 2 && (
              <span className="text-amber-500"> Almost out — regenerate soon.</span>
            )}
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              {stats.total === 0 ? <KeyRound className="h-3 w-3 mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
              {stats.total === 0 ? "Generate" : "Regenerate"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {stats.total === 0 ? "Generate recovery codes?" : "Replace existing recovery codes?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {stats.total === 0
                  ? "You'll get 10 one-time codes. Each can be used once to sign in if you lose your authenticator."
                  : "All existing codes (including unused ones) will stop working. You'll get a fresh set of 10."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={generate} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {codes && (
        <div className="panel p-4 space-y-3 border-primary/40">
          <div className="text-xs text-amber-500 font-medium">
            ⚠ Save these now. After you leave this screen they cannot be shown again.
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-sm">
            {codes.map((c) => (
              <div key={c} className="px-2 py-1.5 rounded bg-muted/40 text-center tracking-widest">{c}</div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={copyAll}>
              {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
              {copied ? "Copied" : "Copy all"}
            </Button>
            <Button size="sm" variant="outline" onClick={download}>
              <Download className="h-3 w-3 mr-1" /> Download .txt
            </Button>
            <Button size="sm" onClick={() => setCodes(null)}>I've saved them</Button>
          </div>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        Use a recovery code on the sign-in 2FA prompt instead of your authenticator code. Each code works only once.
      </p>
    </div>
  );
}
