"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { sessionUser, currentUserProfile, handleSignOut, authInitialized } = useAuthContext();
  const [mounted, setMounted] = useState(false);

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
    if (mounted && authInitialized && isClient && !currentUserProfile?.gdpr_signed_at && pathname !== '/gdpr') {
      router.push('/gdpr');
    }
  }, [mounted, authInitialized, isClient, currentUserProfile?.gdpr_signed_at, pathname, router]);

  if (!mounted || !authInitialized || !sessionUser || !currentUserProfile) {
    return <div className="min-h-screen flex items-center justify-center bg-brand-dark-navy text-white">Načítavam...</div>;
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
      <aside className="hidden md:flex flex-col w-64 bg-brand-dark-navy text-white min-h-screen shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-brand-cyan">SportWell</h1>
          <p className="text-xs text-gray-400 mt-1">
            {currentUserProfile.role.toUpperCase()}
          </p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-brand-cyan text-brand-dark-navy shadow-md transform scale-[1.02]"
                    : "text-gray-300 hover:bg-brand-navy hover:text-white hover:pl-5"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-brand-navy">
          <div className="mb-4">
            <p className="text-sm font-medium">{currentUserProfile.full_name}</p>
            <p className="text-xs text-gray-400">{currentUserProfile.email}</p>
          </div>
          <button
            onClick={() => {
              handleSignOut();
              router.push("/login");
            }}
            className="w-full bg-red-600/90 hover:bg-red-500 text-white font-bold py-2 px-4 rounded transition-all duration-200 shadow-sm hover:shadow-md text-sm"
          >
            Odhlásiť sa
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
        <header className="md:hidden flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-brand-navy">SportWell</h1>
            <p className="text-xs text-gray-500">{currentUserProfile.full_name}</p>
          </div>
          <button
            onClick={() => {
              handleSignOut();
              router.push("/login");
            }}
            className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded"
          >
            Odhlásiť
          </button>
        </header>

        {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-3 z-50 shadow-lg pb-safe">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => router.push(item.href)}
            className="flex flex-col items-center justify-center p-2 text-gray-500 hover:text-brand-cyan transition-colors"
          >
            <span className="text-xs font-medium mt-1">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
