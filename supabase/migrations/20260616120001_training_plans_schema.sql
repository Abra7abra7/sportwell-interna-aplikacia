-- 1. Číselník / Globálna databáza cvičení (Importovaná z Github datasetu)
CREATE TABLE IF NOT EXISTS public.exercises (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    exercise_force text, -- push, pull, static
    difficulty_level text, -- beginner, intermediate, expert
    mechanic text, -- compound, isolation
    equipment text, -- bands, barbell, dummy, body-only...
    primary_muscles text[] NOT NULL, -- polia textu napr. ['quadriceps', 'hamstrings']
    secondary_muscles text[],
    instructions text[], -- pole krokov/inštrukcií
    category text NOT NULL, -- strength, stretching, plyometrics, rehab...
    
    -- Ak je is_custom = true, cvik vytvoril konkrétny tréner pre túto kliniku
    is_custom boolean DEFAULT false,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexy pre rýchle vyhľadávanie v datasete (napr. podľa svalovej partie alebo náradia)
CREATE INDEX IF NOT EXISTS idx_exercises_primary_muscles ON public.exercises USING gin (primary_muscles);
CREATE INDEX IF NOT EXISTS idx_exercises_category ON public.exercises(category);

-- 2. Tabuľka Tréningových / Rehabilitačných plánov (Záhlavie)
CREATE TABLE IF NOT EXISTS public.training_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    title text NOT NULL, -- napr. "Rehabilitácia po plastike ACL - 1. Fáza"
    description text,
    is_active boolean DEFAULT true,
    valid_from date DEFAULT CURRENT_DATE,
    valid_to date,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Prepojovacia tabuľka: Cviky v pláne (Rieši náhradu za JSONB)
CREATE TABLE IF NOT EXISTS public.plan_exercises (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid NOT NULL REFERENCES public.training_plans(id) ON DELETE CASCADE,
    exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
    order_index integer NOT NULL, -- Poradie cviku v tréningu
    
    -- Predpísané parametre od trénera/fyzioterapeuta
    target_sets integer NOT NULL DEFAULT 3,
    target_reps text, -- text kvôli formátu napr. "10-12" alebo "do únavy"
    target_duration integer, -- v sekundách (napr. pre plank / strečing)
    target_rest_seconds integer DEFAULT 60,
    notes text, -- Špecifická poznámka: "Daj pozor na rotáciu kolena!"
    
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Záznam reálne odovzdaného tréningu / cvičenia klientom (Tracker)
CREATE TABLE IF NOT EXISTS public.client_workout_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id uuid REFERENCES public.training_plans(id) ON DELETE SET NULL,
    completed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    client_feedback_rating integer CHECK (client_feedback_rating BETWEEN 1 AND 5), -- 1-najľahšie, 5-bolesť/únava
    client_notes text -- "Dnes ma pri 3. sérii mierne pichalo v ramene"
);

-- 5. Konkrétne série v reálnom logu (pre sledovanie progresu/váh)
CREATE TABLE IF NOT EXISTS public.client_workout_log_sets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id uuid NOT NULL REFERENCES public.client_workout_logs(id) ON DELETE CASCADE,
    exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
    set_index integer NOT NULL,
    reps_performed integer,
    weight_kg numeric(5,2),
    duration_seconds integer
);

-- ZAPNUTIE RLS PRE NOVÉ TABUĽKY
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_workout_log_sets ENABLE ROW LEVEL SECURITY;

-- POLITISKÉ PRAVIDLÁ PRE EXERCISES (Cviky vidia všetci, upravovať custom môže len admin/trener)
CREATE POLICY "Každý prihlásený používateľ vidí zoznam cvičení" 
ON public.exercises FOR SELECT TO authenticated USING (true);

CREATE POLICY "Zamestnanci môžu vytvárať vlastné cviky" 
ON public.exercises FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role != 'klient'
  )
);

-- POLITIKY PRE TRAINING PLANS
CREATE POLICY "Klient vidí iba svoje tréningové plány" 
ON public.training_plans FOR SELECT TO authenticated 
USING (client_id = auth.uid());

CREATE POLICY "Špecialisti vidia plány klientov" 
ON public.training_plans FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role != 'klient'
  )
);

CREATE POLICY "Špecialisti môžu vytvárať plány" 
ON public.training_plans FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role != 'klient'
  )
);
