CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_credits integer := 200;
BEGIN
  INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
    ON CONFLICT DO NOTHING;
  INSERT INTO public.credits (user_id, balance) VALUES (NEW.id, v_credits)
    ON CONFLICT (user_id) DO UPDATE SET balance = EXCLUDED.balance;
  INSERT INTO public.credit_transactions(user_id, amount, type, description, balance_after)
    VALUES (NEW.id, v_credits, 'signup_bonus', 'Welcome bonus', v_credits);
  RETURN NEW;
END;
$function$;