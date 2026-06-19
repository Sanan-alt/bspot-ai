import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Mock purchase — grants the chosen pack to the authenticated user.
// Capped server-side; replace with a verified Stripe payment_intent before launch.
const MockPurchaseInput = z.object({
  amount: z.number().int().min(1).max(10_000),
  pack_label: z.string().min(1).max(64),
});

export const purchaseCreditsMockFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => MockPurchaseInput.parse(i))
  .handler(async ({ data, context }) => {
    // Mock purchase endpoint is disabled until real payment verification (Stripe webhook) is wired.
    // Restrict to owner role so it cannot be abused by ordinary authenticated users to mint credits.
    const { data: isOwner, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "owner",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isOwner) {
      throw new Error("Payments are not yet available. Please check back soon.");
    }
    const { error } = await supabaseAdmin.rpc("grant_credits", {
      p_user: context.userId,
      p_amount: data.amount,
      p_type: "purchase",
      p_description: `Mock purchase — ${data.pack_label}`,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Admin/Owner grant to another user. Role verified server-side.
const AdminGrantInput = z.object({
  user_id: z.string().uuid(),
  amount: z.number().int().min(1).max(10_000_000),
  description: z.string().min(1).max(200),
});

export const adminGrantCreditsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => AdminGrantInput.parse(i))
  .handler(async ({ data, context }) => {
    const { data: roles, error: roleErr } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (roleErr) throw new Error(roleErr.message);
    const isOwnerOrAdmin = (roles ?? []).some((r) => r.role === "owner" || r.role === "admin");
    if (!isOwnerOrAdmin) throw new Error("Forbidden");

    const { error } = await supabaseAdmin.rpc("grant_credits", {
      p_user: data.user_id,
      p_amount: data.amount,
      p_type: "admin_grant",
      p_description: data.description,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Server-side owner/admin verification used to gate the admin UI.
export const verifyOwnerFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    const isOwner = (roles ?? []).some((r) => r.role === "owner");
    if (!isOwner) throw new Error("Forbidden");
    return { ok: true as const };
  });
