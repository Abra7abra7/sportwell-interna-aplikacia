-- Create invitations table
CREATE TABLE IF NOT EXISTS public.employee_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    role_title TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for invitations
ALTER TABLE public.employee_invitations ENABLE ROW LEVEL SECURITY;

-- Admins can do anything with invitations
CREATE POLICY "Admins manage invitations" ON public.employee_invitations
    FOR ALL
    USING (is_specialist(auth.uid()) AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Users logging in can read their own invitation by email
-- But email from auth is not available directly in RLS without knowing their UUID.
-- However, we only fetch the invitation in an Edge function, or we can just let authenticated users read invitations matching their auth.jwt() email.
-- Since we are doing it client-side after Auth succeeds, we can use `auth.jwt() ->> 'email'`.
CREATE POLICY "Users can read own invitation" ON public.employee_invitations
    FOR SELECT
    USING (email = (auth.jwt() ->> 'email'));

-- Users can delete their invitation once they have used it
CREATE POLICY "Users can delete own invitation" ON public.employee_invitations
    FOR DELETE
    USING (email = (auth.jwt() ->> 'email'));
