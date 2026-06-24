"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface ClientProfile {
  id: string;
  full_name: string;
}

interface FormTemplate {
  id: string;
  title: string;
}

interface DashboardOverviewProps {
  initialTemplates: FormTemplate[];
  initialClients: ClientProfile[];
  profile: {
    role: string;
    full_name: string;
  };
}

export default function DashboardOverview({
  initialTemplates,
  initialClients,
  profile,
}: DashboardOverviewProps) {
  const router = useRouter();
  const [selectedTemplateToFill, setSelectedTemplateToFill] = useState<FormTemplate | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const handleStartDiagnostic = () => {
    if (!selectedTemplateToFill || !selectedClientId) return;
    router.push(`/diagnostika/vyplnit/${selectedTemplateToFill.id}?clientId=${selectedClientId}`);
  };

  const isClient = profile.role === "klient";

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-navy tracking-tight">
          Vitajte späť, {profile.full_name}!
        </h2>
        <p className="text-gray-500 font-medium mt-2">
          Toto je váš prehľad v systéme SportWell. Zvoľte si akciu v ľavom menu.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Actions Card */}
        <div className="bg-brand-light-cyan/40 p-6 rounded-2xl border border-brand-cyan/20 md:col-span-1 flex flex-col justify-between min-h-[160px]">
          <div>
            <h3 className="font-bold text-brand-navy text-lg mb-2">Rýchle akcie</h3>
            <p className="text-sm text-gray-700 font-medium leading-relaxed">
              {isClient
                ? "Skontrolujte si svoje domáce cvičenia a tréningové plány v záložke Moje Cviky."
                : "Prejdite do sekcie Klienti alebo Diagnostika pre správu a vyšetrenia pacientov."}
            </p>
          </div>
          {isClient ? (
            <button
              onClick={() => router.push("/plan")}
              className="mt-4 w-full h-11 bg-brand-navy hover:bg-brand-dark-navy text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center cursor-pointer"
            >
              Zobraziť Moje Cviky
            </button>
          ) : (
            <button
              onClick={() => router.push("/klienti")}
              className="mt-4 w-full h-11 bg-brand-navy hover:bg-brand-dark-navy text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center cursor-pointer"
            >
              Zobraziť Zoznam Klientov
            </button>
          )}
        </div>

        {/* Quick Diagnostics (Employees only) */}
        {!isClient && (
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <h3 className="font-bold text-brand-navy text-lg mb-4">Rýchla Diagnostika</h3>
            {initialTemplates.length === 0 ? (
              <p className="text-sm text-gray-500 font-medium">Zatiaľ nie sú k dispozícii žiadne aktívne šablóny.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                {initialTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplateToFill(template)}
                    className="bg-brand-navy hover:bg-brand-dark-navy text-white p-4 rounded-xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all flex items-center gap-3 text-left cursor-pointer group"
                  >
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-brand-cyan group-hover:scale-105 transition-transform shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="font-bold text-sm leading-tight">{template.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal for Client Selection */}
      {selectedTemplateToFill && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-brand-navy mb-1.5">Vyberte klienta</h3>
            <p className="text-sm text-gray-500 mb-5">
              Spustiť formulár: <strong className="text-brand-navy">{selectedTemplateToFill.title}</strong>
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Klient</label>
              <select
                className="w-full h-11 border border-gray-300 rounded-xl px-3 text-sm focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none transition-all bg-gray-50 font-medium"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
              >
                <option value="">-- Zvoľte klienta --</option>
                {initialClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                onClick={() => {
                  setSelectedTemplateToFill(null);
                  setSelectedClientId("");
                }}
                className="h-11 px-5 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-700 transition-colors cursor-pointer text-sm"
              >
                Zrušiť
              </button>
              <button
                onClick={handleStartDiagnostic}
                disabled={!selectedClientId}
                className="h-11 px-5 bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark-navy rounded-xl font-bold transition-all cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Začať diagnostiku
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
