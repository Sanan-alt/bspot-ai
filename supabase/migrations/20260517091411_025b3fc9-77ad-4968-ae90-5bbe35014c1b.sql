
-- handle_new_user is a trigger function; never call directly
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- consume_credits/grant_credits must remain callable by signed-in users via RPC,
-- but should not be callable by anon
REVOKE EXECUTE ON FUNCTION public.consume_credits(integer, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.grant_credits(uuid, integer, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_credits(integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_credits(uuid, integer, text, text) TO authenticated;
