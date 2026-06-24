-- 1. Zabezpečenie prístupu pre client_documents bucket (ochrana pred IDOR)
DROP POLICY IF EXISTS "Allow authenticated reads on documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated inserts on documents" ON storage.objects;
DROP POLICY IF EXISTS "Strict read access on client documents" ON storage.objects;
DROP POLICY IF EXISTS "Strict insert access on client documents" ON storage.objects;

CREATE POLICY "Strict read access on client documents" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'client_documents' AND (
        -- Prístup pre samotného klienta (priečinok = jeho UUID)
        (storage.foldername(name))[1] = auth.uid()::text
        OR
        -- Prístup pre administrátorov, recepciu a majiteľov
        public.has_global_client_access(auth.uid())
        OR
        -- Prístup pre priradených trénerov/terapeutov
        EXISTS (
            SELECT 1 FROM public.client_specialist_assignments csa
            WHERE csa.specialist_id = auth.uid() 
            AND csa.client_id = ((storage.foldername(name))[1])::uuid
        )
    )
);

CREATE POLICY "Strict insert access on client documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'client_documents' AND (
        -- Klient môže nahrať len do svojho vlastného priečinka
        (storage.foldername(name))[1] = auth.uid()::text
        OR
        -- Špecialisti a zamestnanci môžu nahrať do akéhokoľvek priečinka
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role != 'klient'
        )
    )
);

-- 2. Oprava nesúladu oprávnení pre client_records_files (Lekári a fyzioterapeuti potrebujú prístup)
DROP POLICY IF EXISTS "Admins can access client records" ON storage.objects;
DROP POLICY IF EXISTS "Authorized medical staff can access client records files" ON storage.objects;

CREATE POLICY "Authorized medical staff can access client records files"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'client_records_files' AND
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'majitel', 'lekar', 'fyzioterapeut', 'maser', 'nutricny_poradca')
    )
);
