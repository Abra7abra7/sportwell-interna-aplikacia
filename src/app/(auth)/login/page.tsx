"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const {
    sessionUser,
    authEmail,
    setAuthEmail,
    handleAuthSubmit,
    handleVerifyOtp,
    isAuthLoading,
    magicLinkSent
  } = useAuthContext();

  const [otpCode, setOtpCode] = useState('');

  useEffect(() => {
    // Ak je používateľ už prihlásený, presmerujeme ho
    if (sessionUser) {
      router.push("/dashboard");
    }
  }, [sessionUser, router]);

  if (sessionUser) return null; // Zabraňuje renderovaniu počas presmerovania

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark-navy p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-brand-navy mb-6">
          Prihlásenie SportWell
        </h1>
        
        {magicLinkSent ? (
          <form onSubmit={(e) => handleVerifyOtp(e, otpCode)} className="space-y-4">
            <div className="bg-brand-light-cyan text-brand-navy p-4 rounded-md text-center">
              <p>Overovací kód bol odoslaný na:</p>
              <p className="font-bold mt-1">{authEmail}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 text-center mb-2">Zadajte 6-miestny kód z e-mailu</label>
              <input
                type="text"
                required
                maxLength={6}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 text-center text-2xl tracking-[0.5em] font-bold"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
              />
            </div>

            <button
              type="submit"
              disabled={isAuthLoading || otpCode.length < 6}
              className="w-full bg-brand-cyan hover:bg-brand-navy hover:text-white text-brand-navy font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 mt-4"
            >
              {isAuthLoading ? 'Overujem...' : 'Prihlásiť sa'}
            </button>
          </form>
        ) : (
          <form data-testid="login-form" onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Váš e-mail</label>
              <input
                type="email"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="vas@email.sk"
              />
              <p className="text-xs text-gray-500 mt-3 mb-2">
                Zadaním e-mailu a vyžiadaním prihlasovacieho odkazu súhlasíte so spracovaním e-mailovej adresy za účelom technickej autentifikácie do systému.
              </p>
            </div>

            <button
              type="submit"
              disabled={isAuthLoading || !authEmail}
              className="w-full bg-brand-cyan hover:bg-brand-navy hover:text-white text-brand-navy font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
            >
              {isAuthLoading ? 'Odosielam...' : 'Poslať kód na e-mail'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
