-- 1. Pridanie nových stĺpcov do tabuľky exercises
ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS video_url text;

-- 2. Pridanie politiky pre UPDATE a DELETE cvičení
-- a) Špecialisti môžu upravovať a mazať IBA vlastné cviky
CREATE POLICY "Špecialisti môžu upravovať vlastné cviky" 
ON public.exercises FOR UPDATE TO authenticated 
USING (
  created_by = auth.uid() AND is_custom = true
);

CREATE POLICY "Špecialisti môžu zmazať vlastné cviky" 
ON public.exercises FOR DELETE TO authenticated 
USING (
  created_by = auth.uid() AND is_custom = true
);

-- b) Super User bypass pre admina (Admin a Majiteľ môžu všetko)
-- Toto už je zabezpečené globálne cez `has_role_permission` v RLS, 
-- ale pre istotu vytvoríme admin explicit rule pre mazanie a update:
CREATE POLICY "Admin a Majiteľ môžu upravovať akékoľvek cviky" 
ON public.exercises FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'majitel')
  )
);

CREATE POLICY "Admin a Majiteľ môžu zmazať akékoľvek cviky" 
ON public.exercises FOR DELETE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'majitel')
  )
);

-- 3. Vytvorenie nového storage bucketu pre videá k cvikom
INSERT INTO storage.buckets (id, name, public) 
VALUES ('exercise_videos', 'exercise_videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS pre exercise_videos
CREATE POLICY "Videá k cvikom sú verejne čitateľné"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'exercise_videos');

CREATE POLICY "Zamestnanci môžu nahrávať videá k cvikom"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'exercise_videos' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role != 'klient'
  )
);

CREATE POLICY "Vlastník môže zmazať video"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'exercise_videos' AND
  owner = auth.uid()
);
