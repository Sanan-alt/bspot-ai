
-- AI rate limit usage log
CREATE TABLE public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_usage_user_feature_time_idx ON public.ai_usage(user_id, feature, created_at DESC);
GRANT SELECT, INSERT ON public.ai_usage TO authenticated;
GRANT ALL ON public.ai_usage TO service_role;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own ai usage" ON public.ai_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Rate limit checker. Logs a hit and returns ok=false if over limit in window.
CREATE OR REPLACE FUNCTION public.check_ai_rate_limit(p_feature text, p_max int, p_window_seconds int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  used int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT count(*) INTO used FROM public.ai_usage
    WHERE user_id = uid AND feature = p_feature
      AND created_at > now() - make_interval(secs => p_window_seconds);
  IF used >= p_max THEN
    RETURN jsonb_build_object('ok', false, 'used', used, 'max', p_max, 'window_seconds', p_window_seconds);
  END IF;
  INSERT INTO public.ai_usage(user_id, feature) VALUES (uid, p_feature);
  RETURN jsonb_build_object('ok', true, 'used', used + 1, 'max', p_max);
END;
$$;

-- Dossier cache (shared across users; data is non-personal analytical content)
CREATE TABLE public.dossier_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('country','city')),
  country_code text NOT NULL,
  city_name text,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope, country_code, city_name)
);
GRANT SELECT ON public.dossier_cache TO authenticated;
GRANT ALL ON public.dossier_cache TO service_role;
ALTER TABLE public.dossier_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read dossier cache" ON public.dossier_cache FOR SELECT TO authenticated USING (true);
-- Writes only via SECURITY DEFINER server contexts (service_role); no INSERT policy for users.
