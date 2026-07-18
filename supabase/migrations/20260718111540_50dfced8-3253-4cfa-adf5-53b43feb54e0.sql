
DROP POLICY IF EXISTS "Anyone can insert telemetry" ON public.telemetry_events;
CREATE POLICY "Clients can insert own telemetry" ON public.telemetry_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    (user_id IS NULL OR user_id = auth.uid())
    AND length(event) BETWEEN 1 AND 128
    AND (path IS NULL OR length(path) <= 512)
    AND (session_id IS NULL OR length(session_id) <= 128)
    AND (level IS NULL OR level IN ('info','warn','error','debug'))
    AND (metadata IS NULL OR pg_column_size(metadata) <= 8192)
  );

DROP POLICY IF EXISTS "Anyone can insert missing keys" ON public.i18n_missing_keys;
CREATE POLICY "Clients can insert missing keys" ON public.i18n_missing_keys
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(key) BETWEEN 1 AND 256
    AND length(lang) BETWEEN 2 AND 16
    AND (path IS NULL OR length(path) <= 512)
    AND (count IS NULL OR (count > 0 AND count <= 10000))
  );
