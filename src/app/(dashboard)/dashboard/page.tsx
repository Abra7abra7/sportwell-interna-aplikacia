"use client";

import React from "react";
import { useAuthContext } from "@/components/providers/AuthProvider";

export default function DashboardPage() {
  const { currentUserProfile } = useAuthContext();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-brand-navy">
          Vitajte späť, {currentUserProfile?.full_name}!
        </h2>
        <p className="text-gray-500 mt-2">
          Toto je váš prehľad v systéme SportWell. Zvoľte si akciu v menu.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-brand-light-cyan p-6 rounded-xl border border-brand-cyan/20">
          <h3 className="font-bold text-brand-navy mb-2">Rýchle akcie</h3>
          <p className="text-sm text-gray-700">
            {currentUserProfile?.role === "klient" 
              ? "Skontrolujte si svoje domáce cvičenia v záložke Moje Cviky." 
              : "Prejdite do sekcie Klienti alebo Diagnostika pre prácu s pacientmi."}
          </p>
        </div>
      </div>
    </div>
  );
}
