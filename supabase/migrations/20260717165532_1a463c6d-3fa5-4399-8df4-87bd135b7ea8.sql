
CREATE TABLE public.telemetry_events (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID,
  session_id TEXT,
  event TEXT NOT NULL,
  path TEXT,
  value NUMERIC,
  level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info','warn','error')),
  metadata JSONB
);
CREATE INDEX ON public.telemetry_events(created_at DESC);
CREATE INDEX ON public.telemetry_events(event);

CREATE TABLE public.i18n_missing_keys (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lang TEXT NOT NULL,
  key TEXT NOT NULL,
  path TEXT,
  count INT NOT NULL DEFAULT 1
);
CREATE INDEX ON public.i18n_missing_keys(lang, key);

GRANT INSERT ON public.telemetry_events TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.telemetry_events_id_seq TO anon, authenticated;
GRANT SELECT ON public.telemetry_events TO authenticated;
GRANT ALL ON public.telemetry_events TO service_role;

GRANT INSERT ON public.i18n_missing_keys TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.i18n_missing_keys_id_seq TO anon, authenticated;
GRANT SELECT ON public.i18n_missing_keys TO authenticated;
GRANT ALL ON public.i18n_missing_keys TO service_role;

ALTER TABLE public.telemetry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.i18n_missing_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert telemetry" ON public.telemetry_events
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can read telemetry" ON public.telemetry_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));

CREATE POLICY "Anyone can insert missing keys" ON public.i18n_missing_keys
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can read missing keys" ON public.i18n_missing_keys
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));
