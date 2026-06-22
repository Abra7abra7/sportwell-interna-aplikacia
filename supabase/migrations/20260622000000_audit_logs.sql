-- 1. Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name text NOT NULL,
    record_id text NOT NULL,
    action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data jsonb,
    new_data jsonb,
    changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    changed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins/majitel can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'majitel')
    )
);

-- No one can update or delete audit logs manually
CREATE POLICY "No updates on audit logs" ON public.audit_logs FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No deletes on audit logs" ON public.audit_logs FOR DELETE TO authenticated USING (false);

-- 3. Create generic trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_data jsonb := NULL;
    v_new_data jsonb := NULL;
    v_record_id text;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
        v_record_id := OLD.id::text;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        v_record_id := NEW.id::text;
    ELSIF (TG_OP = 'INSERT') THEN
        v_new_data := to_jsonb(NEW);
        v_record_id := NEW.id::text;
    END IF;

    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        action,
        old_data,
        new_data,
        changed_by
    ) VALUES (
        TG_TABLE_NAME::text,
        v_record_id,
        TG_OP,
        v_old_data,
        v_new_data,
        auth.uid()
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- 4. Apply triggers to critical tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT unnest(ARRAY['profiles', 'role_permissions', 'training_plans', 'client_records']) 
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS audit_trigger_%1$I ON public.%1$I;
            CREATE TRIGGER audit_trigger_%1$I
            AFTER INSERT OR UPDATE OR DELETE ON public.%1$I
            FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
        ', t);
    END LOOP;
END;
$$;
