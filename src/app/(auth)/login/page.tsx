"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthProvider";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');

  const {
    sessionUser,
    authEmail,
    setAuthEmail,
    authCode,
    setAuthCode,
    handleAuthSubmit,
    handleVerifyOtp,
    isAuthLoading,
    magicLinkSent
  } = useAuthContext();

  useEffect(() => {
    if (sessionUser) {
      router.push("/dashboard");
    }
  }, [sessionUser, router]);

  if (sessionUser) return null;

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
      <h1 className="text-2xl font-bold text-center text-brand-navy mb-6">
        Prihlásenie SportWell
      </h1>
      
      {errorParam === 'Invalid_link' && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md text-sm mb-6 border border-red-200">
          <strong>Neplatný odkaz!</strong> Boli ste presmerovaný kvôli bezpečnosti. <br/><br/>
          Ak ste odkaz vyžiadali na počítači, musíte ho otvoriť <strong>na počítači v rovnakom prehliadači</strong>. Ak používate iPhone, uistite sa, že e-mailový odkaz otvoríte v Safari.
        </div>
      )}

      {magicLinkSent ? (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="bg-brand-light-cyan text-brand-navy p-4 rounded-md text-center">
            <p>Overovací kód bol odoslaný na e-mail:</p>
            <p className="font-bold mt-1">{authEmail}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Zadajte kód</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-center text-xl tracking-widest"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              placeholder="12345678"
              maxLength={8}
            />
          </div>
          <button
            type="submit"
            disabled={isAuthLoading || authCode.length < 6}
            className="w-full bg-brand-cyan hover:bg-brand-navy hover:text-white text-brand-navy font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
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
              Zadaním e-mailu a vyžiadaním prihlasovacieho odkazu súhlasíte so spracovaním e-mailovej adresy za účelom technickej autentifikácie do systému. Podrobné nastavenie súkromia a GDPR súhlasov vás čaká po prvom prihlásení.
            </p>
          </div>

          <button
            type="submit"
            disabled={isAuthLoading || !authEmail}
            className="w-full bg-brand-cyan hover:bg-brand-navy hover:text-white text-brand-navy font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
          >
            {isAuthLoading ? 'Odosielam...' : 'Vyžiadať prihlasovací kód'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark-navy p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
