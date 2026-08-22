-- 1) Reconcile signup credit grant back to 50 (demo) / 100 (registered).
-- The 500-credit variant was a one-day launch promotion and is intentionally retired.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  -- Demo (anonymous) sessions: 50 credits. Registered signups: 100 credits.
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

  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES
    (NEW.id, 'system',
     CASE WHEN v_is_demo THEN 'Welcome to BSpot AI (Demo)' ELSE 'Welcome to BSpot AI' END,
     CASE WHEN v_is_demo
       THEN 'You have 50 free credits to explore. Sign up any time to get 100 more and unlock saving.'
       ELSE 'You start with 100 free credits. We top you up with 5 more every 24 hours when your balance runs low.'
     END),
    (NEW.id, 'system',
     'Quick start: pick your target country',
     'Open Country Data for live macro, tax and visa info across 55 countries, and build your relocation roadmap.');

  RETURN NEW;
END;
$function$;

-- 2) Price alert bookkeeping on watchlists
ALTER TABLE public.watchlists
  ADD COLUMN IF NOT EXISTS last_price numeric,
  ADD COLUMN IF NOT EXISTS last_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_triggered_at timestamptz,
  ADD COLUMN IF NOT EXISTS alerts_paused boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS watchlists_alert_idx
  ON public.watchlists (symbol)
  WHERE alert_above IS NOT NULL OR alert_below IS NOT NULL;

-- 3) Background job state (single-flight lease + pause/circuit breaker)
CREATE TABLE IF NOT EXISTS public.job_state (
  job_key text PRIMARY KEY,
  locked_until timestamptz,
  last_run_at timestamptz,
  last_status text,
  last_error text,
  paused boolean NOT NULL DEFAULT false,
  runs integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.job_state TO service_role;
GRANT SELECT ON public.job_state TO authenticated;
ALTER TABLE public.job_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "job_state owner read" ON public.job_state;
CREATE POLICY "job_state owner read" ON public.job_state
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

-- Atomic lease acquisition: returns true when this caller owns the run.
CREATE OR REPLACE FUNCTION public.acquire_job_lease(p_key text, p_lease_seconds integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_ok boolean := false;
BEGIN
  INSERT INTO public.job_state(job_key, locked_until, last_run_at, runs)
    VALUES (p_key, now() + make_interval(secs => p_lease_seconds), now(), 1)
  ON CONFLICT (job_key) DO UPDATE
    SET locked_until = now() + make_interval(secs => p_lease_seconds),
        last_run_at = now(),
        runs = public.job_state.runs + 1,
        updated_at = now()
    WHERE public.job_state.paused = false
      AND (public.job_state.locked_until IS NULL OR public.job_state.locked_until < now())
  RETURNING true INTO v_ok;
  RETURN COALESCE(v_ok, false);
END;
$function$;

REVOKE ALL ON FUNCTION public.acquire_job_lease(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_job_lease(text, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.release_job_lease(p_key text, p_status text, p_error text DEFAULT NULL)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  UPDATE public.job_state
    SET locked_until = NULL, last_status = p_status, last_error = p_error, updated_at = now()
    WHERE job_key = p_key;
$function$;

REVOKE ALL ON FUNCTION public.release_job_lease(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_job_lease(text, text, text) TO service_role;