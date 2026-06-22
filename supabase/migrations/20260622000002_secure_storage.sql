-- 1. Zmena bucketu z PUBLIC na PRIVATE
UPDATE storage.buckets
SET public = false
WHERE id = 'client_records_files';

-- 2. Odstránenie starých public politík na client_records_files (ak existovali)
DROP POLICY IF EXISTS "Každý môže čítať client_records_files" ON storage.objects;

-- 3. Vytvorenie prísnej RLS politiky pre Private Bucket
-- Admini a Majitelia môžu čítať a sťahovať všetky záznamy
CREATE POLICY "Admins can access client records"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'client_records_files' AND
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'majitel')
    )
);

-- Zápis do bucketu je zvyčajne kontrolovaný inými politikami (napr. povolené pre trénerov/adminov)
-- Ubezpečíme sa, že do neho môže zapisovať len autorizovaný personál
CREATE POLICY "Staff can upload client records"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'client_records_files' AND
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role NOT IN ('klient')
    )
);
