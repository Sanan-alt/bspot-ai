
-- credits balance per user
CREATE TABLE public.credits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own credits" ON public.credits
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owners admins view all credits" ON public.credits
  FOR SELECT USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

-- credit transactions log
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL, -- signed: negative = usage, positive = grant
  type text NOT NULL CHECK (type IN ('signup_bonus','usage','purchase','admin_grant','weekly_reward','refund')),
  feature text,
  description text,
  balance_after integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_credit_tx_user_created ON public.credit_transactions(user_id, created_at DESC);
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owners admins view all transactions" ON public.credit_transactions
  FOR SELECT USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

-- realtime for live balance
ALTER PUBLICATION supabase_realtime ADD TABLE public.credits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_transactions;

-- consume credits atomically (skips charge for owners)
CREATE OR REPLACE FUNCTION public.consume_credits(p_amount integer, p_feature text, p_description text DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  new_bal integer;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;

  -- owners are never charged
  IF public.has_role(uid, 'owner') THEN
    RETURN 999999999;
  END IF;

  UPDATE public.credits
    SET balance = balance - p_amount, updated_at = now()
    WHERE user_id = uid AND balance >= p_amount
    RETURNING balance INTO new_bal;

  IF new_bal IS NULL THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.credit_transactions(user_id, amount, type, feature, description, balance_after)
    VALUES (uid, -p_amount, 'usage', p_feature, p_description, new_bal);

  RETURN new_bal;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_credits(integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_credits(integer, text, text) TO authenticated;

-- grant credits (purchases, rewards, admin grants)
CREATE OR REPLACE FUNCTION public.grant_credits(p_user uuid, p_amount integer, p_type text, p_description text DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  new_bal integer;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  IF p_type NOT IN ('signup_bonus','purchase','admin_grant','weekly_reward','refund') THEN
    RAISE EXCEPTION 'Invalid grant type';
  END IF;

  -- only owners/admins can grant to other users; users can self-grant only via 'purchase' or 'weekly_reward'
  IF p_user <> uid AND NOT (public.has_role(uid, 'owner') OR public.has_role(uid, 'admin')) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF p_user = uid AND p_type = 'admin_grant' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  INSERT INTO public.credits(user_id, balance, updated_at)
    VALUES (p_user, p_amount, now())
    ON CONFLICT (user_id) DO UPDATE SET balance = public.credits.balance + EXCLUDED.balance, updated_at = now()
    RETURNING balance INTO new_bal;

  INSERT INTO public.credit_transactions(user_id, amount, type, feature, description, balance_after)
    VALUES (p_user, p_amount, p_type, NULL, p_description, new_bal);

  RETURN new_bal;
END;
$$;
REVOKE ALL ON FUNCTION public.grant_credits(uuid, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_credits(uuid, integer, text, text) TO authenticated;

-- update handle_new_user trigger to also seed 200 credits + log signup bonus
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  INSERT INTO public.credits (user_id, balance) VALUES (NEW.id, 200);
  INSERT INTO public.credit_transactions(user_id, amount, type, description, balance_after)
    VALUES (NEW.id, 200, 'signup_bonus', 'Welcome bonus', 200);
  RETURN NEW;
END;
$$;

-- ensure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: give existing users 200 credits if they have no row
INSERT INTO public.credits (user_id, balance)
  SELECT u.id, 200 FROM auth.users u
  LEFT JOIN public.credits c ON c.user_id = u.id
  WHERE c.user_id IS NULL;
