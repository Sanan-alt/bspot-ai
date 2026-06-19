-- Lock down SECURITY DEFINER functions from anonymous execution.
-- Pre-login helpers (record_login_attempt, check_login_lockout) remain callable by anon.
REVOKE EXECUTE ON FUNCTION public.consume_mfa_recovery_code(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.regenerate_mfa_recovery_codes() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.claim_daily_free_credits() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.check_ai_rate_limit(text, integer, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.consume_credits(integer, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.grant_credits(uuid, integer, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.consume_mfa_recovery_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.regenerate_mfa_recovery_codes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_daily_free_credits() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_ai_rate_limit(text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_credits(integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_credits(uuid, integer, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Explicit deny policies make intent clear for tables managed exclusively via SECURITY DEFINER functions.
-- login_attempts: only the record_login_attempt/check_login_lockout SECURITY DEFINER functions touch it.
CREATE POLICY "Deny all direct access to login_attempts"
  ON public.login_attempts FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

-- mfa_recovery_codes: INSERT/DELETE only via regenerate_mfa_recovery_codes / consume_mfa_recovery_code.
CREATE POLICY "Deny direct insert on mfa_recovery_codes"
  ON public.mfa_recovery_codes FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "Deny direct delete on mfa_recovery_codes"
  ON public.mfa_recovery_codes FOR DELETE TO authenticated
  USING (false);

CREATE POLICY "Deny direct update on mfa_recovery_codes"
  ON public.mfa_recovery_codes FOR UPDATE TO authenticated
  USING (false) WITH CHECK (false);
