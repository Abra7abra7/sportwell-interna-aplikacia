-- Vytvorenie RPC funkcie pre vymazanie osirelého používateľa
-- Spustite tento skript v Supabase SQL Editore.

CREATE OR REPLACE FUNCTION public.clean_orphaned_auth_user(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_profile_exists boolean;
BEGIN
    -- Nájdi používateľa v auth.users podľa e-mailu
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = p_email
    LIMIT 1;

    -- Ak používateľ neexistuje, vráť false
    IF v_user_id IS NULL THEN
        RETURN false;
    END IF;

    -- Skontroluj, či má profil v public.profiles
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = v_user_id
    ) INTO v_profile_exists;

    -- Ak nemá profil (je osirelý), vymaž ho z auth.users
    IF NOT v_profile_exists THEN
        DELETE FROM auth.users WHERE id = v_user_id;
        RETURN true;
    END IF;

    RETURN false;
END;
$$;
