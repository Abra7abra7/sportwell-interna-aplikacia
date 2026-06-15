"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { createClient } from "@/utils/supabase/client";
import { useClients } from "@/hooks/useClients";

export default function DashboardPage() {
  const router = useRouter();
  const { currentUserProfile } = useAuthContext();
  const { clients, fetchClients } = useClients();
  const supabase = createClient();

  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateToFill, setSelectedTemplateToFill] = useState<any | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  useEffect(() => {
    if (currentUserProfile && currentUserProfile.role !== "klient") {
      fetchClients();
      const fetchTemplates = async () => {
        const { data } = await supabase
          .from('form_templates')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true });
        if (data) setTemplates(data);
      };
      fetchTemplates();
    }
  }, [currentUserProfile]);

  const handleStartDiagnostic = () => {
    if (!selectedTemplateToFill || !selectedClientId) return;
    router.push(`/diagnostika/vyplnit/${selectedTemplateToFill.id}?clientId=${selectedClientId}`);
  };

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
        <div className="bg-brand-light-cyan p-6 rounded-xl border border-brand-cyan/20 md:col-span-1">
          <h3 className="font-bold text-brand-navy mb-2">Rýchle akcie</h3>
          <p className="text-sm text-gray-700">
            {currentUserProfile?.role === "klient" 
              ? "Skontrolujte si svoje domáce cvičenia v záložke Moje Cviky." 
              : "Prejdite do sekcie Klienti alebo Diagnostika pre prácu s pacientmi."}
          </p>
        </div>
        
        {currentUserProfile?.role !== "klient" && (
          <div className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-brand-navy mb-4">Rýchla Diagnostika</h3>
            {templates.length === 0 ? (
              <p className="text-sm text-gray-500">Zatiaľ nie sú k dispozícii žiadne šablóny.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <button 
                    key={template.id}
                    onClick={() => setSelectedTemplateToFill(template)}
                    className="bg-brand-navy hover:bg-brand-dark-navy text-white p-4 rounded-xl shadow-md transition-transform transform hover:scale-[1.02] flex items-center gap-3 text-left"
                  >
                    <svg className="w-6 h-6 opacity-70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <span className="font-bold text-sm leading-tight">{template.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal na výber klienta pre rýchlu diagnostiku */}
      {selectedTemplateToFill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-brand-navy mb-2">Vyberte klienta</h3>
            <p className="text-sm text-gray-500 mb-4">
              Pre diagnostiku: <strong>{selectedTemplateToFill.title}</strong>
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Klient</label>
              <select 
                className="w-full p-2 border rounded-md focus:ring-brand-cyan focus:border-brand-cyan"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
              >
                <option value="" disabled>-- Zvoľte klienta --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setSelectedTemplateToFill(null);
                  setSelectedClientId("");
                }} 
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded font-medium text-gray-700"
              >
                Zrušiť
              </button>
              <button 
                onClick={handleStartDiagnostic}
                disabled={!selectedClientId}
                className="px-4 py-2 bg-brand-cyan hover:bg-[#00d0e0] text-brand-navy rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed"
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
