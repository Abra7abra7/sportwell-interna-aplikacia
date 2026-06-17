-- Zapnutie RLS na tabuľke exercises, ktorá ostala nezabezpečená (Unrestricted)

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Cviky musia byť viditeľné pre všetkých prihlásených používateľov (SELECT)
-- (Tréneri potrebujú vidieť cviky pri tvorbe plánu, klienti pri pozeraní plánu)
CREATE POLICY "Cviky sú viditeľné pre všetkých prihlásených používateľov"
ON public.exercises FOR SELECT TO authenticated
USING (true);

-- Pravidlá pre INSERT (Pridávanie cvikov)
CREATE POLICY "Zamestnanci môžu pridávať cviky"
ON public.exercises FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role != 'klient'
  )
);
