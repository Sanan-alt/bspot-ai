
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

  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES
    (NEW.id, 'system',
     CASE WHEN v_is_demo THEN 'Welcome to BSpot AI (Demo)' ELSE 'Welcome to BSpot AI' END,
     CASE WHEN v_is_demo
       THEN 'You have 50 free credits to explore. Sign up any time to get 100 more and unlock saving.'
       ELSE 'You start with 100 free credits. We will top you up with 5 more every 24 hours when your balance runs low.'
     END),
    (NEW.id, 'system',
     'Quick start: pick your target country',
     'Open Country Data to see live macro, tax, and visa info for 16+ countries. Generate AI dossiers in one click.');

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
