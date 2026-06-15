"use client";

import React from "react";
import { useAuthContext } from "@/components/providers/AuthProvider";

export default function DokumentyPage() {
  const { currentUserProfile } = useAuthContext();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-brand-navy">Dokumenty</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Sekcia pre dokumenty (GDPR súhlasy a iné zmluvy) bude implementovaná čoskoro.</p>
        
        {currentUserProfile?.gdpr_signed_at && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg inline-block">
            <p className="text-green-700 font-bold">Váš GDPR súhlas je zaznamenaný zo dňa:</p>
            <p className="text-green-600">{new Date(currentUserProfile.gdpr_signed_at).toLocaleDateString()}</p>
          </div>
        )}
      </div>
    </div>
  );
}
