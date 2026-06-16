-- Oprava chýbajúcich práv pre špecialistov na ÚPRAVU a MAZANIE tréningových plánov
-- Predtým mali špecialisti iba SELECT a INSERT. Týmto im povolíme všetko nad plánmi.

DROP POLICY IF EXISTS "Špecialisti môžu spravovať plány (ALL)" ON public.training_plans;

CREATE POLICY "Špecialisti môžu spravovať plány (ALL)"
ON public.training_plans FOR ALL TO authenticated
USING (public.is_specialist(auth.uid()));
