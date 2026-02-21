-- Add a column to store the signed file path separately from the original
ALTER TABLE public.documents
  ADD COLUMN signed_file_path TEXT;

-- Allow anon to read the signed_file_path (needed by the public signing endpoint)
-- The existing anon_select_by_token and anon_sign_by_token policies already use SELECT *
-- so no RLS changes are needed.
