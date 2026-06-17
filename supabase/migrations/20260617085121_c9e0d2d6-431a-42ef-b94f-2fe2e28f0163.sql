
-- Backup recovery codes for two-factor authentication
CREATE TABLE public.mfa_recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX mfa_recovery_codes_user_idx ON public.mfa_recovery_codes(user_id);

GRANT SELECT ON public.mfa_recovery_codes TO authenticated;
GRANT ALL ON public.mfa_recovery_codes TO service_role;

ALTER TABLE public.mfa_recovery_codes ENABLE ROW LEVEL SECURITY;

-- Users can see (but not modify) the metadata of their own codes (used_at, created_at)
CREATE POLICY "Users view own recovery codes"
  ON public.mfa_recovery_codes FOR SELECT
  USING (auth.uid() = user_id);

-- Regenerate: deletes existing codes and inserts 10 new hashed codes for the
-- caller. Returns the plaintext codes ONLY at this moment, so the UI can
-- show them once.
CREATE OR REPLACE FUNCTION public.regenerate_mfa_recovery_codes()
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  uid uuid := auth.uid();
  plain text;
  codes text[] := ARRAY[]::text[];
  i int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  DELETE FROM public.mfa_recovery_codes WHERE user_id = uid;
  FOR i IN 1..10 LOOP
    -- 10-char alphanumeric, formatted XXXXX-XXXXX
    plain := upper(
      substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, 5) || '-' ||
      substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, 5)
    );
    INSERT INTO public.mfa_recovery_codes(user_id, code_hash)
      VALUES (uid, extensions.crypt(plain, extensions.gen_salt('bf', 8)));
    codes := array_append(codes, plain);
  END LOOP;
  RETURN codes;
END;
$$;

-- Consume a code (used at sign-in if the user lost their authenticator).
-- Marks the matching unused code as used and returns true.
CREATE OR REPLACE FUNCTION public.consume_mfa_recovery_code(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  uid uuid := auth.uid();
  match_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT id INTO match_id
    FROM public.mfa_recovery_codes
    WHERE user_id = uid AND used_at IS NULL
      AND code_hash = extensions.crypt(upper(trim(p_code)), code_hash)
    LIMIT 1;
  IF match_id IS NULL THEN RETURN false; END IF;
  UPDATE public.mfa_recovery_codes SET used_at = now() WHERE id = match_id;
  RETURN true;
END;
$$;

-- Ensure pgcrypto is available for crypt/gen_random_bytes/gen_salt
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
