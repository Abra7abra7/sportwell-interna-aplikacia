"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const {
    sessionUser,
    authEmail,
    setAuthEmail,
    handleAuthSubmit,
    isAuthLoading,
    magicLinkSent
  } = useAuthContext();

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
          <div className="text-center space-y-4">
            <div className="bg-brand-light-cyan text-brand-navy p-4 rounded-md">
              <p>Odkaz na prihlásenie bol odoslaný na e-mail:</p>
              <p className="font-bold mt-1">{authEmail}</p>
            </div>
            <p className="text-sm text-gray-600">Kliknite na odkaz v e-maile pre prihlásenie.</p>
          </div>
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
                Zadaním e-mailu a vyžiadaním prihlasovacieho odkazu súhlasíte so spracovaním e-mailovej adresy za účelom technickej autentifikácie do systému. Podrobné nastavenie súkromia a GDPR súhlasov vás čaká po prvom prihlásení.
              </p>
            </div>

            <button
              type="submit"
              disabled={isAuthLoading || !authEmail}
              className="w-full bg-brand-cyan hover:bg-brand-navy hover:text-white text-brand-navy font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
            >
              {isAuthLoading ? 'Odosielam...' : 'Poslať prihlasovací odkaz'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
