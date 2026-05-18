import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Save, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { LanguageSelector } from "@/components/LanguageSelector";

export const Route = createFileRoute("/app/settings")({ component: SettingsPage });

const PREF_KEYS = {
  emailAlerts: "bspot.pref.emailAlerts",
  pushAlerts: "bspot.pref.pushAlerts",
  aiTips: "bspot.pref.aiTips",
} as const;

function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [aiTips, setAiTips] = useState(true);
  const [pw, setPw] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
      setDisplayName(data?.display_name ?? "");
      setEmailAlerts(localStorage.getItem(PREF_KEYS.emailAlerts) !== "0");
      setPushAlerts(localStorage.getItem(PREF_KEYS.pushAlerts) !== "0");
      setAiTips(localStorage.getItem(PREF_KEYS.aiTips) !== "0");
      setLoading(false);
    })();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    localStorage.setItem(PREF_KEYS.emailAlerts, emailAlerts ? "1" : "0");
    localStorage.setItem(PREF_KEYS.pushAlerts, pushAlerts ? "1" : "0");
    localStorage.setItem(PREF_KEYS.aiTips, aiTips ? "1" : "0");
    toast.success("Settings saved");
  };

  const changePassword = async () => {
    if (pw.length < 8) return toast.error("Password must be at least 8 characters");
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    setPw("");
  };

  if (loading) {
    return <div className="p-10 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-neon" /></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">// SETTINGS</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">Settings</h1>
      </div>

      <section className="panel p-5 space-y-4">
        <h2 className="font-display text-lg">Profile</h2>
        <div><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
        <div><Label>Display name</Label><Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" /></div>
        <div><Label>Language</Label><div className="mt-1"><LanguageSelector /></div></div>
      </section>

      <section className="panel p-5 space-y-4">
        <h2 className="font-display text-lg">Notifications</h2>
        <Row label="Email alerts" desc="Receive important updates by email">
          <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
        </Row>
        <Row label="Push alerts" desc="In-app notifications and realtime updates">
          <Switch checked={pushAlerts} onCheckedChange={setPushAlerts} />
        </Row>
        <Row label="AI tips & insights" desc="Periodic suggestions from the assistant">
          <Switch checked={aiTips} onCheckedChange={setAiTips} />
        </Row>
      </section>

      <section className="panel p-5 space-y-4">
        <h2 className="font-display text-lg flex items-center gap-2"><Shield className="h-4 w-4 text-neon" /> Security</h2>
        <div className="flex gap-2 items-end">
          <div className="flex-1"><Label>New password</Label><Input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Min 8 characters" /></div>
          <Button variant="outline" onClick={changePassword}>Update</Button>
        </div>
      </section>

      <div className="flex gap-2">
        <Button onClick={saveProfile} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
        </Button>
        <Button variant="outline" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      {children}
    </div>
  );
}
