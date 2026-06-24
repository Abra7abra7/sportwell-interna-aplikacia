"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { grantProxyConsentAction } from "../actions";

interface ClientProfile {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  gdpr_signed_at?: string | null;
}

interface FormTemplate {
  id: string;
  title: string;
  description?: string;
  category?: string;
}

interface DiagnosticsOverviewProps {
  initialTemplates: FormTemplate[];
  initialClients: ClientProfile[];
  role: string;
  urlClientId?: string | null;
}

export default function DiagnosticsOverview({
  initialTemplates,
  initialClients,
  role,
  urlClientId
}: DiagnosticsOverviewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [clients, setClients] = useState<ClientProfile[]>(initialClients);

  // Preset client if provided in URL
  useEffect(() => {
    if (clients.length > 0 && urlClientId) {
      const client = clients.find((c) => c.id === urlClientId);
      if (client) {
        setSelectedClient(client);
      }
    }
  }, [clients, urlClientId]);

  const handleProxyConsent = () => {
    if (!selectedClient) return;

    if (!confirm(`Naozaj chcete udeliť zástupný GDPR súhlas pre klienta "${selectedClient.full_name}"?`)) {
      return;
    }

    startTransition(async () => {
      try {
        await grantProxyConsentAction(selectedClient.id);
        const updatedConsentTime = new Date().toISOString();
        setClients((prev) =>
          prev.map((c) =>
            c.id === selectedClient.id ? { ...c, gdpr_signed_at: updatedConsentTime } : c
          )
        );
        setSelectedClient((prev) =>
          prev ? { ...prev, gdpr_signed_at: updatedConsentTime } : null
        );
        alert("Zástupný GDPR súhlas bol udelený.");
      } catch (err: any) {
        alert(err.message || "Chyba pri ukladaní súhlasu.");
      }
    });
  };

  const filteredClients = clients.filter(
    (c) =>
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (role === "klient") {
    return (
      <div className="p-8 text-center text-red-500 font-bold bg-white rounded-xl shadow-sm">
        Nemáte prístup do tejto sekcie.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto px-4 sm:px-6">
      <div className="mb-2">
        <h2 className="text-3xl font-bold text-brand-navy tracking-tight">Diagnostika</h2>
        <p className="text-gray-500 font-medium mt-1">Dostupné vyšetrenia a anamnézy pre klientov</p>
      </div>

      {!selectedTemplate ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h3 className="text-xl font-bold text-brand-navy mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-light-cyan text-brand-cyan flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            Vyberte si diagnostiku
          </h3>

          {initialTemplates.length === 0 ? (
            <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-gray-100">
              <p className="text-gray-500 font-medium">Zatiaľ nie sú k dispozícii žiadne aktívne šablóny.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {initialTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-brand-cyan hover:scale-[1.01] transition-all duration-300 flex flex-col items-start gap-4 text-left group cursor-pointer"
                >
                  <div className="w-12 h-12 bg-brand-navy text-brand-cyan rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-brand-navy leading-tight">{template.title}</h4>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                      {template.description || "Kliknite pre spustenie tohto formulára."}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-brand-navy p-6 rounded-2xl shadow-md text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-brand-cyan text-sm font-bold uppercase tracking-wider mb-1">Zvolená diagnostika</p>
              <h3 className="text-2xl font-bold">{selectedTemplate.title}</h3>
            </div>
            <button
              onClick={() => {
                setSelectedTemplate(null);
                setSelectedClient(null);
                setSearchQuery("");
              }}
              className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl font-bold transition-all text-sm cursor-pointer h-11 flex items-center"
            >
              Zmeniť diagnostiku
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h3 className="text-xl font-bold text-brand-navy mb-6 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              Komu ideme robiť diagnostiku?
            </h3>

            {!selectedClient ? (
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Vyhľadajte klienta podľa mena alebo e-mailu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 h-12 rounded-xl border border-gray-200 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition-all text-sm"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
                  {filteredClients.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 font-medium">Nenašiel sa žiadny klient s týmto menom.</div>
                  ) : (
                    filteredClients.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedClient(c)}
                        className="w-full flex items-center justify-between p-4 hover:bg-brand-off-white transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-light-cyan text-brand-navy flex items-center justify-center font-bold text-sm shrink-0">
                            {c.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-brand-navy leading-tight">{c.full_name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{c.email || "Bez e-mailu"}</p>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 text-brand-cyan transition-opacity duration-200 pr-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between bg-brand-off-white p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand-cyan text-brand-navy flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                      {selectedClient.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Vybraný klient</p>
                      <p className="font-bold text-brand-navy text-lg leading-tight">{selectedClient.full_name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedClient(null)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2 cursor-pointer h-11 w-11 flex items-center justify-center"
                    title="Zrušiť výber"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {!selectedClient.gdpr_signed_at ? (
                  <div className="text-center p-6 bg-red-50 border border-red-200 rounded-2xl">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h4 className="text-red-700 font-bold text-lg mb-2">Chýba GDPR súhlas</h4>
                    <p className="text-red-600 mb-6 text-sm max-w-md mx-auto">
                      Klient nepodpísal podmienky spracovania osobných údajov. Z tohto dôvodu nie je možné spustiť diagnostiku.
                    </p>
                    <button
                      onClick={handleProxyConsent}
                      disabled={isPending}
                      className="h-11 bg-red-600 hover:bg-red-700 text-white font-bold px-6 rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 mx-auto cursor-pointer disabled:opacity-50"
                    >
                      {isPending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Udeliť zástupný súhlas (Podpísal na klinike)</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-8 bg-green-50/30 border border-green-100 rounded-2xl">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h4 className="text-green-700 font-bold text-xl mb-2">Všetko je pripravené!</h4>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      Klient je aktívny a môžete začať s vypĺňaním diagnostického formulára.
                    </p>

                    <button
                      onClick={() =>
                        router.push(
                          `/diagnostika/vyplnit/${selectedTemplate.id}?clientId=${selectedClient.id}`
                        )
                      }
                      className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark-navy px-10 h-14 rounded-xl font-bold text-lg shadow-[0_4px_14px_0_rgba(0,240,255,0.39)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 mx-auto group cursor-pointer"
                    >
                      <span>Spustiť vyšetrenie</span>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
