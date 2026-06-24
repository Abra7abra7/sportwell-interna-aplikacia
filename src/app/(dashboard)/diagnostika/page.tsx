"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthContext, ClientProfile } from "@/components/providers/AuthProvider";
import { useClients } from "@/app/(dashboard)/klienti/hooks/useClients";
import { createClient } from "@/utils/supabase/client";

export default function DiagnostikaPage() {
  const { currentUserProfile } = useAuthContext();
  const { clients, loading, fetchClients } = useClients();
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const urlClientId = searchParams.get('clientId');

  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);

  useEffect(() => {
    if (currentUserProfile && currentUserProfile.role !== "klient") {
      fetchClients();
    }
  }, [currentUserProfile]);

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoadingTemplates(true);
      const { data } = await supabase.from('form_templates').select('*').eq('is_active', true).order('created_at', { ascending: true });
      if (data) setTemplates(data);
      setLoadingTemplates(false);
    };
    fetchTemplates();
  }, []);

  // Preset client if provided in URL and we know the clients
  useEffect(() => {
    if (clients.length > 0 && urlClientId) {
      const client = clients.find(c => c.id === urlClientId);
      if (client) {
        setSelectedClient(client);
      }
    }
  }, [clients, urlClientId]);

  if (currentUserProfile?.role === "klient") {
    return <div className="p-8 text-center text-red-500 font-bold bg-white rounded-xl shadow-sm">Nemáte prístup do tejto sekcie.</div>;
  }

  const handleProxyConsent = async () => {
    if (!selectedClient) return;
    
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('profiles')
      .update({ gdpr_signed_at: now })
      .eq('id', selectedClient.id);
      
    if (!error) {
      setSelectedClient({ ...selectedClient, gdpr_signed_at: now });
      fetchClients(); // refresh list
      alert("Zástupný GDPR súhlas bol udelený.");
    } else {
      alert("Chyba pri ukladaní súhlasu.");
    }
  };

  const filteredClients = clients.filter(c => 
    c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-bold text-brand-navy tracking-tight">Diagnostika</h2>
          <p className="text-gray-500 font-medium mt-1">Dostupné vyšetrenia a anamnézy pre klientov</p>
        </div>
      </div>

      {!selectedTemplate ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 p-6 md:p-8">
          <h3 className="text-xl font-bold text-brand-navy mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-light-cyan text-brand-cyan flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            </div>
            Vyberte si diagnostiku
          </h3>

          {loadingTemplates ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-cyan"></div>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-gray-100">
              <p className="text-gray-500 font-medium">Zatiaľ nie sú k dispozícii žiadne aktívne šablóny.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <button 
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-brand-cyan transition-all duration-300 flex flex-col items-start gap-4 text-left group"
                >
                  <div className="w-12 h-12 bg-brand-navy text-brand-cyan rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-brand-navy leading-tight">{template.title}</h4>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{template.description || "Kliknite pre spustenie tohto formulára."}</p>
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
              onClick={() => { setSelectedTemplate(null); setSelectedClient(null); setSearchQuery(""); }}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              Zmeniť diagnostiku
            </button>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 p-6 md:p-8">
            <h3 className="text-xl font-bold text-brand-navy mb-6 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              </div>
              Komu ideme robiť diagnostiku?
            </h3>

            {!selectedClient ? (
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Vyhľadajte klienta podľa mena alebo e-mailu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition-all"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50 hide-scrollbar">
                  {loading ? (
                    <div className="p-4 text-center text-gray-500">Načítavam klientov...</div>
                  ) : filteredClients.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">Nenašiel sa žiadny klient s týmto menom.</div>
                  ) : (
                    filteredClients.map(c => (
                      <button 
                        key={c.id}
                        onClick={() => setSelectedClient(c)}
                        className="w-full flex items-center justify-between p-4 hover:bg-brand-off-white transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-light-cyan text-brand-cyan flex items-center justify-center font-bold text-sm shrink-0">
                            {c.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-brand-navy">{c.full_name}</p>
                            <p className="text-xs text-gray-500">{c.email || "Bez e-mailu"}</p>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 text-brand-cyan">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
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
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Vybraný klient</p>
                      <p className="font-bold text-brand-navy text-lg leading-none">{selectedClient.full_name}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedClient(null)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2"
                    title="Zrušiť výber"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>

                {!selectedClient.gdpr_signed_at ? (
                  <div className="text-center p-6 bg-red-50 border border-red-200 rounded-xl">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                    <h4 className="text-red-700 font-bold text-lg mb-2">Chýba GDPR súhlas</h4>
                    <p className="text-red-600 mb-6 text-sm max-w-md mx-auto">Klient nepodpísal podmienky spracovania osobných údajov. Z tohto dôvodu nie je možné spustiť diagnostiku.</p>
                    <button 
                      onClick={handleProxyConsent}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 mx-auto"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      Udeliť zástupný súhlas (Podpísal na klinike)
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-8 bg-green-50/50 border border-green-100 rounded-xl">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h4 className="text-green-700 font-bold text-xl mb-2">Všetko je pripravené!</h4>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">Klient je aktívny a môžete začať s vypĺňaním diagnostického formulára.</p>
                    
                    <button 
                      onClick={() => router.push(`/diagnostika/vyplnit/${selectedTemplate.id}?clientId=${selectedClient.id}`)}
                      className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark-navy w-full md:w-auto px-10 py-4 rounded-xl font-bold text-lg shadow-[0_4px_14px_0_rgba(0,240,255,0.39)] transition-all duration-200 flex items-center justify-center gap-3 mx-auto group"
                    >
                      Spustiť vyšetrenie
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
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
