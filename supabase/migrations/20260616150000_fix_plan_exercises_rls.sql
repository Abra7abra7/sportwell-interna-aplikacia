-- Pridanie chýbajúcich RLS politík pre tabuľku plan_exercises, ktoré blokovali ukladanie cvikov do plánu

-- 1. Klient môže vidieť cviky, ktoré sú súčasťou jeho tréningových plánov
CREATE POLICY "Klient vidí cviky vo svojich plánoch"
ON public.plan_exercises FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.training_plans
    WHERE training_plans.id = plan_exercises.plan_id
    AND training_plans.client_id = auth.uid()
  )
);

-- 2. Špecialista (tréner/admin) vidí všetky cviky vo všetkých plánoch
CREATE POLICY "Špecialisti vidia všetky cviky v plánoch"
ON public.plan_exercises FOR SELECT TO authenticated
USING (public.is_specialist(auth.uid()));

-- 3. Špecialista (tréner/admin) môže pridávať, upravovať a mazať cviky v plánoch
CREATE POLICY "Špecialisti môžu spravovať cviky v plánoch"
ON public.plan_exercises FOR ALL TO authenticated
USING (public.is_specialist(auth.uid()));

-- === Doplnenie RLS aj pre tabuľky logovania tréningov, aby nepadali neskôr ===

-- Klient môže spravovať (čítať aj zapisovať) logy svojich tréningov
CREATE POLICY "Klient spravuje svoje vlastné logy"
ON public.client_workout_logs FOR ALL TO authenticated
USING (client_id = auth.uid());

-- Špecialista môže prezerať logy klientov
CREATE POLICY "Špecialisti vidia všetky logy"
ON public.client_workout_logs FOR SELECT TO authenticated
USING (public.is_specialist(auth.uid()));

-- Klient môže spravovať (čítať aj zapisovať) konkrétne série k svojmu logu
CREATE POLICY "Klient spravuje svoje série"
ON public.client_workout_log_sets FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.client_workout_logs
    WHERE client_workout_logs.id = client_workout_log_sets.log_id
    AND client_workout_logs.client_id = auth.uid()
  )
);

-- Špecialista môže prezerať záznamy konkrétnych sérií
CREATE POLICY "Špecialisti vidia všetky série"
ON public.client_workout_log_sets FOR SELECT TO authenticated
USING (public.is_specialist(auth.uid()));
