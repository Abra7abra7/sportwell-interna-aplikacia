-- Umožňuje zmazať používateľa z tabuľky auth.users (čím sa kaskádovo zmaže všetko v public.profiles)
-- Zabezpečené cez SECURITY DEFINER a dodatočnú kontrolu roly
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Skontrolujeme, či je volajúci používateľ skutočne prihlásený a je admin/majitel
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'majitel')
  ) THEN
    RAISE EXCEPTION 'Iba Administrátor alebo Majiteľ má právo vymazať konto klienta z databázy.';
  END IF;

  -- 2. Zmažeme používateľa priamo z jadra auth.users
  -- Toto vyvolá kaskádové zmazanie (ON DELETE CASCADE), ak je foreign key na profile dobre nastavený
  DELETE FROM auth.users WHERE id = user_id;
  
  -- Ak by kaskáda nebola nastavená, pre istotu:
  DELETE FROM public.profiles WHERE id = user_id;
END;
$$;
