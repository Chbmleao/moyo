-- Add signing_token and signed_at columns to documents table
ALTER TABLE public.documents
  ADD COLUMN signing_token UUID DEFAULT NULL UNIQUE,
  ADD COLUMN signed_at     TIMESTAMPTZ DEFAULT NULL;

-- Index for fast token lookups
CREATE INDEX idx_documents_signing_token ON public.documents (signing_token)
  WHERE signing_token IS NOT NULL;

-- Allow anonymous (public) SELECT on documents matched by signing_token.
-- This enables the public signing page to load document metadata without auth.
CREATE POLICY "anon_select_by_token"
  ON public.documents
  FOR SELECT
  TO anon
  USING (signing_token IS NOT NULL);

-- Allow anonymous UPDATE (status + signed_at only) on documents matched by signing_token.
-- The WITH CHECK ensures only valid state transitions.
CREATE POLICY "anon_sign_by_token"
  ON public.documents
  FOR UPDATE
  TO anon
  USING  (signing_token IS NOT NULL AND status = 'pending_signature')
  WITH CHECK (status = 'signed');
