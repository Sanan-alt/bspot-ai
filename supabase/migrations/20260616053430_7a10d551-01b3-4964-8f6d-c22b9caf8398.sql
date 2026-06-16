
CREATE TABLE public.user_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  storage_path text NOT NULL UNIQUE,
  size_bytes bigint,
  content_type text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_documents TO authenticated;
GRANT ALL ON public.user_documents TO service_role;

ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own documents"
  ON public.user_documents FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX user_documents_user_idx ON public.user_documents(user_id, created_at DESC);

CREATE TRIGGER set_user_documents_updated_at
  BEFORE UPDATE ON public.user_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage RLS: user-documents bucket, folder = user id
CREATE POLICY "Users read own docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own docs"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own docs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
