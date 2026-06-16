"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthProvider";

// Pomocná funkcia na ikony
function getIconForId(id: string) {
  switch (id) {
    case "dashboard":
      return <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>;
    case "plan":
      return <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>;
    case "dokumenty":
      return <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>;
    case "klienti":
      return <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>;
    case "diagnostika":
      return <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>;
    case "cviky":
      return <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>;
    case "sablony":
      return <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path></svg>;
    case "zamestnanci":
      return <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>;
    default:
      return null;
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { sessionUser, currentUserProfile, handleSignOut, authInitialized } = useAuthContext();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && authInitialized && !sessionUser) {
      router.push("/login");
    }
  }, [mounted, authInitialized, sessionUser, router]);

  const isClient = currentUserProfile?.role === "klient";
  const pathname = usePathname();

  useEffect(() => {
    // Zavrieť mobilné menu pri zmene cesty
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mounted && authInitialized && isClient && !currentUserProfile?.gdpr_signed_at && pathname !== '/gdpr') {
      router.push('/gdpr');
    }
  }, [mounted, authInitialized, isClient, currentUserProfile?.gdpr_signed_at, pathname, router]);

  if (!mounted || !authInitialized || !sessionUser || !currentUserProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark-navy text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-cyan"></div>
      </div>
    );
  }

  // Ak je klient na GDPR obrazovke, chceme mu schovať bežnú navigáciu, aby musel formulár dokončiť.
  if (isClient && !currentUserProfile.gdpr_signed_at && pathname === '/gdpr') {
    return <main className="min-h-screen bg-brand-off-white">{children}</main>;
  }

  const role = currentUserProfile.role;
  
  // RBAC: Priradenie položiek menu podľa rolí
  let navigationItems = [{ id: "dashboard", label: "Dashboard", href: "/dashboard" }];

  if (isClient) {
    navigationItems.push({ id: "plan", label: "Moje Cviky", href: "/plan" });
    navigationItems.push({ id: "dokumenty", label: "Dokumenty", href: "/dokumenty" });
  } else {
    // Všetci zamestnanci vidia klientov
    navigationItems.push({ id: "klienti", label: "Klienti", href: "/klienti" });

    // Lekárska sekcia (Diagnostika)
    if (["admin", "majitel", "lekar", "fyzioterapeut", "maser", "nutricny_poradca"].includes(role)) {
      navigationItems.push({ id: "diagnostika", label: "Diagnostika", href: "/diagnostika" });
    }

    // Tréningová sekcia (Plány a Cviky)
    if (["admin", "majitel", "lekar", "fyzioterapeut", "fitness_trener", "trener"].includes(role)) {
      navigationItems.push({ id: "plan", label: "Tréningové Plány", href: "/plan" });
      navigationItems.push({ id: "cviky", label: "Databáza Cvikov", href: "/cviky" });
    }

    // Správcovská sekcia
    if (["admin", "majitel"].includes(role)) {
      navigationItems.push({ id: "sablony", label: "Šablóny a Formuláre", href: "/sablony" });
      navigationItems.push({ id: "zamestnanci", label: "Zamestnanci", href: "/zamestnanci" });
    }
  }

  return (
    <div className="min-h-screen bg-brand-off-white flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-brand-dark-navy text-white min-h-screen shadow-2xl z-20">
        <div className="p-6">
          <h1 className="text-3xl font-black tracking-tight text-white mb-0.5">Sport<span className="text-brand-cyan">Well</span></h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white/10 inline-block px-2 py-0.5 rounded">
            {currentUserProfile.role}
          </p>
        </div>
        <nav className="flex-1 px-4 space-y-1.5 mt-4">
          {navigationItems.map((item) => {
            const isActive = pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard');
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-brand-cyan text-brand-dark-navy shadow-lg shadow-brand-cyan/20"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="mr-3">{getIconForId(item.id)}</span>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-5 bg-black/20 m-4 rounded-2xl">
          <div className="flex items-center mb-4">
            <div className="h-10 w-10 rounded-full bg-brand-cyan text-brand-dark-navy flex items-center justify-center font-bold">
              {currentUserProfile.full_name.charAt(0)}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{currentUserProfile.full_name}</p>
              <p className="text-xs text-gray-400 truncate">{currentUserProfile.email}</p>
            </div>
          </div>
          <button
            onClick={() => { handleSignOut(); router.push("/login"); }}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-bold py-2.5 px-4 rounded-xl transition-all duration-200 text-sm flex justify-center items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Odhlásiť sa
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 overflow-y-auto w-full transition-all duration-300 ${isClient ? 'pb-24' : 'pb-6'} md:pb-8`}>
        
        {/* Mobile Header (Hamburger Menu / Logo) */}
        <header className="md:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center">
            <h1 className="text-xl font-black text-brand-navy">Sport<span className="text-brand-cyan">Well</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-brand-light-cyan text-brand-navy flex items-center justify-center font-bold text-sm">
              {currentUserProfile.full_name.charAt(0)}
            </div>
            {!isClient && (
              <button 
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 -mr-2 text-brand-navy hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </button>
            )}
          </div>
        </header>

        {/* The Page Content */}
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Bottom Navigation for Mobile (ONLY FOR CLIENTS) */}
      {isClient && (
        <nav className="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 flex justify-around p-2 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
          {navigationItems.map((item) => {
            const isActive = pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard');
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all w-20 ${
                  isActive ? "text-brand-cyan scale-105" : "text-gray-400 hover:text-brand-navy"
                }`}
              >
                {getIconForId(item.id)}
                <span className={`text-[10px] mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Full-Screen Mobile Menu for Trainers/Admins */}
      {!isClient && mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-brand-dark-navy text-white flex flex-col animate-in slide-in-from-right-full duration-300">
          <div className="p-4 flex justify-between items-center border-b border-white/10 bg-brand-navy">
            <h1 className="text-2xl font-black">Sport<span className="text-brand-cyan">Well</span> Menu</h1>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard');
              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.href)}
                  className={`w-full flex items-center px-4 py-4 rounded-2xl text-lg font-bold transition-all ${
                    isActive
                      ? "bg-brand-cyan text-brand-dark-navy shadow-lg"
                      : "text-gray-300 hover:bg-white/10"
                  }`}
                >
                  <span className="mr-4">{getIconForId(item.id)}</span>
                  {item.label}
                </button>
              );
            })}
          </div>
          
          <div className="p-6 bg-brand-navy border-t border-white/10">
             <div className="mb-4">
               <p className="font-bold text-white text-lg">{currentUserProfile.full_name}</p>
               <p className="text-brand-cyan text-sm">{currentUserProfile.role.toUpperCase()}</p>
             </div>
             <button
              onClick={() => { handleSignOut(); router.push("/login"); }}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-4 rounded-2xl transition-all shadow-lg flex justify-center items-center"
             >
               <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
               Odhlásiť sa
             </button>
          </div>
        </div>
      )}

    </div>
  );
}
