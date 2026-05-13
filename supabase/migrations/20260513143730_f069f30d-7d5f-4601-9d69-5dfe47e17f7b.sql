-- Cache table for AI country scores (24h TTL, shared across users)
CREATE TABLE public.country_scores (
  code text PRIMARY KEY,
  name text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.country_scores ENABLE ROW LEVEL SECURITY;

-- Anyone signed in can read cached scores
CREATE POLICY "authenticated read country scores"
  ON public.country_scores FOR SELECT
  TO authenticated
  USING (true);

-- Writes only via server function (service role bypasses RLS); no client write policy
CREATE INDEX idx_country_scores_updated_at ON public.country_scores(updated_at DESC);