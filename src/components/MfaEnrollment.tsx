import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, ShieldOff, Smartphone } from "lucide-react";
import { toast } from "sonner";

type Factor = { id: string; friendly_name?: string | null; factor_type: string; status: string };

export function MfaEnrollment() {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [qr, setQr] = useState<{ id: string; uri: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) toast.error(error.message);
    setFactors((data?.totp ?? []) as Factor[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const startEnroll = async () => {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Authenticator ${new Date().toLocaleDateString()}`,
    });
    setEnrolling(false);
    if (error) return toast.error(error.message);
    if (data) setQr({ id: data.id, uri: data.totp.uri, secret: data.totp.secret });
  };

  const verify = async () => {
    if (!qr) return;
    if (code.length !== 6) return toast.error("Enter the 6-digit code");
    setVerifying(true);
    const { data: chal, error: e1 } = await supabase.auth.mfa.challenge({ factorId: qr.id });
    if (e1 || !chal) { setVerifying(false); return toast.error(e1?.message || "Challenge failed"); }
    const { error: e2 } = await supabase.auth.mfa.verify({ factorId: qr.id, challengeId: chal.id, code });
    setVerifying(false);
    if (e2) return toast.error(e2.message);
    toast.success("Two-factor authentication enabled");
    setQr(null);
    setCode("");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) return toast.error(error.message);
    toast.success("Authenticator removed");
    load();
  };

  if (loading) return <Loader2 className="h-4 w-4 animate-spin text-neon" />;

  const verified = factors.filter((f) => f.status === "verified");

  return (
    <div className="space-y-3">
      {verified.length > 0 ? (
        <div className="space-y-2">
          {verified.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-2 panel p-3">
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-neon" />
                <span>{f.friendly_name || "Authenticator app"}</span>
                <span className="text-[10px] font-mono uppercase text-muted-foreground">{f.factor_type}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => remove(f.id)}>
                <ShieldOff className="h-3 w-3 mr-1" /> Remove
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">No two-factor methods enabled yet.</div>
      )}

      {qr ? (
        <div className="panel p-4 space-y-3">
          <p className="text-sm font-medium">Scan with Google Authenticator / 1Password / Authy</p>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr.uri)}`}
            alt="MFA QR code"
            className="bg-white p-2 rounded"
            width={200}
            height={200}
          />
          <div className="text-[11px] font-mono text-muted-foreground break-all">
            Manual key: {qr.secret}
          </div>
          <div>
            <Label>Enter the 6-digit code</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={verify} disabled={verifying || code.length !== 6}>
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & enable"}
            </Button>
            <Button variant="outline" onClick={() => { setQr(null); setCode(""); }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button onClick={startEnroll} disabled={enrolling} variant="outline">
          {enrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4 mr-2" />}
          {verified.length > 0 ? "Add another authenticator" : "Set up authenticator app"}
        </Button>
      )}

      <p className="text-[11px] text-muted-foreground">
        SMS-based 2FA requires connecting a Twilio account at the project level. Authenticator app (TOTP) works for everyone with no setup cost.
      </p>
    </div>
  );
}
