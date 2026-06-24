import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import GdprOnboardingWrapper from './GdprOnboardingWrapper';

export default async function GdprPage() {
  const supabase = await createClient();

  // 1. Získanie autentifikovaného používateľa na serveri
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // 2. Načítanie profilu z databázy
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Ak už má podpísané GDPR, presmerujeme ho na dashboard
  if (profile?.gdpr_signed_at) {
    redirect('/dashboard');
  }

  // 3. Kontrola predregistrácie (čakárne) pre predvyplnenie údajov
  const { data: invite } = await supabase
    .from('client_invitations')
    .select('*')
    .eq('email', user.email)
    .single();

  // Konštrukcia pre-fill profilu
  const profileWithPrefill = {
    id: user.id,
    role: (profile?.role || 'klient') as any,
    full_name: profile?.full_name || (invite ? `${invite.first_name} ${invite.last_name}` : ''),
    phone: profile?.phone || invite?.phone || '',
    gdpr_signed_at: profile?.gdpr_signed_at || null,
    metadata: {
      ...(profile?.metadata || {}),
      firstName: invite?.first_name || '',
      lastName: invite?.last_name || '',
      address: profile?.metadata?.address || invite?.address || '',
      birthDate: profile?.metadata?.birthDate || '',
      serviceInterest: profile?.metadata?.serviceInterest || ''
    }
  };

  return (
    <main className="min-h-screen bg-[#020C1B] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <GdprOnboardingWrapper
        sessionUser={user}
        currentUserProfile={profileWithPrefill}
      />
    </main>
  );
}
