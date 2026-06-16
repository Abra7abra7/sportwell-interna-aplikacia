-- Tento skript aktualizuje RLS politiky pre tabuľku client_records
-- Chránime lekárske dáta pred recepciou, fitness trénermi a klientmi samotnými.

-- Najprv dropneme staré SELECT politiky, ak existujú (z dôvodu idempotencie)
DROP POLICY IF EXISTS "Specialisti vidia zaznamy pridelenych klientov" ON public.client_records;
DROP POLICY IF EXISTS "Admin a lekar vidi vsetko" ON public.client_records;

-- Vytvoríme novú, striktnú politiku
CREATE POLICY "Iba zdravotnícky a admin personál má prístup k diagnostike"
ON public.client_records FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'majitel', 'lekar', 'fyzioterapeut', 'maser', 'nutricny_poradca')
  )
);

CREATE POLICY "Iba zdravotnícky a admin personál môže zapisovať diagnostiku"
ON public.client_records FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'majitel', 'lekar', 'fyzioterapeut', 'maser', 'nutricny_poradca')
  )
);

CREATE POLICY "Iba autor alebo admin môže upravovať diagnostiku"
ON public.client_records FOR UPDATE TO authenticated
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'majitel')
  )
);
