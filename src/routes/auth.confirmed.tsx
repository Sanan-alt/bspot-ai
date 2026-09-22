import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { sendTransactionalEmail } from "@/lib/email/send";
import { AuthShell } from "./signup";

export const Route = createFileRoute("/auth/confirmed")({
  head: () => ({
    meta: [
      { title: "Email confirmed — BSpot AI" },
      { name: "description", content: "Your BSpot AI email is confirmed and your welcome credits are unlocked." },
      { property: "og:title", content: "Email confirmed — BSpot AI" },
      { property: "og:description", content: "Your BSpot AI account is now fully active." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Confirmed,
});

function Confirmed() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [msg, setMsg] = useState("Confirming your email…");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/signin" });
      return;
    }
    (async () => {
      const { data } = await supabase.rpc("release_pending_credits");
      const r = data as { released?: boolean; amount?: number } | null;
      if (r?.released) {
        setMsg(`Email confirmed — ${r.amount} credits unlocked.`);
        try {
          await sendTransactionalEmail({
            templateName: "welcome",
            recipientEmail: user.email!,
            idempotencyKey: `welcome:${user.id}`,
            templateData: { recipient: user.email, credits: r.amount ?? 100 },
          });
        } catch {
          // welcome email is best-effort
        }
      } else {
        setMsg("Email confirmed. Taking you to your dashboard…");
      }
      setTimeout(() => navigate({ to: "/app" }), 1200);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id]);

  return (
    <AuthShell title="Almost there" subtitle="Activating your account">
      <div className="flex items-center gap-3 font-mono text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-neon" /> {msg}
      </div>
    </AuthShell>
  );
}
