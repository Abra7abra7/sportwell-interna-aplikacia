"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { createClient } from "@/utils/supabase/client";

export default function GdprExportPage() {
  const { currentUserProfile } = useAuthContext();
  const router = useRouter();
  const supabase = createClient();
  
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (currentUserProfile && currentUserProfile.role !== "klient") {
      fetchClients();
    }
  }, [currentUserProfile]);

  const fetchClients = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'klient')
      .order('gdpr_signed_at', { ascending: false });
    
    if (data) setClients(data);
    setLoading(false);
  };

  if (currentUserProfile?.role === "klient") {
    return <div className="p-8 text-center text-red-500 font-bold bg-white rounded-xl">Nemáte prístup do tejto sekcie.</div>;
  }

  const filteredClients = clients.filter(c => 
    c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const exportToCsv = () => {
    const headers = [
      "ID",
      "Dátum súhlasu", 
      "Meno a Priezvisko", 
      "Dátum narodenia",
      "E-mail", 
      "Telefón", 
      "Marketing (Newsletter)", 
      "Meta (Lookalike)", 
      "Spracovanie diagnostiky"
    ];
    
    const rows = filteredClients.map(c => [
      c.id,
      c.gdpr_signed_at ? new Date(c.gdpr_signed_at).toLocaleString('sk-SK') : "Nepodpísané",
      c.full_name,
      c.metadata?.birthDate ? new Date(c.metadata.birthDate).toLocaleDateString('sk-SK') : "",
      c.email || "",
      c.phone || "",
      c.metadata?.marketingConsent ? "Áno" : "Nie",
      c.metadata?.metaConsent ? "Áno" : "Nie",
      c.metadata?.diagnosticsConsent ? "Áno" : "Nie"
    ]);

    // Používame bodkočiarku pre správne otvorenie v európskom Exceli
    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
    ].join("\n");

    // Pridáme UTF-8 BOM aby Excel správne prečítal diakritiku
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SportWell_GDPR_Export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/klienti')}
            className="p-2.5 bg-white/80 backdrop-blur-xl rounded-xl shadow-sm hover:shadow-md hover:bg-brand-cyan/10 hover:text-brand-cyan transition-all border border-gray-100"
            title="Späť na zoznam klientov"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </button>
          <div>
            <h2 className="text-3xl font-bold text-brand-navy tracking-tight">GDPR súhlasy</h2>
            <p className="text-gray-500 font-medium mt-1">Export a prehľad zaregistrovaných klientov</p>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="w-full md:w-96 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input 
              type="text" 
              placeholder="Zadajte hľadaný výraz (Meno, E-mail)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan focus:border-transparent outline-none transition-all"
            />
          </div>
          
          <button 
            onClick={exportToCsv}
            disabled={filteredClients.length === 0}
            className="bg-brand-navy hover:bg-brand-dark-navy text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Exportovať do CSV
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-cyan"></div>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="min-w-full divide-y divide-gray-100 text-sm text-left">
              <thead className="bg-brand-off-white/80">
                <tr>
                  <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-xs">Dátum</th>
                  <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-xs">Meno a Priezvisko</th>
                  <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-xs">Kontakt</th>
                  <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-xs text-center" title="Marketing a Newsletter">Marketing</th>
                  <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-xs text-center" title="Poskytnutie pre Meta (Lookalike)">Meta</th>
                  <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-xs text-center" title="Záznamy o diagnostike">Diagnostika</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Nenašli sa žiadni klienti.</td>
                  </tr>
                ) : (
                  filteredClients.map(c => (
                    <tr key={c.id} className="hover:bg-brand-light-cyan/10 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {c.gdpr_signed_at ? new Date(c.gdpr_signed_at).toLocaleString('sk-SK') : <span className="text-red-400">Chýba</span>}
                      </td>
                      <td className="px-4 py-3 font-bold text-brand-navy">
                        {c.full_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {c.email}<br/>
                        {c.phone}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.metadata?.marketingConsent ? 
                          <span className="inline-flex w-6 h-6 items-center justify-center bg-green-100 text-green-600 rounded-md font-bold text-lg">✓</span> : 
                          <span className="inline-flex w-6 h-6 items-center justify-center text-gray-300 rounded-md text-lg">✗</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.metadata?.metaConsent ? 
                          <span className="inline-flex w-6 h-6 items-center justify-center bg-green-100 text-green-600 rounded-md font-bold text-lg">✓</span> : 
                          <span className="inline-flex w-6 h-6 items-center justify-center text-gray-300 rounded-md text-lg">✗</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.metadata?.diagnosticsConsent ? 
                          <span className="inline-flex w-6 h-6 items-center justify-center bg-green-100 text-green-600 rounded-md font-bold text-lg">✓</span> : 
                          <span className="inline-flex w-6 h-6 items-center justify-center text-gray-300 rounded-md text-lg">✗</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
