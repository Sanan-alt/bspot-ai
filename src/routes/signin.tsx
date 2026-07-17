import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AuthShell, Divider, Field } from "./signup";

export const Route = createFileRoute("/signin")({
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" && s.next.startsWith("/") && !s.next.startsWith("//") ? s.next : undefined,
  }),
  component: SignIn,
});


function SignIn() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const dest = next ?? "/app";
  const [email, setEmail] = useState("");

  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function hashEmail(email: string): Promise<string> {
    const buf = new TextEncoder().encode(email.trim().toLowerCase());
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  async function handle(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const emailHash = await hashEmail(email);
    // Check lockout first
    const { data: lock } = await supabase.rpc("check_login_lockout", { p_email_hash: emailHash });
    if (lock && (lock as { locked: boolean }).locked) {
      setLoading(false);
      return setErr("Too many failed attempts. Please wait 15 minutes before trying again.");
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    // Record attempt regardless of outcome
    const { data: rec } = await supabase.rpc("record_login_attempt", { p_email_hash: emailHash, p_success: !error });
    setLoading(false);
    if (error) {
      const r = rec as { locked?: boolean; fail_count?: number } | null;
      if (r?.locked) return setErr("Too many failed attempts. Account locked for 15 minutes.");
      const remaining = 5 - (r?.fail_count ?? 0);
      return setErr(`${error.message}${remaining > 0 && remaining < 5 ? ` (${remaining} attempt${remaining === 1 ? "" : "s"} left)` : ""}`);
    }
    toast.success("Welcome back to the grid");
    navigate({ to: "/app" });
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/app` });
    if (r.error) toast.error(r.error.message);
  }

  async function demo() {
    setErr(null);
    setDemoLoading(true);
    const { error } = await supabase.auth.signInAnonymously({
      options: { data: { display_name: "Demo Guest" } },
    });
    setDemoLoading(false);
    if (error) return setErr(error.message);
    toast.success("Demo session started — explore freely");
    navigate({ to: "/app" });
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your BSpot account">
      <form onSubmit={handle} className="space-y-4">
        <Field label="Email" type="email" value={email} onChange={setEmail} required />
        <Field label="Password" type="password" value={pw} onChange={setPw} required />
        {err && <div className="text-sm text-destructive font-mono">{err}</div>}
        <button disabled={loading} className="w-full bg-primary text-primary-foreground font-mono uppercase tracking-widest py-3 rounded-md glow disabled:opacity-50 inline-flex items-center justify-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Sign In
        </button>
      </form>
      <Divider />
      <div className="space-y-2">
        <button onClick={google} className="w-full border border-border py-3 rounded-md font-mono uppercase text-xs tracking-widest hover:border-primary hover:text-neon">
          Continue with Google
        </button>
        <button
          onClick={demo}
          disabled={demoLoading}
          className="w-full border border-primary/50 bg-primary/5 py-3 rounded-md font-mono uppercase text-xs tracking-widest hover:bg-primary/10 hover:text-neon inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {demoLoading && <Loader2 className="h-4 w-4 animate-spin" />} Try Demo (no signup)
        </button>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here? <Link to="/signup" className="text-neon hover:underline">Create an account</Link>
      </p>
    </AuthShell>
  );
}

