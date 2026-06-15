"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAuthContext, ClientProfile } from "@/components/providers/AuthProvider";

export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { currentUserProfile } = useAuthContext();
  const supabase = createClient();

  const clientId = params.id as string;
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info"); // info, diagnostics, documents
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  
  // Data for tabs
  const [records, setRecords] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    if (clientId) {
      fetchClientData();
    }
  }, [clientId]);

  const fetchClientData = async () => {
    setLoading(true);
    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', clientId)
      .single();
    
    if (profile) {
      setClientProfile(profile);
      
      // Fetch related records
      const { data: recs } = await supabase
        .from('client_records')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (recs) setRecords(recs);

      // Fetch documents
      const { data: docs } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (docs) setDocuments(docs);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingDoc(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${clientId}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client_documents')
        .upload(fileName, file);
        
      if (uploadError) throw uploadError;
      
      const { error: dbError } = await supabase.from('documents').insert({
        client_id: clientId,
        file_name: file.name,
        storage_path: uploadData.path
      });
      
      if (dbError) throw dbError;
      
      // Refresh documents
      const { data: docs } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (docs) setDocuments(docs);
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Chyba pri nahrávaní súboru");
    } finally {
      setUploadingDoc(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
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

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Načítavam kartu klienta...</div>;
  }

  if (!clientProfile) {
    return <div className="p-8 text-center text-red-500">Klient nenájdený alebo nemáte oprávnenie na zobrazenie jeho karty.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => router.back()}
          className="p-2 bg-white rounded-full shadow hover:bg-gray-50"
        >
          &larr; Späť
        </button>
        <h2 className="text-2xl font-bold text-brand-navy">Karta klienta: {clientProfile.full_name}</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs Header */}
        <div className="flex border-b border-gray-200">
          <button 
            onClick={() => setActiveTab("info")}
            className={`flex-1 py-4 text-center font-medium text-sm transition-colors ${activeTab === "info" ? "border-b-2 border-brand-cyan text-brand-navy" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
          >
            Osobné Údaje
          </button>
          <button 
            onClick={() => setActiveTab("diagnostics")}
            className={`flex-1 py-4 text-center font-medium text-sm transition-colors ${activeTab === "diagnostics" ? "border-b-2 border-brand-cyan text-brand-navy" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
          >
            Diagnostika ({records.length})
          </button>
          <button 
            onClick={() => setActiveTab("documents")}
            className={`flex-1 py-4 text-center font-medium text-sm transition-colors ${activeTab === "documents" ? "border-b-2 border-brand-cyan text-brand-navy" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
          >
            Dokumenty ({documents.length})
          </button>
        </div>

        {/* Tabs Content */}
        <div className="p-6">
          {activeTab === "info" && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-brand-navy border-b pb-2">Kontaktné údaje</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Meno a Priezvisko</p>
                  <p className="font-medium">{clientProfile.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">E-mail</p>
                  <p className="font-medium">{clientProfile.email || "Nezadané"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Telefón</p>
                  <p className="font-medium">{clientProfile.phone || "Nezadané"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dátum registrácie</p>
                  <p className="font-medium">{clientProfile.created_at ? new Date(clientProfile.created_at).toLocaleDateString() : "Neznámy"}</p>
                </div>
              </div>

              <h3 className="text-lg font-bold text-brand-navy border-b pb-2 mt-8">Stav GDPR</h3>
              <div className="flex items-center">
                {clientProfile.gdpr_signed_at ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg w-full">
                    <div className="flex justify-between items-center mb-3 border-b border-green-200 pb-2">
                      <div>
                        <p className="text-green-700 font-bold">Podpísané / Súhlas udelený</p>
                        <p className="text-sm text-green-600">Dátum: {new Date(clientProfile.gdpr_signed_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="space-y-2 mt-2">
                      <p className="text-sm text-green-800 font-medium">Prehľad udelených súhlasov:</p>
                      <ul className="text-sm space-y-1">
                        <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> <span className="text-green-700">Ochrana osobných údajov a dohoda (Povinné)</span></li>
                        <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> <span className="text-green-700">Podmienky rezervačného systému (Povinné)</span></li>
                        <li className="flex items-center gap-2">
                          {clientProfile.metadata?.marketingConsent ? <span className="text-green-500 font-bold">✓</span> : <span className="text-red-400 font-bold">✗</span>} 
                          <span className={clientProfile.metadata?.marketingConsent ? "text-green-700" : "text-gray-500 line-through"}>Marketingové účely (Newsletter)</span>
                        </li>
                        <li className="flex items-center gap-2">
                          {clientProfile.metadata?.metaConsent ? <span className="text-green-500 font-bold">✓</span> : <span className="text-red-400 font-bold">✗</span>} 
                          <span className={clientProfile.metadata?.metaConsent ? "text-green-700" : "text-gray-500 line-through"}>Poskytnutie emailu spoločnosti Meta (Lookalike)</span>
                        </li>
                        <li className="flex items-center gap-2">
                          {clientProfile.metadata?.diagnosticsConsent ? <span className="text-green-500 font-bold">✓</span> : <span className="text-red-400 font-bold">✗</span>} 
                          <span className={clientProfile.metadata?.diagnosticsConsent ? "text-green-700" : "text-gray-500 line-through"}>Spracovanie údajov z diagnostiky (InBody, FMS)</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg w-full">
                    <p className="text-red-700 font-bold">Chýba GDPR súhlas</p>
                    <p className="text-sm text-red-600">Klient musí podpísať GDPR predtým než s ním bude možné pracovať.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "diagnostics" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-brand-navy">História diagnostiky</h3>
                <button 
                  onClick={() => router.push(`/diagnostika?clientId=${clientId}`)}
                  className="bg-brand-light-cyan text-brand-navy px-4 py-2 rounded-lg font-medium hover:bg-brand-cyan transition-colors"
                >
                  Nová diagnostika
                </button>
              </div>
              
              {records.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Tento klient zatiaľ nemá žiadne diagnostické záznamy.</p>
              ) : (
                <div className="space-y-3">
                  {records.map(record => (
                    <div key={record.id} className="p-4 border rounded-lg hover:border-brand-cyan transition-colors">
                      <p className="font-bold text-brand-navy">Diagnostický formulár</p>
                      <p className="text-xs text-gray-500 mb-2">{new Date(record.created_at).toLocaleString()}</p>
                      <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto">
                        {JSON.stringify(record.form_data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-brand-navy">Súbory a vyšetrenia</h3>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingDoc}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {uploadingDoc ? 'Nahrávam...' : '+ Nahrať súbor'}
                </button>
              </div>

              {documents.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                  <p className="text-gray-500">Žiadne nahraté dokumenty (MR, PDF, Zmluvy)</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center font-bold text-xs">
                          DOC
                        </div>
                        <div>
                          <p className="text-sm font-bold text-brand-navy truncate max-w-[200px]">{doc.file_name}</p>
                          <p className="text-xs text-gray-500">{new Date(doc.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDownload(doc.storage_path, doc.file_name)}
                        className="text-brand-cyan text-sm font-medium hover:underline"
                      >
                        Stiahnuť
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
