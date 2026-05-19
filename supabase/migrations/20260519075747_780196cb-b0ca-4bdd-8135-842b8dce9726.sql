
-- 1) Tighten grant_credits: only owner/admin can grant; remove self-grant loophole entirely.
CREATE OR REPLACE FUNCTION public.grant_credits(p_user uuid, p_amount integer, p_type text, p_description text DEFAULT NULL::text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  new_bal integer;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  IF p_type NOT IN ('signup_bonus','purchase','admin_grant','weekly_reward','refund') THEN
    RAISE EXCEPTION 'Invalid grant type';
  END IF;

  -- Only owner/admin (or trusted server contexts where auth.uid() is null, e.g. service role) may grant.
  IF uid IS NOT NULL AND NOT (public.has_role(uid, 'owner') OR public.has_role(uid, 'admin')) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  INSERT INTO public.credits(user_id, balance, updated_at)
    VALUES (p_user, p_amount, now())
    ON CONFLICT (user_id) DO UPDATE SET balance = public.credits.balance + EXCLUDED.balance, updated_at = now()
    RETURNING balance INTO new_bal;

  INSERT INTO public.credit_transactions(user_id, amount, type, feature, description, balance_after)
    VALUES (p_user, p_amount, p_type, NULL, p_description, new_bal);

  RETURN new_bal;
END;
$function$;

-- 2) Revoke EXECUTE on grant_credits from PUBLIC/anon/authenticated; service role retains it.
REVOKE EXECUTE ON FUNCTION public.grant_credits(uuid, integer, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.grant_credits(uuid, integer, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.grant_credits(uuid, integer, text, text) FROM authenticated;

-- 3) Realtime channel hardening: enable RLS on realtime.messages and deny broadcast/presence subs by default.
-- Existing postgres_changes subscriptions still respect the source tables' own RLS.
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;
