"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { Logo } from "@/components/layout/Logo";

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
    magicLinkSent,
    setMagicLinkSent
  } = useAuthContext();

  useEffect(() => {
    if (sessionUser) {
      router.push("/dashboard");
    }
  }, [sessionUser, router]);

  if (sessionUser) return null;

  return (
    <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="md:hidden mb-8 flex justify-center">
        <Logo className="h-12" darkText={true} />
      </div>

      <div className="bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
        <h2 className="text-3xl font-black text-brand-navy mb-2 tracking-tight">Vitajte späť</h2>
        <p className="text-gray-500 mb-8 text-sm">Prihláste sa do svojho účtu a pokračujte vo svojej ceste za zdravím.</p>
        
        {errorParam === 'Invalid_link' && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm mb-6 border border-red-100 flex gap-3">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <div>
              <strong>Neplatný odkaz!</strong> Boli ste presmerovaný kvôli bezpečnosti. <br/><br/>
              Otvorte odkaz <strong>v rovnakom prehliadači</strong>, v ktorom ste ho vyžiadali. Ak používate iPhone, otvorte ho v Safari.
            </div>
          </div>
        )}

        {magicLinkSent ? (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="bg-brand-light-cyan/50 text-brand-navy p-5 rounded-2xl text-center border border-brand-light-cyan">
              <p className="text-sm font-medium">Overovací kód bol odoslaný na:</p>
              <p className="font-bold text-lg mt-1">{authEmail}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Zadajte overovací kód</label>
              <input
                type="text"
                required
                className="block w-full rounded-2xl border-0 bg-gray-50/50 px-4 py-4 text-center text-3xl font-black tracking-[0.3em] text-brand-navy shadow-inner focus:ring-2 focus:ring-brand-cyan focus:bg-white transition-all"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder="12345678"
                maxLength={8}
              />
            </div>
            <button
              type="submit"
              disabled={isAuthLoading || authCode.length < 6}
              className="w-full bg-brand-cyan hover:bg-[#00D0E0] text-brand-dark-navy font-black py-4 px-4 rounded-2xl transition-all duration-300 shadow-[0_4px_14px_0_rgba(0,240,255,0.39)] hover:shadow-[0_6px_20px_rgba(0,240,255,0.23)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {isAuthLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-brand-dark-navy" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Overujem...
                </span>
              ) : 'Prihlásiť sa'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMagicLinkSent(false);
                setAuthCode('');
              }}
              className="w-full bg-transparent hover:bg-gray-50 text-gray-500 font-semibold py-3 px-4 rounded-2xl transition-all duration-300 border border-gray-200"
            >
              Späť / Zmeniť e-mail
            </button>
          </form>
        ) : (
          <form data-testid="login-form" onSubmit={handleAuthSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">E-mailová adresa</label>
              <input
                type="email"
                required
                className="block w-full rounded-2xl border-0 bg-gray-50 px-4 py-4 text-brand-navy font-medium shadow-inner focus:ring-2 focus:ring-brand-cyan focus:bg-white transition-all placeholder:text-gray-300"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="vas@email.sk"
              />
            </div>

            <button
              type="submit"
              disabled={isAuthLoading || !authEmail}
              className="w-full bg-brand-navy hover:bg-brand-dark-navy text-white font-bold py-4 px-4 rounded-2xl transition-all duration-300 shadow-[0_4px_14px_0_rgba(10,25,47,0.39)] hover:shadow-[0_6px_20px_rgba(10,25,47,0.23)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {isAuthLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Odosielam...
                </span>
              ) : 'Získať prihlasovací kód'}
            </button>
            
            <p className="text-[11px] text-gray-400 text-center leading-relaxed px-4 pt-2">
              Prihlásenie prebieha bezpečne bez hesla. Kód vám zašleme na e-mail. Vaše údaje sú spracovávané v súlade s GDPR.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-brand-off-white overflow-hidden">
      {/* Ľavá časť - Branding (Skrytá na mobiloch) */}
      <div className="hidden md:flex flex-col md:w-1/2 lg:w-3/5 bg-brand-dark-navy relative overflow-hidden justify-center items-center p-12">
        {/* Dekoratívne elementy na pozadí */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-cyan opacity-10 blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#00A2D3] opacity-20 blur-[150px]"></div>
        </div>

        <div className="relative z-10 w-full max-w-lg animate-in fade-in slide-in-from-left-8 duration-1000">
          <Logo className="h-16 mb-12 drop-shadow-2xl" showText={true} darkText={false} />
          <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-6 tracking-tight">
            Vaše centrum pre <span className="text-brand-cyan">zdravie</span> a <span className="text-brand-cyan">pohyb</span>.
          </h1>
          <p className="text-lg text-gray-400 mb-12 max-w-md leading-relaxed">
            Inovatívna platforma spájajúca odborníkov, fyzioterapeutov a trénerov s vaším telom.
          </p>

          <div className="flex items-center gap-6">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-brand-dark-navy bg-gradient-to-br from-brand-cyan to-[#00A2D3] flex items-center justify-center font-bold text-brand-dark-navy text-xs shadow-lg">
                  {['JD', 'AM', 'MK', 'PK'][i-1]}
                </div>
              ))}
            </div>
            <p className="text-sm font-medium text-gray-300">
              Pridajte sa k <strong className="text-white">stovkám</strong> spokojných klientov.
            </p>
          </div>
        </div>
      </div>

      {/* Pravá časť - Login Form */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col items-center justify-center p-6 relative">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none md:hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[60%] rounded-full bg-brand-cyan opacity-10 blur-[100px]"></div>
        </div>
        
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-cyan mb-4"></div>
            <p className="text-gray-400 font-medium">Načítavam...</p>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
