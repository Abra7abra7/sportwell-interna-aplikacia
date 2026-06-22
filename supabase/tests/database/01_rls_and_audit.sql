BEGIN;
SELECT plan(3);

-- Test 1: Zistiť, či existujú RLS politiky na profiles
SELECT has_rls('public', 'profiles', 'Tabuľka profiles by mala mať zapnuté RLS');

-- Test 2: Zistiť, či existujú RLS politiky na role_permissions
SELECT has_rls('public', 'role_permissions', 'Tabuľka role_permissions by mala mať zapnuté RLS');

-- Test 3: Otestovať trigger audit logovania
INSERT INTO public.profiles (id, role, full_name) VALUES ('00000000-0000-0000-0000-000000000001', 'klient', 'Testovací Klient');

SELECT results_eq(
    'SELECT action, table_name, record_id FROM public.audit_logs WHERE record_id = ''00000000-0000-0000-0000-000000000001''',
    ARRAY['INSERT', 'profiles', '00000000-0000-0000-0000-000000000001'],
    'Vloženie do profiles by malo vytvoriť záznam v audit_logs'
);

SELECT * FROM finish();
ROLLBACK;
