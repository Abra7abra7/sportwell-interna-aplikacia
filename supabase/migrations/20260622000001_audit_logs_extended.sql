-- Aplikovanie triggerov na ďalšie dôležité tabuľky zobrazené na screenshote
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT unnest(ARRAY[
            'client_invitations',
            'client_specialist_assignments',
            'client_workout_log_sets',
            'client_workout_logs',
            'documents',
            'employee_invitations',
            'exercises',
            'form_templates',
            'modules',
            'plan_exercises',
            'reservations'
        ]) 
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
