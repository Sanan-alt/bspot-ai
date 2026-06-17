
-- ============ country_live_data ============
CREATE TABLE public.country_live_data (
  country_code text PRIMARY KEY,
  currency_code text NOT NULL,
  fx_rate_usd numeric,
  inflation_pct numeric,
  policy_rate_pct numeric,
  source text,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.country_live_data TO anon, authenticated;
GRANT ALL ON public.country_live_data TO service_role;
ALTER TABLE public.country_live_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read country_live_data" ON public.country_live_data
  FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER trg_country_live_data_updated_at
  BEFORE UPDATE ON public.country_live_data
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ login_attempts (rate limiting) ============
CREATE TABLE public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash text NOT NULL,
  ip text,
  success boolean NOT NULL DEFAULT false,
  attempted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_login_attempts_email_time ON public.login_attempts (email_hash, attempted_at DESC);
GRANT SELECT, INSERT ON public.login_attempts TO anon, authenticated;
GRANT ALL ON public.login_attempts TO service_role;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
-- No client policies — only service_role / SECURITY DEFINER funcs access it.

CREATE OR REPLACE FUNCTION public.record_login_attempt(p_email_hash text, p_success boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fail_count int;
  locked_until timestamptz;
BEGIN
  INSERT INTO public.login_attempts(email_hash, success) VALUES (p_email_hash, p_success);
  SELECT count(*) INTO fail_count
    FROM public.login_attempts
    WHERE email_hash = p_email_hash
      AND success = false
      AND attempted_at > now() - interval '15 minutes';
  IF fail_count >= 5 THEN
    locked_until := now() + interval '15 minutes';
    RETURN jsonb_build_object('locked', true, 'until', locked_until, 'fail_count', fail_count);
  END IF;
  RETURN jsonb_build_object('locked', false, 'fail_count', fail_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.check_login_lockout(p_email_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fail_count int;
BEGIN
  SELECT count(*) INTO fail_count
    FROM public.login_attempts
    WHERE email_hash = p_email_hash
      AND success = false
      AND attempted_at > now() - interval '15 minutes';
  RETURN jsonb_build_object('locked', fail_count >= 5, 'fail_count', fail_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_login_attempt(text, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_login_lockout(text) TO anon, authenticated;

-- ============ pg_cron + pg_net ============
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
