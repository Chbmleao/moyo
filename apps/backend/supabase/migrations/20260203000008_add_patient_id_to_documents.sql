-- Add patient_id FK to documents so each document can optionally reference a patient
ALTER TABLE documents
  ADD COLUMN patient_id uuid REFERENCES patients(id) ON DELETE SET NULL;

-- Index for filtering documents by patient
CREATE INDEX idx_documents_patient_id ON documents(patient_id) WHERE patient_id IS NOT NULL;
