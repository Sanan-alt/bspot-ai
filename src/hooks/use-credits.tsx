import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Ctx = {
  balance: number;
  loading: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
};

const CreditsContext = createContext<Ctx>({
  balance: 0,
  loading: true,
  isOwner: false,
  isAdmin: false,
  refresh: async () => {},
});

export function CreditsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const load = async () => {
    if (!user) {
      setBalance(0);
      setIsOwner(false);
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    // Try to claim the daily free 5-credit top-up (no-op if balance > 5 or within 24h cooldown).
    try {
      await supabase.rpc("claim_daily_free_credits");
    } catch {
      // ignore — cooldown / not-eligible is not an error
    }
    const [{ data: cr }, { data: roles }] = await Promise.all([
      supabase.from("credits").select("balance").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]);
    setBalance(cr?.balance ?? 0);
    const rs = (roles ?? []).map((r) => r.role);
    setIsOwner(rs.includes("owner"));
    setIsAdmin(rs.includes("admin") || rs.includes("owner"));
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel(`credits:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "credits", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as { balance?: number } | null;
          if (row?.balance !== undefined) setBalance(row.balance);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <CreditsContext.Provider value={{ balance, loading, isOwner, isAdmin, refresh: load }}>
      {children}
    </CreditsContext.Provider>
  );
}

export const useCredits = () => useContext(CreditsContext);

/** Map of credit costs per feature. Keep in sync with server-side checks. */
export const CREDIT_COSTS = {
  map_view: 20,
  market_data: 15,
  export_file: 50,
  ai_tool: 5,
  business_analytics: 20,
  premium_report: 100,
} as const;

export type FeatureKey = keyof typeof CREDIT_COSTS;
