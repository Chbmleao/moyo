-- Enable Row-Level Security on documents table to prevent direct access via PostgREST / anon key.
-- The backend uses the service_role key and bypasses RLS, so these policies are a safety net
-- against anyone hitting the Supabase REST API directly with the publicly-exposed anon key.

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Professionals can read their own documents
CREATE POLICY "professionals_select_own"
  ON public.documents
  FOR SELECT
  USING (auth.uid() = professional_id);

-- Patients can read documents assigned to their email
CREATE POLICY "patients_select_by_email"
  ON public.documents
  FOR SELECT
  USING (
    signer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Only the document owner (professional) can insert
CREATE POLICY "professionals_insert_own"
  ON public.documents
  FOR INSERT
  WITH CHECK (auth.uid() = professional_id);

-- Only the document owner can update
CREATE POLICY "professionals_update_own"
  ON public.documents
  FOR UPDATE
  USING (auth.uid() = professional_id);

-- Only the document owner can delete
CREATE POLICY "professionals_delete_own"
  ON public.documents
  FOR DELETE
  USING (auth.uid() = professional_id);
