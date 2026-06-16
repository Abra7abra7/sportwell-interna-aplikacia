ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'fitness_trener';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'fyzioterapeut';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'maser';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'nutricny_poradca';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'lekar';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'recepcia';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'majitel';

-- Upravíme RLS pre client_records (fyzioterapeut a lekar vidia vsetko pre svojich klientov, ostatní nie, alebo podľa potreby. V MVP zatiaľ len rozširujeme enum)
