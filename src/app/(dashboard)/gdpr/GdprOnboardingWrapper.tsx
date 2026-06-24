"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import GdprWizard, { ClientProfile } from '@/components/gdpr/GdprWizard';
import { submitGdprConsent } from './actions';

interface GdprOnboardingWrapperProps {
  sessionUser: any;
  currentUserProfile: ClientProfile;
}

export default function GdprOnboardingWrapper({
  sessionUser,
  currentUserProfile
}: GdprOnboardingWrapperProps) {
  const router = useRouter();
  const supabase = createClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (data: any) => {
    setErrorMsg(null);
    try {
      await submitGdprConsent({
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: data.birthDate,
        address: data.address,
        email: data.email,
        phone: data.phone,
        primaryInterest: data.primaryInterest,
        marketingAccepted: data.marketingAccepted,
        metaAccepted: data.metaAccepted,
        diagAccepted: data.diagAccepted
      });
      
      // Presmerovanie na dashboard po úspešnom uložení
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Nastala chyba pri ukladaní GDPR súhlasu.');
      throw err;
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div>
      {errorMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg font-bold">
          {errorMsg}
        </div>
      )}
      <GdprWizard
        sessionUser={sessionUser}
        currentUserProfile={currentUserProfile}
        onSubmit={handleSubmit}
        onSignOut={handleSignOut}
      />
    </div>
  );
}
