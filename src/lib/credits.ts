import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { purchaseCreditsMockFn, adminGrantCreditsFn } from "@/lib/credits.functions";

/**
 * Spend credits on a feature client-side (used for legacy/optimistic UI only).
 * AI server functions now consume credits server-side atomically.
 */
export async function spendCredits(amount: number, feature: string, description?: string): Promise<boolean> {
  const { error } = await supabase.rpc("consume_credits", {
    p_amount: amount,
    p_feature: feature,
    p_description: description ?? undefined,
  });
  if (error) {
    if (error.message?.includes("INSUFFICIENT_CREDITS")) {
      toast.error(`Not enough credits — this action costs ${amount}. Buy more from the navbar.`);
    } else {
      toast.error(error.message || "Could not spend credits");
    }
    return false;
  }
  return true;
}

/**
 * Mock purchase — routed through a server function (capped, auth-checked).
 * Replace with real Stripe flow when payments go live.
 */
export async function purchaseCreditsMock(_userId: string, amount: number, packLabel: string) {
  await purchaseCreditsMockFn({ data: { amount, pack_label: packLabel } });
}

/** Owner/admin grant to any user — role enforced server-side. */
export async function adminGrantCredits(userId: string, amount: number, description: string) {
  await adminGrantCreditsFn({ data: { user_id: userId, amount, description } });
}
