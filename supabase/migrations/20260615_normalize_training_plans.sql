-- Vytvorenie novej tabuľky pre jednotlivé cvičenia z plánu (nahradzuje ukladanie do JSONB 'plan_data')
CREATE TABLE IF NOT EXISTS public.training_plan_exercises (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  training_plan_id uuid REFERENCES public.training_plans(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES public.exercises(id) ON DELETE CASCADE,
  exercise_title text,
  sets integer,
  reps text,
  tempo text,
  pause text,
  notes text,
  completed boolean DEFAULT false,
  rpe integer,
  pain_level integer,
  created_at timestamp with time zone DEFAULT now()
);

-- Migrácia existujúcich dát z 'plan_data' JSONB do novej relačnej tabuľky
-- Predpokladáme, že prvky v 'plan_data' obsahujú id (priradené náhodne na FE) alebo sa mapujú na exercise_title
DO $$
DECLARE
  plan_rec record;
  ex_elem jsonb;
BEGIN
  FOR plan_rec IN SELECT * FROM public.training_plans WHERE plan_data IS NOT NULL LOOP
    FOR ex_elem IN SELECT * FROM jsonb_array_elements(plan_rec.plan_data) LOOP
      INSERT INTO public.training_plan_exercises (
        training_plan_id,
        exercise_title,
        sets,
        reps,
        tempo,
        pause,
        notes,
        completed,
        rpe,
        pain_level
      )
      VALUES (
        plan_rec.id,
        ex_elem->>'exercise_title',
        (ex_elem->>'sets')::integer,
        ex_elem->>'reps',
        ex_elem->>'tempo',
        ex_elem->>'pause',
        ex_elem->>'notes',
        COALESCE((ex_elem->>'completed')::boolean, false),
        (ex_elem->>'rpe')::integer,
        (ex_elem->>'pain_level')::integer
      );
    END LOOP;
  END LOOP;
END
$$;

-- Nastavenie RLS pre novú tabuľku
ALTER TABLE public.training_plan_exercises ENABLE ROW LEVEL SECURITY;

-- Politiky pre klientov
CREATE POLICY "Klienti vidia svoje cvičenia v pláne" 
ON public.training_plan_exercises 
FOR SELECT 
USING (
  training_plan_id IN (
    SELECT id FROM public.training_plans WHERE client_id = auth.uid()
  )
);

CREATE POLICY "Klienti môžu upravovať spätnú väzbu (completed, rpe, pain_level)" 
ON public.training_plan_exercises 
FOR UPDATE 
USING (
  training_plan_id IN (
    SELECT id FROM public.training_plans WHERE client_id = auth.uid()
  )
);

-- Politiky pre špecialistov (Admin/Trener)
CREATE POLICY "Špecialisti spravujú všetko" 
ON public.training_plan_exercises 
FOR ALL 
USING (
  public.is_specialist(auth.uid())
);

-- Odstránenie starého stĺpca z training_plans
ALTER TABLE public.training_plans DROP COLUMN IF EXISTS plan_data;
