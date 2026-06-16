-- 1. Zabezpečenie prístupu pre Recepciu a Admina k profilom (Bezpečná funkcia obchádzajúca rekurziu)
CREATE OR REPLACE FUNCTION public.has_global_client_access(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = user_id;
  RETURN v_role IN ('admin', 'majitel', 'recepcia');
END;
$$;

-- 2. IZOLÁCIA PROFILOV KLIENTOV
-- Najprv musíme odstrániť staré politiky pre SELECT na profiles, ak existujú (zvyčajne tam bola "Všetci vidia profily")
DROP POLICY IF EXISTS "Každý vidí profily" ON public.profiles;
DROP POLICY IF EXISTS "Viditeľnosť profilov" ON public.profiles;

CREATE POLICY "Striktná viditeľnosť profilov" ON public.profiles FOR SELECT TO authenticated
USING (
  id = auth.uid() 
  OR public.has_global_client_access(auth.uid()) 
  OR role != 'klient' -- Špecialisti a zamestnanci sú viditeľní globálne
  OR EXISTS (
      -- Ak ide o klienta, musím s ním mať vytvorené priradenie
      SELECT 1 FROM public.client_specialist_assignments csa
      WHERE csa.specialist_id = auth.uid() AND csa.client_id = public.profiles.id
  )
);

-- Zabezpečiť aj UPDATE pre profily (ak náhodou predtým mali tréneri prístup ku všetkým)
DROP POLICY IF EXISTS "Špecialisti upravujú profily" ON public.profiles;

CREATE POLICY "Špecialisti upravujú len priradené profily" ON public.profiles FOR UPDATE TO authenticated
USING (
  id = auth.uid()
  OR public.is_admin(auth.uid())
  OR EXISTS (
      SELECT 1 FROM public.client_specialist_assignments csa
      WHERE csa.specialist_id = auth.uid() AND csa.client_id = public.profiles.id
  )
);

-- 3. IZOLÁCIA DATABÁZY CVIKOV
DROP POLICY IF EXISTS "Každý prihlásený používateľ vidí zoznam cvičení" ON public.exercises;

CREATE POLICY "Viditeľnosť cvičení (Global vs Private)" ON public.exercises FOR SELECT TO authenticated
USING (
  is_custom = false -- Globálne cviky vidia všetci
  OR created_by = auth.uid() -- Vlastné cviky vidí tvorca
  OR public.is_admin(auth.uid()) -- Admin vidí všetko
  OR EXISTS (
    -- Klienti vidia custom cviky, ak ich majú priradené vo svojom pláne
    SELECT 1 FROM public.plan_exercises pe
    JOIN public.training_plans tp ON tp.id = pe.plan_id
    WHERE pe.exercise_id = public.exercises.id AND tp.client_id = auth.uid()
  )
);

-- 4. IZOLÁCIA TRÉNINGOVÝCH PLÁNOV
-- Zrušíme globálnu "ALL" politiku, ktorú sme pred chvíľou spravili pre špecialistov
DROP POLICY IF EXISTS "Špecialisti môžu spravovať plány (ALL)" ON public.training_plans;
DROP POLICY IF EXISTS "Špecialisti vidia plány klientov" ON public.training_plans;

-- Politika pre Adminov - vidia a spravujú všetko
CREATE POLICY "Admini spravujú všetky plány" ON public.training_plans FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

-- Politika pre Špecialistov - vidia a spravujú IBA to, čo vytvorili alebo to, čo patrí ich pacientovi
CREATE POLICY "Špecialisti spravujú plány svojich pacientov" ON public.training_plans FOR ALL TO authenticated
USING (
  creator_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.client_specialist_assignments csa
    WHERE csa.client_id = public.training_plans.client_id AND csa.specialist_id = auth.uid()
  )
);
