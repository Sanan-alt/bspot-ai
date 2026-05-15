import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Spend credits on a feature. Owners are not charged (handled server-side).
 * Returns true if the action should proceed, false otherwise (and shows a toast).
 */
export async function spendCredits(amount: number, feature: string, description?: string): Promise<boolean> {
  const { error } = await supabase.rpc("consume_credits", {
    p_amount: amount,
    p_feature: feature,
    p_description: description ?? null,
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
 * Mock purchase — grants credits to current user with type 'purchase'.
 * Replace with real Stripe flow in Phase B.
 */
export async function purchaseCreditsMock(userId: string, amount: number, packLabel: string) {
  const { error } = await supabase.rpc("grant_credits", {
    p_user: userId,
    p_amount: amount,
    p_type: "purchase",
    p_description: `Mock purchase: ${packLabel}`,
  });
  if (error) throw new Error(error.message);
}

/** Owner/admin grant to any user. */
export async function adminGrantCredits(userId: string, amount: number, description: string) {
  const { error } = await supabase.rpc("grant_credits", {
    p_user: userId,
    p_amount: amount,
    p_type: "admin_grant",
    p_description: description,
  });
  if (error) throw new Error(error.message);
}
