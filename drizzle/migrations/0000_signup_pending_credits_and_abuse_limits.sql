-- 1. Pending (unverified) credits
ALTER TABLE public.credits ADD COLUMN IF NOT EXISTS pending_balance integer NOT NULL DEFAULT 0;

-- 2. Signup attempts for IP / device rate limiting
CREATE TABLE IF NOT EXISTS public.signup_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text,
  email_hash text,
  fingerprint text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.signup_attempts TO service_role;
ALTER TABLE public.signup_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service role manages signup attempts" ON public.signup_attempts;
CREATE POLICY "service role manages signup attempts" ON public.signup_attempts
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS signup_attempts_ip_idx ON public.signup_attempts (ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS signup_attempts_fp_idx ON public.signup_attempts (fingerprint, created_at DESC);

-- 3. Rate-limit check (called from trusted server code with service role)
CREATE OR REPLACE FUNCTION public.check_signup_rate_limit(p_ip_hash text, p_fingerprint text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ip_count int := 0;
  fp_count int := 0;
BEGIN
  IF p_ip_hash IS NOT NULL THEN
    SELECT count(*) INTO ip_count FROM public.signup_attempts
      WHERE ip_hash = p_ip_hash AND created_at > now() - interval '1 hour';
  END IF;
  IF p_fingerprint IS NOT NULL THEN
    SELECT count(*) INTO fp_count FROM public.signup_attempts
      WHERE fingerprint = p_fingerprint AND created_at > now() - interval '1 hour';
  END IF;

  IF ip_count >= 3 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'ip', 'retry_after_minutes', 60);
  END IF;
  IF fp_count >= 2 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'device', 'retry_after_minutes', 60);
  END IF;
  RETURN jsonb_build_object('allowed', true, 'ip_count', ip_count, 'device_count', fp_count);
END;
$$;
REVOKE ALL ON FUNCTION public.check_signup_rate_limit(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_signup_rate_limit(text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.record_signup_attempt(p_ip_hash text, p_email_hash text, p_fingerprint text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  INSERT INTO public.signup_attempts(ip_hash, email_hash, fingerprint)
  VALUES (p_ip_hash, p_email_hash, p_fingerprint);
$$;
REVOKE ALL ON FUNCTION public.record_signup_attempt(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_signup_attempt(text, text, text) TO service_role;

-- 4. Release held credits once the email is confirmed
CREATE OR REPLACE FUNCTION public.release_pending_credits()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := auth.uid();
  v_confirmed boolean;
  v_pending int;
  v_new_bal int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT (email_confirmed_at IS NOT NULL) INTO v_confirmed FROM auth.users WHERE id = uid;
  IF NOT COALESCE(v_confirmed, false) THEN
    RETURN jsonb_build_object('released', false, 'reason', 'email_unconfirmed');
  END IF;

  SELECT pending_balance INTO v_pending FROM public.credits WHERE user_id = uid FOR UPDATE;
  IF COALESCE(v_pending, 0) <= 0 THEN
    RETURN jsonb_build_object('released', false, 'reason', 'nothing_pending');
  END IF;

  UPDATE public.credits
    SET balance = balance + v_pending, pending_balance = 0, updated_at = now()
    WHERE user_id = uid
    RETURNING balance INTO v_new_bal;

  INSERT INTO public.credit_transactions(user_id, amount, type, description, balance_after)
    VALUES (uid, v_pending, 'signup_bonus', 'Welcome bonus unlocked after email verification', v_new_bal);

  RETURN jsonb_build_object('released', true, 'amount', v_pending, 'balance', v_new_bal);
END;
$$;
GRANT EXECUTE ON FUNCTION public.release_pending_credits() TO authenticated;

-- 5. New users: demo gets 50 immediately, email signups hold 100 until verified
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_demo boolean := COALESCE((NEW.is_anonymous)::boolean, false);
  v_confirmed boolean := (NEW.email_confirmed_at IS NOT NULL);
  v_amount integer := CASE WHEN v_is_demo THEN 50 ELSE 100 END;
  v_immediate integer;
  v_pending integer;
BEGIN
  IF v_is_demo OR v_confirmed THEN
    v_immediate := v_amount; v_pending := 0;
  ELSE
    v_immediate := 0; v_pending := v_amount;
  END IF;

  INSERT INTO public.profiles (id, display_name, is_demo)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(COALESCE(NEW.email,'guest@demo'), '@', 1)),
      v_is_demo
    )
    ON CONFLICT (id) DO UPDATE SET is_demo = EXCLUDED.is_demo;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
    ON CONFLICT DO NOTHING;

  INSERT INTO public.credits (user_id, balance, pending_balance)
    VALUES (NEW.id, v_immediate, v_pending)
    ON CONFLICT (user_id) DO UPDATE SET balance = EXCLUDED.balance, pending_balance = EXCLUDED.pending_balance;

  INSERT INTO public.credit_transactions(user_id, amount, type, description, balance_after)
    VALUES (NEW.id, v_immediate, 'signup_bonus',
            CASE
              WHEN v_is_demo THEN 'Demo session (50 free credits)'
              WHEN v_pending > 0 THEN 'Welcome bonus of 100 credits held until email verification'
              ELSE 'Welcome bonus (100 free credits)'
            END,
            v_immediate);

  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES
    (NEW.id, 'system',
     CASE WHEN v_is_demo THEN 'Welcome to BSpot AI (Demo)' ELSE 'Welcome to BSpot AI' END,
     CASE
       WHEN v_is_demo THEN 'You have 50 free credits to explore. Sign up any time to get 100 more and unlock saving.'
       WHEN v_pending > 0 THEN 'Your 100 welcome credits are waiting — confirm your email address to unlock them.'
       ELSE 'You start with 100 free credits. We top you up with 5 more every 24 hours when your balance runs low.'
     END),
    (NEW.id, 'system',
     'Quick start: pick your target country',
     'Open Country Data for live macro, tax and visa info across 55 countries, and build your relocation roadmap.');

  RETURN NEW;
END;
$$;