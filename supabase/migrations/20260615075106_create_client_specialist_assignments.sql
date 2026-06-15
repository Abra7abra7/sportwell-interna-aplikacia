-- 1. Create the new assignment table
CREATE TABLE public.client_specialist_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    specialist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    assigned_by UUID REFERENCES public.profiles(id),
    UNIQUE(client_id, specialist_id)
);

ALTER TABLE public.client_specialist_assignments ENABLE ROW LEVEL SECURITY;

-- Security definer functions for safe RLS checks
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
begin
  return exists (
    select 1 from public.profiles
    where id = user_id and role = 'admin'
  );
end;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_trener(user_id uuid)
RETURNS boolean AS $$
begin
  return exists (
    select 1 from public.profiles
    where id = user_id and role = 'trener'
  );
end;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Policies for the new assignments table
CREATE POLICY "Admins can do everything on assignments"
ON public.client_specialist_assignments
FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Specialists can view their assignments"
ON public.client_specialist_assignments
FOR SELECT
TO authenticated
USING (specialist_id = auth.uid());

CREATE POLICY "Clients can view their assignments"
ON public.client_specialist_assignments
FOR SELECT
TO authenticated
USING (client_id = auth.uid());

-- 3. Modify Profiles policies
-- Remove the old policy that gave specialists access to all profiles
DROP POLICY IF EXISTS "profiles_select_specialist" ON public.profiles;

-- Admin can see all profiles
CREATE POLICY "profiles_select_admin"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Trener can see themselves, other specialists, and their assigned clients
CREATE POLICY "profiles_select_assigned_trener"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    is_trener(auth.uid()) AND (
        role IN ('admin', 'trener')
        OR
        id IN (
            SELECT client_id FROM public.client_specialist_assignments
            WHERE specialist_id = auth.uid()
        )
    )
);

-- 4. Restrict client_records to assigned trainers (and admins)
DROP POLICY IF EXISTS "Specialisti maju plny pristup k zaznamom" ON public.client_records;
DROP POLICY IF EXISTS "client_records_specialist_all" ON public.client_records; -- just in case it's named like this

CREATE POLICY "Admins have full access to client records"
ON public.client_records
FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Trainers have access to assigned client records"
ON public.client_records
FOR ALL
TO authenticated
USING (
    is_trener(auth.uid()) AND (
        client_id IN (
            SELECT client_id FROM public.client_specialist_assignments
            WHERE specialist_id = auth.uid()
        )
    )
);
