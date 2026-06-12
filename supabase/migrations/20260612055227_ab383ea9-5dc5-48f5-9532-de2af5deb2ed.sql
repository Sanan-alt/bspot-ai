
-- Extend profiles for onboarding & demo mode
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS home_country text,
  ADD COLUMN IF NOT EXISTS target_country text,
  ADD COLUMN IF NOT EXISTS investment_budget_usd numeric,
  ADD COLUMN IF NOT EXISTS business_interests text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS experience_level text,
  ADD COLUMN IF NOT EXISTS timeline text,
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

-- Update handle_new_user to flag demo (anonymous) users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_credits integer := 200;
  v_is_demo boolean := COALESCE((NEW.is_anonymous)::boolean, false);
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
    VALUES (NEW.id, v_credits, 'signup_bonus', CASE WHEN v_is_demo THEN 'Demo session' ELSE 'Welcome bonus' END, v_credits);
  RETURN NEW;
END;
$function$;
