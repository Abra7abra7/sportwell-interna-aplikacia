-- RLS pre špecialistov, aby mohli zaznamenávať tréningy za klienta

-- Umožníme špecialistom nielen SELECT, ale kompletnú správu nad logmi tréningov
DROP POLICY IF EXISTS "Špecialisti vidia všetky logy" ON public.client_workout_logs;

CREATE POLICY "Špecialisti spravujú všetky logy"
ON public.client_workout_logs FOR ALL TO authenticated
USING (public.is_specialist(auth.uid()));

-- To isté pre konkrétne série (sets)
DROP POLICY IF EXISTS "Špecialisti vidia všetky série" ON public.client_workout_log_sets;

CREATE POLICY "Špecialisti spravujú všetky série"
ON public.client_workout_log_sets FOR ALL TO authenticated
USING (public.is_specialist(auth.uid()));
