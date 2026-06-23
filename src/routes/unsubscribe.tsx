import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";

type State = "loading" | "valid" | "invalid" | "already" | "done" | "error";

export const Route = createFileRoute("/unsubscribe")({
  validateSearch: (s: Record<string, unknown>) => ({ token: (s.token as string) ?? "" }),
  component: UnsubscribePage,
});

function UnsubscribePage() {
  const { token } = useSearch({ from: "/unsubscribe" });
  const [state, setState] = useState<State>("loading");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`);
        const j = await res.json();
        if (!res.ok) {
          setError(j?.error ?? "Invalid token");
          setState("invalid");
          return;
        }
        if (j.valid === false && j.reason === "already_unsubscribed") {
          setState("already");
          return;
        }
        setState("valid");
      } catch (e: any) {
        setError(e?.message ?? "Network error");
        setState("error");
      }
    })();
  }, [token]);

  async function confirm() {
    setState("loading");
    try {
      const res = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j?.error ?? "Failed");
        setState("error");
        return;
      }
      if (j.success === false && j.reason === "already_unsubscribed") {
        setState("already");
      } else {
        setState("done");
      }
    } catch (e: any) {
      setError(e?.message ?? "Network error");
      setState("error");
    }
  }

  return (
    <main className="mx-auto max-w-md p-8 text-center">
      <h1 className="font-display text-2xl mb-2">Unsubscribe</h1>
      {state === "loading" && <p className="text-muted-foreground">Checking…</p>}
      {state === "invalid" && <p className="text-destructive">Invalid or expired link. {error}</p>}
      {state === "already" && <p className="text-muted-foreground">You're already unsubscribed.</p>}
      {state === "valid" && (
        <>
          <p className="text-muted-foreground mb-4">Stop receiving emails from BSpot AI?</p>
          <button onClick={confirm} className="rounded-md bg-foreground text-background px-4 py-2 text-sm">
            Confirm unsubscribe
          </button>
        </>
      )}
      {state === "done" && <p className="text-emerald-500">You've been unsubscribed.</p>}
      {state === "error" && <p className="text-destructive">{error}</p>}
    </main>
  );
}
