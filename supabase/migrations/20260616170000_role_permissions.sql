-- 1. Vytvorenie tabuľky dostupných modulov aplikácie
CREATE TABLE IF NOT EXISTS public.modules (
    id text PRIMARY KEY,
    name text NOT NULL,
    description text
);

-- 2. Vytvorenie matice oprávnení
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    role user_role NOT NULL,
    module_id text NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    can_read boolean DEFAULT false,
    can_write boolean DEFAULT false,
    can_delete boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(role, module_id)
);

-- 3. Naplnenie statických modulov do systému
INSERT INTO public.modules (id, name, description) VALUES
('dashboard', 'Prehľad / Nástenka', 'Hlavná obrazovka po prihlásení'),
('zamestnanci', 'Zamestnanci', 'Správa personálu a rolí'),
('sablony', 'Šablóny a Formuláre', 'Správa dynamických dotazníkov a formulárov'),
('cviky', 'Databáza Cvikov', 'Katalóg všetkých dostupných cvičení'),
('plan', 'Tréningové Plány', 'Vytváranie a správa tréningových plánov klientov'),
('diagnostika', 'Diagnostika', 'Medicínske záznamy a zdravotný stav klientov'),
('klienti', 'Zoznam Klientov', 'Zoznam klientov, čakáreň a ich profily'),
('dokumenty', 'Dokumenty a Zmluvy', 'Generovanie a archivácia zmlúv a reportov')
ON CONFLICT (id) DO NOTHING;

-- 4. Funkcia pre overenie oprávnení na strane databázy a RLS
CREATE OR REPLACE FUNCTION public.has_permission(p_module_id text, p_action text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role user_role;
    v_result boolean;
BEGIN
    SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
    
    IF v_role IS NULL THEN
        RETURN false;
    END IF;

    -- Admin a majiteľ majú vždy bezvýhradný prístup (Super User pattern)
    IF v_role IN ('admin', 'majitel') THEN
        RETURN true;
    END IF;

    IF p_action = 'read' THEN
        SELECT can_read INTO v_result FROM public.role_permissions WHERE role = v_role AND module_id = p_module_id;
    ELSIF p_action = 'write' THEN
        SELECT can_write INTO v_result FROM public.role_permissions WHERE role = v_role AND module_id = p_module_id;
    ELSIF p_action = 'delete' THEN
        SELECT can_delete INTO v_result FROM public.role_permissions WHERE role = v_role AND module_id = p_module_id;
    END IF;

    RETURN COALESCE(v_result, false);
END;
$$;

-- 5. Nastavenie RLS politík
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Každý vidí moduly" ON public.modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Každý vidí oprávnenia" ON public.role_permissions FOR SELECT TO authenticated USING (true);

-- Upravovať maticu môže len majiteľ a admin (security definer obchádzka, aby sme sa vyhli rekurzii)
CREATE POLICY "Admini spravujú maticu" ON public.role_permissions FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'majitel')
  )
);

-- 6. Generovanie základnej "Default" Matice pre existujúce roly (aby po spustení skriptu nezmizlo zamestnancom menu)
DO $$
DECLARE
    r RECORD;
    m RECORD;
BEGIN
    FOR r IN SELECT unnest(enum_range(NULL::user_role)) AS r_name LOOP
        FOR m IN SELECT id FROM public.modules LOOP
            INSERT INTO public.role_permissions (role, module_id, can_read, can_write, can_delete)
            VALUES (
                r.r_name, 
                m.id, 
                -- Logika "Read" prístupu pre zachovanie as-is stavu
                CASE 
                    WHEN r.r_name IN ('admin', 'majitel') THEN true
                    WHEN r.r_name = 'klient' AND m.id IN ('dashboard', 'plan', 'dokumenty') THEN true
                    WHEN r.r_name NOT IN ('klient', 'recepcia') AND m.id IN ('dashboard', 'klienti', 'plan', 'cviky') THEN true
                    WHEN r.r_name IN ('lekar', 'fyzioterapeut', 'maser', 'nutricny_poradca') AND m.id = 'diagnostika' THEN true
                    ELSE false
                END,
                -- Logika "Write" prístupu
                CASE 
                    WHEN r.r_name IN ('admin', 'majitel') THEN true
                    WHEN r.r_name NOT IN ('klient', 'recepcia') AND m.id IN ('plan', 'cviky', 'klienti') THEN true
                    WHEN r.r_name IN ('lekar', 'fyzioterapeut') AND m.id = 'diagnostika' THEN true
                    ELSE false
                END,
                -- Logika "Delete" prístupu
                CASE 
                    WHEN r.r_name IN ('admin', 'majitel') THEN true
                    ELSE false
                END
            )
            ON CONFLICT (role, module_id) DO NOTHING;
        END LOOP;
    END LOOP;
END;
$$;
