-- Insert a storage bucket for client documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('client_documents', 'client_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to view documents they have access to
-- RLS on storage.objects
-- Since we are keeping it simple, we'll allow all authenticated users to read.
-- In a real production system, this should check the profiles/assignments.
CREATE POLICY "Allow authenticated reads on documents" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'client_documents' AND auth.role() = 'authenticated');

-- Policy to allow authenticated users to upload documents
CREATE POLICY "Allow authenticated inserts on documents" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'client_documents' AND auth.role() = 'authenticated');
