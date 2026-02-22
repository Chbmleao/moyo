-- Create patients table for professional → patient management
CREATE TABLE IF NOT EXISTS public.patients (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  email       text,
  avatar_url  text,
  linked_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- A professional cannot add the same email twice
CREATE UNIQUE INDEX IF NOT EXISTS patients_professional_email_unique
  ON public.patients (professional_id, email)
  WHERE email IS NOT NULL;

-- Enable RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Professionals can manage only their own patients
CREATE POLICY "professionals_select_own_patients"
  ON public.patients FOR SELECT
  USING (auth.uid() = professional_id);

CREATE POLICY "professionals_insert_own_patients"
  ON public.patients FOR INSERT
  WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "professionals_update_own_patients"
  ON public.patients FOR UPDATE
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "professionals_delete_own_patients"
  ON public.patients FOR DELETE
  USING (auth.uid() = professional_id);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.set_patients_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.set_patients_updated_at();
