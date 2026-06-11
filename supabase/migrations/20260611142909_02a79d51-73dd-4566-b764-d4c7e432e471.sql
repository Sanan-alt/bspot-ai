
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can subscribe to their own topic" ON realtime.messages;
CREATE POLICY "Authenticated users can subscribe to their own topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (realtime.topic() LIKE 'credits:%' AND split_part(realtime.topic(), ':', 2) = auth.uid()::text)
  OR (realtime.topic() LIKE 'notif:%' AND split_part(realtime.topic(), ':', 2) = auth.uid()::text)
  OR (realtime.topic() LIKE 'credit_tx:%' AND split_part(realtime.topic(), ':', 2) = auth.uid()::text)
);
