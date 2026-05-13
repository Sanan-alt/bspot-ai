import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { NeonLogo } from "@/components/NeonLogo";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/signup")({
  component: SignUp,
});

function passwordStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const strength = passwordStrength(pw);

  async function handle(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (pw !== pw2) return setErr("Passwords do not match");
    if (strength < 3) return setErr("Password must include upper, lower, number, and 8+ chars");
    if (!terms) return setErr("Please accept Terms and Conditions");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: pw,
      options: { emailRedirectTo: `${window.location.origin}/app` },
    });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("already")) setErr("This email is already registered");
      else setErr(error.message);
      return;
    }
    toast.success("Account created — entering grid…");
    navigate({ to: "/app" });
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/app` });
    if (r.error) toast.error(r.error.message);
  }

  return <AuthShell title="Create access key" subtitle="Join the BSpot AI grid">
    <form onSubmit={handle} className="space-y-4">
      <Field label="Email" type="email" value={email} onChange={setEmail} required />
      <div>
        <Field label="Password" type="password" value={pw} onChange={setPw} required />
        {pw && (
          <div className="mt-2 flex gap-1">
            {[0,1,2,3].map(i => (
              <span key={i} className={`h-1 flex-1 rounded ${i < strength ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        )}
      </div>
      <Field label="Confirm Password" type="password" value={pw2} onChange={setPw2} required />
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-1 accent-primary" />
        <span>I accept the <Link to="/terms" className="text-neon hover:underline">Terms and Conditions</Link></span>
      </label>
      {err && <div className="text-sm text-destructive font-mono">{err}</div>}
      <button disabled={loading || !terms} className="w-full bg-primary text-primary-foreground font-mono uppercase tracking-widest py-3 rounded-md glow disabled:opacity-50 inline-flex items-center justify-center gap-2">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />} Sign Up
      </button>
    </form>
    <Divider />
    <button onClick={google} className="w-full border border-border py-3 rounded-md font-mono uppercase text-xs tracking-widest hover:border-primary hover:text-neon">
      Continue with Google
    </button>
    <p className="mt-6 text-center text-sm text-muted-foreground">
      Already have an account? <Link to="/signin" className="text-neon hover:underline">Sign In</Link>
    </p>
  </AuthShell>;
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center px-6 py-12 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-30 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/40 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-6"><NeonLogo /></div>
        <div className="panel-neon p-8 scanline">
          <h1 className="font-display text-2xl">{title}</h1>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mt-1">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, type = "text", value, onChange, required }: { label: string; type?: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-input border border-border rounded-md px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
      />
    </label>
  );
}

export function Divider() {
  return (
    <div className="my-5 flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
      <span className="flex-1 h-px bg-border" /> OR <span className="flex-1 h-px bg-border" />
    </div>
  );
}
