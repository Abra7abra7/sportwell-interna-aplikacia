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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <p className="text-sm text-gray-500">Dátum narodenia</p>
                  <p className="font-medium">
                    {clientProfile.metadata?.birthDate 
                      ? new Date(clientProfile.metadata.birthDate).toLocaleDateString() 
                      : "Nezadané"}
                  </p>
                </div>
                <div className="md:col-span-2 lg:col-span-1">
                  <p className="text-sm text-gray-500">Adresa (Trvalý pobyt)</p>
                  <p className="font-medium">{clientProfile.metadata?.address || "Nezadané"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Záujem o službu</p>
                  <p className="font-medium">{clientProfile.metadata?.serviceInterest || "Nezadané"}</p>
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
                      <div key={record.id} className="p-5 border rounded-xl hover:border-brand-cyan transition-colors bg-white shadow-sm">
                        <div 
                          className="flex justify-between items-center cursor-pointer" 
                          onClick={toggleRecord}
                        >
                          <div>
                            <p className="font-bold text-lg text-brand-navy">{templateTitle}</p>
                            <p className="text-xs text-gray-500">{new Date(record.created_at).toLocaleString()}</p>
                          </div>
                          <div className="text-brand-cyan font-bold text-xl">
                            {isExpanded ? "−" : "+"}
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex justify-end mb-4">
                              <button 
                                onClick={() => downloadEncryptedPdf(`pdf-record-${record.id}`, `${templateTitle.replace(/\s+/g, '_')}_${clientProfile.full_name.replace(/\s+/g, '_')}.pdf`)}
                                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded font-medium flex items-center gap-2"
                              >
                                <span>📄</span> Stiahnuť PDF
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {Object.entries(record.form_data || {}).map(([key, val]) => (
                                <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                  <p className="text-xs font-bold text-brand-navy mb-1 uppercase tracking-wide">{getFieldLabel(key)}</p>
                                  <div className="text-sm text-gray-800">{renderValue(val)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Skrytá šablóna pre generovanie PDF bez Tailwind farieb (kvôli html2canvas a oklch) */}
                        <div style={{ position: 'absolute', top: 0, left: '-9999px', width: '794px' }}>
                          <div id={`pdf-record-${record.id}`} style={{ backgroundColor: '#ffffff', color: '#000000', padding: '20px', fontFamily: '"Noto Sans", sans-serif' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '16px', marginBottom: '24px', borderBottom: '2px solid #0A192F' }}>
                              <div>
                                <img src="/logo.png" alt="SportWell Logo" style={{ height: '45px', marginBottom: '8px' }} />
                                <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>Černyševského 30, 851 01 Bratislava</p>
                                <p style={{ fontSize: '12px', color: '#6b7280', margin: '0' }}>IČO: 52 124 118</p>
                              </div>
                              <div style={{ textAlign: 'right', maxWidth: '300px' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0A192F', margin: '0 0 8px 0', wordWrap: 'break-word' }}>{templateTitle}</h2>
                                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Dátum: {new Date(record.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            
                            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <h3 style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '12px', color: '#0A192F' }}>Údaje o klientovi</h3>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                                <p style={{ margin: 0 }}><strong style={{ color: '#6b7280', fontWeight: 'normal' }}>Meno:</strong> {clientProfile.full_name}</p>
                                <p style={{ margin: 0 }}><strong style={{ color: '#6b7280', fontWeight: 'normal' }}>Telefón:</strong> {clientProfile.phone || "Nezadané"}</p>
                                <p style={{ margin: 0 }}><strong style={{ color: '#6b7280', fontWeight: 'normal' }}>E-mail:</strong> {clientProfile.email || "Nezadané"}</p>
                                <p style={{ margin: 0 }}><strong style={{ color: '#6b7280', fontWeight: 'normal' }}>Dátum narodenia:</strong> {clientProfile.metadata?.birthDate ? new Date(clientProfile.metadata.birthDate).toLocaleDateString() : "Nezadané"}</p>
                              </div>
                            </div>

                            <h3 style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '16px', paddingBottom: '8px', color: '#0A192F', borderBottom: '1px solid #e2e8f0' }}>Výsledky diagnostiky</h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
                              {Object.entries(record.form_data || {}).map(([key, val]) => (
                                <div key={key} style={{ pageBreakInside: 'avoid', breakInside: 'avoid', backgroundColor: '#ffffff', padding: '8px', borderRadius: '4px', border: '1px solid #f1f5f9' }}>
                                  <p style={{ fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', color: '#475569', margin: '0 0 4px 0' }}>{getFieldLabel(key)}</p>
                                  <div style={{ margin: 0, color: '#0f172a' }}>{renderValue(val)}</div>
                                </div>
                              ))}
                            </div>
                            
                            <div style={{ marginTop: '40px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '11px', color: '#94a3b8' }}>
                              <p style={{ margin: 0 }}>Vygenerované systémom SportWell • {new Date().toLocaleString('sk-SK')}</p>
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
