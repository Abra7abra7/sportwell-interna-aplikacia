"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { createClient } from "@/utils/supabase/client";

interface DocumentRecord {
  id: string;
  client_id: string;
  file_name: string;
  storage_path: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export default function DokumentyPage() {
  const { currentUserProfile } = useAuthContext();
  const supabase = createClient();
  
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (currentUserProfile) {
      fetchDocuments();
    }
  }, [currentUserProfile]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('documents')
        .select('*, profiles!client_id(full_name)')
        .order('created_at', { ascending: false });

      if (currentUserProfile?.role === 'klient') {
        query = query.eq('client_id', currentUserProfile.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Chyba pri načítavaní dokumentov:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (path: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from('client_documents').createSignedUrl(path, 60);
      if (error) throw error;
      
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = fileName;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading document:", error);
      alert("Chyba pri sťahovaní súboru");
    }
  };

  const isClient = currentUserProfile?.role === 'klient';

  const filteredDocuments = documents.filter(doc => {
    const searchLower = searchQuery.toLowerCase();
    const matchName = doc.file_name.toLowerCase().includes(searchLower);
    const matchClient = !isClient && doc.profiles?.full_name?.toLowerCase().includes(searchLower);
    return matchName || matchClient;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-navy">Dokumenty</h2>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            {isClient ? "Vaše zmluvy, súhlasy a reporty" : "Zoznam všetkých klientskych dokumentov"}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <input 
          type="text" 
          placeholder={isClient ? "Vyhľadaj dokument podľa názvu..." : "Vyhľadaj dokument alebo meno klienta..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-100 shadow-sm focus:ring-2 focus:ring-brand-cyan transition-shadow bg-white text-brand-navy placeholder-gray-400"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-cyan"></div>
        </div>
      ) : (
        <div>
          {filteredDocuments.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-brand-off-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <p className="text-gray-500 text-lg">Nenašli sa žiadne dokumenty.</p>
              {!isClient && (
                <p className="text-sm text-gray-400 mt-2">Nové dokumenty môžete nahrať priamo v detaile konkrétneho klienta.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredDocuments.map(doc => (
                <div key={doc.id} className="flex flex-col p-5 border border-gray-100/80 rounded-2xl bg-white shadow-sm hover:shadow-md hover:border-brand-cyan/50 transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4 w-full">
                      <div className="w-12 h-12 bg-brand-light-cyan text-brand-cyan rounded-xl flex items-center justify-center font-bold text-xs border border-brand-cyan/20 shrink-0">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-base font-bold text-brand-navy truncate" title={doc.file_name}>{doc.file_name}</p>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">{new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-auto border-t border-gray-50 pt-4 flex items-center justify-between">
                    {!isClient ? (
                      <div className="flex items-center text-xs text-gray-500 font-medium truncate pr-2">
                        <svg className="w-4 h-4 mr-1.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        <span className="truncate">{doc.profiles?.full_name || "Neznámy klient"}</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-xs text-green-600 font-medium">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Váš dokument
                      </div>
                    )}
                    
                    <button 
                      onClick={() => handleDownload(doc.storage_path, doc.file_name)}
                      className="text-brand-cyan text-sm font-bold hover:bg-brand-cyan/10 px-3 py-1.5 rounded-lg transition-colors flex items-center shrink-0"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      Stiahnuť
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
