"use client";

import React from "react";
import { useAuthContext } from "@/components/providers/AuthProvider";

export default function PlanPage() {
  const { currentUserProfile } = useAuthContext();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-brand-navy">
          {currentUserProfile?.role === "klient" ? "Moje Cviky" : "Tréningové Plány"}
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Modul pre tréningové plány bol úspešne oddelený. Pre trénerov tu bude zoznam, pre klientov ich domáce cviky.</p>
      </div>
    </div>
  );
}
