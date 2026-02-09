-- Documents: PDF metadata for uploads (files stored in Storage bucket "documents")
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  signer_email text,
  deadline_at timestamptz,
  status text NOT NULL DEFAULT 'pending_signature' CHECK (status IN ('pending_signature', 'signed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_professional_id ON public.documents(professional_id);
CREATE INDEX IF NOT EXISTS idx_documents_signer_email ON public.documents(signer_email);

COMMENT ON TABLE public.documents IS 'Document metadata; PDF files are stored in Supabase Storage bucket "documents".';
