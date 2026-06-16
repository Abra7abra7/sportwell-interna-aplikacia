"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAuthContext, ClientProfile } from "@/components/providers/AuthProvider";
import { generatePdfFromElement } from "@/utils/pdfGenerator";

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
  const [expandedRecords, setExpandedRecords] = useState<Record<string, boolean>>({});
  
  // Data for tabs
  const [records, setRecords] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [expandedWorkouts, setExpandedWorkouts] = useState<Record<string, boolean>>({});

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
        .select(`
          *,
          form_templates(title, schema)
        `)
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

      // Fetch workouts
      const { data: wLogs } = await supabase
        .from('client_workout_logs')
        .select(`
          *,
          plan:plan_id(title),
          sets:client_workout_log_sets(
            id, set_index, reps_performed, weight_kg,
            exercise:exercise_id(name, category)
          )
        `)
        .eq('client_id', clientId)
        .order('completed_at', { ascending: false });
      if (wLogs) setWorkouts(wLogs);
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

  const downloadEncryptedPdf = async (elementId: string, filename: string) => {
    try {
      const { generatePdfBlob } = await import('@/utils/pdfGenerator');
      let password = "sportwell";
      if (clientProfile?.metadata?.birthDate) {
        const d = new Date(clientProfile.metadata.birthDate);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        password = `${day}${month}${year}`;
      }
      
      const blob = await generatePdfBlob(elementId, password);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert("Chyba pri generovaní PDF.");
      }
    } catch (err) {
      console.error(err);
      alert("Chyba pri generovaní PDF.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Načítavam kartu klienta...</div>;
  }

  if (!clientProfile) {
    return <div className="p-8 text-center text-red-500">Klient nenájdený alebo nemáte oprávnenie na zobrazenie jeho karty.</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2.5 bg-white/80 backdrop-blur-xl rounded-xl shadow-sm hover:shadow-md hover:bg-brand-cyan/10 hover:text-brand-cyan transition-all border border-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </button>
          <div>
            <h2 className="text-3xl font-bold text-brand-navy tracking-tight">{clientProfile.full_name}</h2>
            <p className="text-gray-500 font-medium">Karta klienta a zdravotná dokumentácia</p>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 overflow-hidden">
        {/* Tabs Header */}
        <div className="flex border-b border-gray-100/50 bg-gray-50/30 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab("info")}
            className={`flex-1 py-4 px-6 text-center font-bold text-sm transition-all whitespace-nowrap ${activeTab === "info" ? "border-b-2 border-brand-cyan text-brand-navy bg-brand-cyan/5" : "text-gray-400 hover:text-brand-navy hover:bg-white"}`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              Osobné Údaje
            </span>
          </button>
          <button 
            onClick={() => setActiveTab("diagnostics")}
            className={`flex-1 py-4 px-6 text-center font-bold text-sm transition-all whitespace-nowrap ${activeTab === "diagnostics" ? "border-b-2 border-brand-cyan text-brand-navy bg-brand-cyan/5" : "text-gray-400 hover:text-brand-navy hover:bg-white"}`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
              Diagnostika <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{records.length}</span>
            </span>
          </button>
          <button 
            onClick={() => setActiveTab("workouts")}
            className={`flex-1 py-4 px-6 text-center font-bold text-sm transition-all whitespace-nowrap ${activeTab === "workouts" ? "border-b-2 border-brand-cyan text-brand-navy bg-brand-cyan/5" : "text-gray-400 hover:text-brand-navy hover:bg-white"}`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              Tréningy <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{workouts.length}</span>
            </span>
          </button>
          <button 
            onClick={() => setActiveTab("documents")}
            className={`flex-1 py-4 px-6 text-center font-bold text-sm transition-all whitespace-nowrap ${activeTab === "documents" ? "border-b-2 border-brand-cyan text-brand-navy bg-brand-cyan/5" : "text-gray-400 hover:text-brand-navy hover:bg-white"}`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
              Dokumenty <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{documents.length}</span>
            </span>
          </button>
        </div>

        <div className="p-6 md:p-8">
          {activeTab === "info" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h3 className="text-xl font-bold text-brand-navy mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-light-cyan text-brand-cyan flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  Základné informácie
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-brand-off-white/50 p-6 rounded-2xl border border-gray-100">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Meno a Priezvisko</p>
                    <p className="font-bold text-brand-navy text-lg">{clientProfile.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">E-mail</p>
                    <p className="font-bold text-brand-navy text-lg">{clientProfile.email || "Nezadané"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Telefón</p>
                    <p className="font-bold text-brand-navy text-lg">{clientProfile.phone || "Nezadané"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Dátum narodenia</p>
                    <p className="font-bold text-brand-navy text-lg">
                      {clientProfile.metadata?.birthDate 
                        ? new Date(clientProfile.metadata.birthDate).toLocaleDateString() 
                        : "Nezadané"}
                    </p>
                  </div>
                  <div className="md:col-span-2 lg:col-span-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Adresa (Trvalý pobyt)</p>
                    <p className="font-bold text-brand-navy text-lg">{clientProfile.metadata?.address || "Nezadané"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Záujem o službu</p>
                    <p className="font-bold text-brand-cyan text-lg">{clientProfile.metadata?.serviceInterest || "Nezadané"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Dátum registrácie</p>
                    <p className="font-bold text-brand-navy text-lg">{clientProfile.created_at ? new Date(clientProfile.created_at).toLocaleDateString() : "Neznámy"}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-brand-navy mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  </div>
                  Právne a GDPR súhlasy
                </h3>
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
            </div>
          )}

          {activeTab === "diagnostics" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-navy rounded-2xl p-6 text-white shadow-md">
                <div>
                  <h3 className="text-xl font-bold text-brand-cyan">Diagnostika a protokoly</h3>
                  <p className="text-gray-300 text-sm mt-1">Záznamy z vyšetrení a diagnostiky klienta</p>
                </div>
                <button 
                  onClick={() => router.push(`/diagnostika?clientId=${clientId}`)}
                  className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark-navy px-6 py-2.5 rounded-xl font-bold shadow-[0_4px_14px_0_rgba(0,240,255,0.39)] transition-all duration-200 whitespace-nowrap"
                >
                  + Nový záznam
                </button>
              </div>
              
              {records.length === 0 ? (
                <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  </div>
                  <p className="text-gray-500 font-medium">Tento klient zatiaľ nemá žiadne diagnostické záznamy.</p>
                  <p className="text-sm text-gray-400 mt-1">Kliknite na tlačidlo "Nový záznam" pre vytvorenie prvého.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {records.map(record => {
                    // Prehľadá schema.fields a vráti label ak existuje
                    const getFieldLabel = (key: string) => {
                      if (!record.form_templates?.schema?.fields) {
                        const cleaned = key.replace(/^q\d+_/, '');
                        return cleaned.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
                      }
                      
                      const field = record.form_templates.schema.fields.find((f: any) => f.id === key);
                      if (field && field.label) return field.label;
                      
                      const cleaned = key.replace(/^q\d+_/, '');
                      return cleaned.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
                    };

                    const renderValue = (val: any) => {
                      if (!val) return <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Nezadané</span>;
                      if (Array.isArray(val)) return val.join(", ");
                      
                      // Check if it's an uploaded file object
                      if (typeof val === 'object' && val !== null && val.fileName && val.path) {
                        if (val.type?.startsWith('image/')) {
                          const { data: { publicUrl } } = supabase.storage.from('client_records_files').getPublicUrl(val.path);
                          return (
                            <div className="mt-2">
                              <img src={publicUrl} alt={val.fileName} className="max-h-48 rounded-lg border object-contain bg-white" />
                              <p className="text-xs text-gray-500 mt-1">{val.fileName}</p>
                            </div>
                          );
                        } else {
                          return <span className="font-medium text-brand-cyan">📄 Priložený súbor: {val.fileName}</span>;
                        }
                      }

                      if (typeof val === 'object' && val !== null) {
                        return (
                          <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                            {Object.entries(val).map(([k, v]) => (
                              <li key={k}><span style={{ fontWeight: 500, color: '#374151' }}>{k}:</span> {String(v)}</li>
                            ))}
                          </ul>
                        );
                      }
                      return String(val);
                    };

                    const templateTitle = record.form_templates?.title || "Diagnostický formulár";
                    const isExpanded = expandedRecords[record.id];

                    const toggleRecord = () => {
                      setExpandedRecords(prev => ({ ...prev, [record.id]: !prev[record.id] }));
                    };

                    return (
                      <div key={record.id} className="border border-gray-100/80 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300 group">
                        <div 
                          className="flex justify-between items-center cursor-pointer p-5 bg-brand-off-white/30 group-hover:bg-brand-off-white/80 transition-colors" 
                          onClick={toggleRecord}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-brand-cyan font-bold text-xl">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                            </div>
                            <div>
                              <p className="font-bold text-lg text-brand-navy">{templateTitle}</p>
                              <p className="text-sm font-medium text-gray-500">{new Date(record.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-brand-cyan text-brand-navy' : 'bg-gray-100 text-gray-400 group-hover:bg-brand-light-cyan group-hover:text-brand-cyan'}`}>
                            <svg className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="p-6 border-t border-gray-100/80 bg-white">
                            <div className="flex justify-end mb-6">
                              <button 
                                onClick={() => downloadEncryptedPdf(`pdf-record-${record.id}`, `${templateTitle.replace(/\s+/g, '_')}_${clientProfile.full_name.replace(/\s+/g, '_')}.pdf`)}
                                className="text-sm bg-brand-navy text-white hover:bg-brand-cyan hover:text-brand-navy px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-sm"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                Stiahnuť PDF Report
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {Object.entries(record.form_data || {}).map(([key, val]) => (
                                <div key={key} className="bg-brand-off-white/50 p-4 rounded-xl border border-gray-100">
                                  <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">{getFieldLabel(key)}</p>
                                  <div className="text-sm text-gray-800">{renderValue(val)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Skrytá šablóna pre generovanie PDF bez Tailwind farieb (kvôli html2canvas a oklch) */}
                        <div style={{ position: 'absolute', top: 0, left: '-9999px', width: '794px' }}>
                          <div id={`pdf-record-${record.id}`} style={{ backgroundColor: '#ffffff', color: '#000000', fontFamily: '"Noto Sans", sans-serif' }}>
                            <div style={{ backgroundColor: '#0A192F', color: '#ffffff', padding: '30px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                  <img src="/sportwell-logo.svg" alt="SportWell Logo" style={{ height: '40px', width: '40px' }} />
                                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '0.5px' }}>SportWell</span>
                                </div>
                                <p style={{ fontSize: '13px', color: '#D3FAFF', margin: '2px 0', opacity: 0.8 }}>Černyševského 30, 851 01 Bratislava</p>
                                <p style={{ fontSize: '13px', color: '#D3FAFF', margin: '0', opacity: 0.8 }}>IČO: 52 124 118</p>
                              </div>
                              <div style={{ textAlign: 'right', maxWidth: '350px' }}>
                                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#00F0FF', margin: '0 0 8px 0', wordWrap: 'break-word', textTransform: 'uppercase' }}>{templateTitle}</h2>
                                <p style={{ fontSize: '14px', color: '#ffffff', margin: 0, opacity: 0.9 }}>Dátum: {new Date(record.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            
                            <div style={{ padding: '40px' }}>
                              <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#F7FAFC', borderRadius: '12px', borderLeft: '4px solid #00F0FF', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '16px', color: '#020C1B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Údaje o klientovi</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                                  <p style={{ margin: 0 }}><strong style={{ color: '#0A192F', width: '120px', display: 'inline-block' }}>Meno:</strong> {clientProfile.full_name}</p>
                                  <p style={{ margin: 0 }}><strong style={{ color: '#0A192F', width: '120px', display: 'inline-block' }}>Telefón:</strong> {clientProfile.phone || "Nezadané"}</p>
                                  <p style={{ margin: 0 }}><strong style={{ color: '#0A192F', width: '120px', display: 'inline-block' }}>E-mail:</strong> {clientProfile.email || "Nezadané"}</p>
                                  <p style={{ margin: 0 }}><strong style={{ color: '#0A192F', width: '120px', display: 'inline-block' }}>Dátum nar.:</strong> {clientProfile.metadata?.birthDate ? new Date(clientProfile.metadata.birthDate).toLocaleDateString() : "Nezadané"}</p>
                                </div>
                              </div>

                              <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '20px', paddingBottom: '10px', color: '#020C1B', borderBottom: '2px solid #D3FAFF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Výsledky diagnostiky</h3>
                              
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
                                {Object.entries(record.form_data || {}).map(([key, val]) => (
                                  <div key={key} style={{ pageBreakInside: 'avoid', breakInside: 'avoid', backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                                    <p style={{ fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', color: '#0A192F', margin: '0 0 6px 0', letterSpacing: '0.5px' }}>{getFieldLabel(key)}</p>
                                    <div style={{ margin: 0, color: '#334155', fontSize: '14px' }}>{renderValue(val)}</div>
                                  </div>
                                ))}
                              </div>
                              
                              <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                                <p style={{ margin: 0 }}>Vygenerované systémom SportWell • {new Date().toLocaleString('sk-SK')}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "workouts" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-navy rounded-2xl p-6 text-white shadow-md">
                <div>
                  <h3 className="text-xl font-bold text-brand-cyan">História tréningov</h3>
                  <p className="text-gray-300 text-sm mt-1">Prehľad absolvovaných tréningov a výkonov</p>
                </div>
                <button 
                  onClick={() => router.push(`/klienti/${clientId}/zaznam-treningu`)}
                  className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark-navy px-6 py-2.5 rounded-xl font-bold shadow-[0_4px_14px_0_rgba(0,240,255,0.39)] transition-all duration-200 whitespace-nowrap"
                >
                  + Zaznamenať tréning
                </button>
              </div>
              
              {workouts.length === 0 ? (
                <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                  </div>
                  <p className="text-gray-500 font-medium">Klient zatiaľ neabsolvoval žiadny tréning.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {workouts.map((workout) => {
                    const isExpanded = expandedWorkouts[workout.id];
                    const toggleWorkout = () => {
                      setExpandedWorkouts(prev => ({ ...prev, [workout.id]: !prev[workout.id] }));
                    };
                    
                    // Group sets by exercise
                    const groupedSets: Record<string, any[]> = {};
                    if (workout.sets) {
                      workout.sets.forEach((s: any) => {
                        const exName = s.exercise?.name || "Neznámy cvik";
                        if (!groupedSets[exName]) groupedSets[exName] = [];
                        groupedSets[exName].push(s);
                      });
                    }

                    return (
                      <div key={workout.id} className="border border-gray-100/80 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300 group">
                        <div 
                          className="flex justify-between items-center cursor-pointer p-5 bg-brand-off-white/30 group-hover:bg-brand-off-white/80 transition-colors" 
                          onClick={toggleWorkout}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-brand-cyan font-bold text-xl">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            </div>
                            <div>
                              <p className="font-bold text-lg text-brand-navy">
                                {workout.plan?.title || "Voľný tréning"}
                              </p>
                              <p className="text-sm font-medium text-gray-500">{new Date(workout.completed_at).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            {workout.client_feedback_rating && (
                              <div className="hidden sm:flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                                <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Náročnosť</span>
                                {[...Array(5)].map((_, i) => (
                                  <svg key={i} className={`w-3.5 h-3.5 ${i < workout.client_feedback_rating ? "text-brand-cyan" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                ))}
                              </div>
                            )}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-brand-cyan text-brand-navy' : 'bg-gray-100 text-gray-400 group-hover:bg-brand-light-cyan group-hover:text-brand-cyan'}`}>
                              <svg className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            {workout.client_notes && (
                              <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Poznámka klienta</span>
                                <p className="text-sm text-gray-700 italic">"{workout.client_notes}"</p>
                              </div>
                            )}

                            {Object.keys(groupedSets).length > 0 ? (
                              <div className="space-y-4">
                                {Object.entries(groupedSets).map(([exName, sets]) => (
                                  <div key={exName} className="border border-gray-100 rounded-xl overflow-hidden">
                                    <div className="bg-brand-off-white px-4 py-2 border-b border-gray-100">
                                      <h4 className="font-bold text-brand-navy">{exName}</h4>
                                    </div>
                                    <div className="p-0">
                                      <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                          <tr>
                                            <th className="px-4 py-2 w-16 text-center">Séria</th>
                                            <th className="px-4 py-2">Opakovania</th>
                                            <th className="px-4 py-2">Váha (kg)</th>
                                            <th className="px-4 py-2 w-24 text-center">Stav</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {sets.sort((a,b) => a.set_index - b.set_index).map((set) => (
                                            <tr key={set.id} className="border-t border-gray-100">
                                              <td className="px-4 py-2 text-center font-medium text-gray-500">{set.set_index}.</td>
                                              <td className="px-4 py-2 font-bold text-brand-navy">{set.reps_performed || "-"}</td>
                                              <td className="px-4 py-2 font-bold text-brand-navy">{set.weight_kg ? `${set.weight_kg} kg` : "-"}</td>
                                              <td className="px-4 py-2 text-center">
                                                {set.reps_performed > 0 ? (
                                                  <span className="inline-block w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                  </span>
                                                ) : (
                                                  <span className="inline-block w-5 h-5 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                  </span>
                                                )}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">Pre tento tréning neboli zaznamenané žiadne série.</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-navy rounded-2xl p-6 text-white shadow-md">
                <div>
                  <h3 className="text-xl font-bold text-brand-cyan">Súbory a vyšetrenia</h3>
                  <p className="text-gray-300 text-sm mt-1">Zmluvy, výsledky a iné nahraté dokumenty</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingDoc}
                  className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark-navy px-6 py-2.5 rounded-xl font-bold shadow-[0_4px_14px_0_rgba(0,240,255,0.39)] transition-all duration-200 whitespace-nowrap disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  {uploadingDoc ? 'Nahrávam...' : 'Nahrať súbor'}
                </button>
              </div>

              {documents.length === 0 ? (
                <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  </div>
                  <p className="text-gray-500 font-medium">Žiadne nahraté dokumenty (MR, PDF, Zmluvy)</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-100/80 rounded-xl bg-white shadow-sm hover:shadow-md hover:border-brand-cyan/50 transition-all duration-300 group">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-brand-light-cyan text-brand-cyan rounded-xl flex items-center justify-center font-bold text-xs border border-brand-cyan/20">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-brand-navy truncate max-w-[180px] sm:max-w-[250px]">{doc.file_name}</p>
                          <p className="text-xs text-gray-400 font-medium mt-0.5">{new Date(doc.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDownload(doc.storage_path, doc.file_name)}
                        className="text-brand-cyan text-sm font-bold hover:bg-brand-light-cyan px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <span className="hidden sm:inline">Stiahnuť</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4-4m4 4V4"></path></svg>
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
