-- 1. Zabezpečenie tabuľky reservations
-- Zapnutím RLS bez vytvorenia politík sa tabuľka stane úplne neprístupnou z API.
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- 2. Odstránenie nebezpečnej politiky, ktorá prelamovala Multi-Tenancy lekárskych záznamov
-- Týmto zabezpečíme, že platí iba "Trainers have access to assigned client records"
DROP POLICY IF EXISTS "client_records_all_trener_admin" ON public.client_records;

-- 3. Odstránenie duplicitných politík v iných tabuľkách pre čistotu
DROP POLICY IF EXISTS "Zamestnanci môžu vytvárať vlastné cviky" ON public.exercises;

-- (Pre tabuľku profiles zatiaľ mažeme iba starú globálnu admin politiku, 
--  nakoľko "Striktná viditeľnosť profilov" zabezpečuje bezpečný prístup).
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
