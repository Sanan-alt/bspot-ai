CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_credits integer := 500;
BEGIN
  INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
    ON CONFLICT DO NOTHING;
  INSERT INTO public.credits (user_id, balance) VALUES (NEW.id, v_credits)
    ON CONFLICT (user_id) DO UPDATE SET balance = GREATEST(public.credits.balance, EXCLUDED.balance);
  INSERT INTO public.credit_transactions(user_id, amount, type, description, balance_after)
    VALUES (NEW.id, v_credits, 'signup_bonus', 'Launch welcome bonus', v_credits);
  RETURN NEW;
END;
$function$;

DO $$
DECLARE
  r record;
  v_diff integer;
BEGIN
  FOR r IN
    SELECT c.user_id, c.balance
    FROM public.credits c
    WHERE c.balance < 500
      AND NOT EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = c.user_id AND ur.role IN ('owner','admin')
      )
  LOOP
    v_diff := 500 - r.balance;
    UPDATE public.credits SET balance = 500, updated_at = now() WHERE user_id = r.user_id;
    INSERT INTO public.credit_transactions(user_id, amount, type, description, balance_after)
      VALUES (r.user_id, v_diff, 'admin_grant', 'Launch top-up to 500', 500);
  END LOOP;
END $$;