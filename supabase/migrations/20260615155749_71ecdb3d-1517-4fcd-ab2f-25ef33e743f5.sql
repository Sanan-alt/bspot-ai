
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS readiness_score integer;

CREATE TABLE IF NOT EXISTS public.roadmap_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_country text,
  business_type text,
  step_index integer NOT NULL,
  phase text NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done','skipped')),
  due_date date,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_steps TO authenticated;
GRANT ALL ON public.roadmap_steps TO service_role;

ALTER TABLE public.roadmap_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own roadmap_steps"
  ON public.roadmap_steps
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_roadmap_steps_user ON public.roadmap_steps(user_id, step_index);

CREATE TRIGGER trg_roadmap_steps_updated_at
  BEFORE UPDATE ON public.roadmap_steps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
