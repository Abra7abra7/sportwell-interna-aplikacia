-- Insert a storage bucket for exercise images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise_images', 'exercise_images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy to allow anyone to read exercise images (it is a public bucket anyway)
CREATE POLICY "Allow public reads on exercise images" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'exercise_images');

-- Policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated inserts on exercise images" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'exercise_images' AND auth.role() = 'authenticated');

-- Policy to allow authenticated users to update/delete images
CREATE POLICY "Allow authenticated updates on exercise images" ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'exercise_images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated deletes on exercise images" ON storage.objects
    FOR DELETE
    USING (bucket_id = 'exercise_images' AND auth.role() = 'authenticated');
