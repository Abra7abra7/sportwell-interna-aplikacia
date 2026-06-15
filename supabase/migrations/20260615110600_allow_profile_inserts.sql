-- Allow users to insert their own profile during GDPR onboarding
CREATE POLICY "profiles_insert_own" ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);
