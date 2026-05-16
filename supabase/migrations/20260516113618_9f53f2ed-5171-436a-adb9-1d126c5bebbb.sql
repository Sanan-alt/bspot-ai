-- App settings table for owner-configurable pricing
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read (UI needs prices/costs)
CREATE POLICY "authenticated read settings"
ON public.app_settings FOR SELECT TO authenticated USING (true);

-- Only owners can write
CREATE POLICY "owners insert settings"
ON public.app_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "owners update settings"
ON public.app_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'owner'))
WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "owners delete settings"
ON public.app_settings FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

-- Seed defaults
INSERT INTO public.app_settings(key, value) VALUES
  ('credit_packs', '[
    {"id":"starter","label":"Starter","credits":200,"price_pkr":499},
    {"id":"pro","label":"Pro","credits":1000,"price_pkr":1999},
    {"id":"business","label":"Business","credits":5000,"price_pkr":7999}
  ]'::jsonb),
  ('feature_costs', '{
    "map_view":20,"market_data":15,"export_file":50,"ai_tool":5,
    "business_analytics":20,"premium_report":100
  }'::jsonb);

-- Allow owners/admins to view all profiles (for the admin user list)
DROP POLICY IF EXISTS "owners admins view all profiles" ON public.profiles;
CREATE POLICY "owners admins view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER trg_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();