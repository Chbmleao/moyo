-- Storage bucket for document PDFs (private; access only via backend signed URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;
