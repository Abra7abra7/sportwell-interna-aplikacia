-- Oprava pre chýbajúci stĺpec changed_by v tabuľke audit_logs
ALTER TABLE IF EXISTS public.audit_logs 
ADD COLUMN IF NOT EXISTS changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
