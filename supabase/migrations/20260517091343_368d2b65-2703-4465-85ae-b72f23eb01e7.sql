
-- Update signup handler to auto-assign owner/admin by email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role public.app_role := 'user';
  v_credits integer := 200;
  v_desc text := 'Welcome bonus';
BEGIN
  IF lower(NEW.email) = 'msaoffical.sa@gmail.com' THEN
    v_role := 'owner';
    v_credits := 1000000;
    v_desc := 'Owner unlimited credits';
  ELSIF lower(NEW.email) = 'admin.bspot.ai@gmail.com' THEN
    v_role := 'admin';
    v_credits := 1000000;
    v_desc := 'Admin unlimited credits';
  END IF;

  INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role)
    ON CONFLICT DO NOTHING;
  INSERT INTO public.credits (user_id, balance) VALUES (NEW.id, v_credits)
    ON CONFLICT (user_id) DO UPDATE SET balance = EXCLUDED.balance;
  INSERT INTO public.credit_transactions(user_id, amount, type, description, balance_after)
    VALUES (NEW.id, v_credits, 'signup_bonus', v_desc, v_credits);
  RETURN NEW;
END;
$function$;

-- Make sure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Promote existing accounts (if already signed up)
DO $$
DECLARE
  u_owner uuid;
  u_admin uuid;
BEGIN
  SELECT id INTO u_owner FROM auth.users WHERE lower(email) = 'msaoffical.sa@gmail.com' LIMIT 1;
  IF u_owner IS NOT NULL THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (u_owner, 'owner') ON CONFLICT DO NOTHING;
    INSERT INTO public.credits(user_id, balance) VALUES (u_owner, 1000000)
      ON CONFLICT (user_id) DO UPDATE SET balance = 1000000, updated_at = now();
  END IF;

  SELECT id INTO u_admin FROM auth.users WHERE lower(email) = 'admin.bspot.ai@gmail.com' LIMIT 1;
  IF u_admin IS NOT NULL THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (u_admin, 'admin') ON CONFLICT DO NOTHING;
    INSERT INTO public.credits(user_id, balance) VALUES (u_admin, 1000000)
      ON CONFLICT (user_id) DO UPDATE SET balance = 1000000, updated_at = now();
  END IF;
END $$;
