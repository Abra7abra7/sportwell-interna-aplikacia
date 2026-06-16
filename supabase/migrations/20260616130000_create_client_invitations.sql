-- Vytvorenie tabuľky pre pred-registrácie klientov
create table public.client_invitations (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    first_name text not null,
    last_name text not null,
    phone text,
    address text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_by uuid references public.profiles(id)
);

-- Zapnutie RLS
alter table public.client_invitations enable row level security;

-- Admini a tréneri môžu spravovať pozvánky
create policy "Admins and trainers can manage client invitations"
    on public.client_invitations
    for all
    using (public.is_specialist(auth.uid()));

-- Prihlásený užívateľ (klient bez profilu) môže čítať iba vlastnú pozvánku podľa e-mailu
create policy "Users can view their own invitations"
    on public.client_invitations
    for select
    using (email = (auth.jwt() ->> 'email'));

-- Prihlásený užívateľ môže po úspešnej registrácii vymazať svoju pozvánku
create policy "Users can delete their own invitations"
    on public.client_invitations
    for delete
    using (email = (auth.jwt() ->> 'email'));
