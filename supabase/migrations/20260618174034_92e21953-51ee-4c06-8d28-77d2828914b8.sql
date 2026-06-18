
ALTER TABLE public.credits ADD COLUMN IF NOT EXISTS last_free_grant_at timestamptz;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_demo boolean := COALESCE((NEW.is_anonymous)::boolean, false);
  v_credits integer := CASE WHEN v_is_demo THEN 50 ELSE 100 END;
BEGIN
  INSERT INTO public.profiles (id, display_name, is_demo)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(COALESCE(NEW.email,'guest@demo'), '@', 1)),
      v_is_demo
    )
    ON CONFLICT (id) DO UPDATE SET is_demo = EXCLUDED.is_demo;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
    ON CONFLICT DO NOTHING;
  INSERT INTO public.credits (user_id, balance) VALUES (NEW.id, v_credits)
    ON CONFLICT (user_id) DO UPDATE SET balance = EXCLUDED.balance;
  INSERT INTO public.credit_transactions(user_id, amount, type, description, balance_after)
    VALUES (NEW.id, v_credits, 'signup_bonus',
            CASE WHEN v_is_demo THEN 'Demo session (50 free credits)' ELSE 'Welcome bonus (100 free credits)' END,
            v_credits);
  RETURN NEW;
END;
$function$;

-- Daily free 5-credit top-up. Users (including demo) can claim 5 credits every 24h
-- when their balance is low. Returns JSON describing the outcome.
CREATE OR REPLACE FUNCTION public.claim_daily_free_credits()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  v_balance integer;
  v_last timestamptz;
  v_next timestamptz;
  v_new_bal integer;
  v_grant int := 5;
  v_threshold int := 5; -- only refill when balance is at/under this
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT balance, last_free_grant_at INTO v_balance, v_last
    FROM public.credits WHERE user_id = uid FOR UPDATE;

  IF v_balance IS NULL THEN
    INSERT INTO public.credits(user_id, balance, last_free_grant_at)
      VALUES (uid, v_grant, now())
      RETURNING balance INTO v_new_bal;
    INSERT INTO public.credit_transactions(user_id, amount, type, description, balance_after)
      VALUES (uid, v_grant, 'weekly_reward', 'Daily free credits', v_new_bal);
    RETURN jsonb_build_object('granted', true, 'amount', v_grant, 'balance', v_new_bal);
  END IF;

  IF v_balance > v_threshold THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'balance_ok', 'balance', v_balance);
  END IF;

  IF v_last IS NOT NULL AND v_last > now() - interval '24 hours' THEN
    v_next := v_last + interval '24 hours';
    RETURN jsonb_build_object('granted', false, 'reason', 'cooldown',
                              'balance', v_balance, 'next_at', v_next);
  END IF;

  UPDATE public.credits
    SET balance = balance + v_grant,
        last_free_grant_at = now(),
        updated_at = now()
    WHERE user_id = uid
    RETURNING balance INTO v_new_bal;

  INSERT INTO public.credit_transactions(user_id, amount, type, description, balance_after)
    VALUES (uid, v_grant, 'weekly_reward', 'Daily free credits (24h top-up)', v_new_bal);

  RETURN jsonb_build_object('granted', true, 'amount', v_grant, 'balance', v_new_bal,
                            'next_at', now() + interval '24 hours');
END;
$function$;

GRANT EXECUTE ON FUNCTION public.claim_daily_free_credits() TO authenticated;
