"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthContext, ClientProfile } from "@/components/providers/AuthProvider";
import { useClients } from "@/hooks/useClients";
import { createClient } from "@/utils/supabase/client";

export default function DiagnostikaPage() {
  const { currentUserProfile } = useAuthContext();
  const { clients, loading, fetchClients } = useClients();
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const searchParams = useSearchParams();
  const urlClientId = searchParams.get('clientId');
  const router = useRouter();
  const supabase = createClient();
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (currentUserProfile && currentUserProfile.role !== "klient") {
      fetchClients();
    }
  }, [currentUserProfile]);

  useEffect(() => {
    if (clients.length > 0 && urlClientId) {
      const client = clients.find(c => c.id === urlClientId);
      if (client) {
        setSelectedClient(client);
      }
    }
  }, [clients, urlClientId]);

  useEffect(() => {
    const fetchTemplates = async () => {
      const { data } = await supabase.from('form_templates').select('*').eq('is_active', true).order('created_at', { ascending: true });
      if (data) setTemplates(data);
    };
    fetchTemplates();
  }, []);

  if (currentUserProfile?.role === "klient") {
    return <div className="text-red-500">Nemáte prístup do tejto sekcie.</div>;
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-brand-navy">Diagnostika</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold mb-4">Vyberte klienta pre diagnostiku</h3>
        {loading ? (
          <p>Načítavam vašich klientov...</p>
        ) : (
          <select 
            className="w-full md:w-1/2 p-2 border rounded-md"
            onChange={(e) => {
              const client = clients.find(c => c.id === e.target.value);
              setSelectedClient(client || null);
            }}
            value={selectedClient?.id || ""}
          >
            <option value="" disabled>-- Zvoľte klienta --</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>
        )}
      </div>

      {selectedClient && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {!selectedClient.gdpr_signed_at ? (
            <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="text-red-700 font-bold mb-2">Klient nemá podpísané GDPR</h4>
              <p className="text-red-600 mb-4">Z tohto dôvodu nie je možné spustiť diagnostiku.</p>
              <button 
                onClick={handleProxyConsent}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Udeliť zástupný súhlas (Podpísal na klinike)
              </button>
            </div>
          ) : (
            <div>
              <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg mb-8">
                <h4 className="text-green-700 font-bold mb-2">Klient je aktívny</h4>
                <p className="text-gray-600">Teraz môžete zvoliť diagnostický formulár a začať s vyšetrením.</p>
              </div>

              <h3 className="text-xl font-bold text-center text-brand-navy mb-6">Vyberte si jednu z možností</h3>
              
              {templates.length === 0 ? (
                <p className="text-center text-gray-500">Zatiaľ nie sú k dispozícii žiadne aktívne šablóny.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {templates.map(template => (
                    <button 
                      key={template.id}
                      onClick={() => router.push(`/diagnostika/vyplnit/${template.id}?clientId=${selectedClient.id}`)}
                      className="bg-brand-navy hover:bg-brand-dark-navy text-white p-6 rounded-xl shadow-md transition-transform transform hover:scale-[1.02] flex items-center gap-4 min-h-[120px] text-left"
                    >
                      <svg className="w-8 h-8 opacity-70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      <span className="font-bold text-lg leading-tight">{template.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
