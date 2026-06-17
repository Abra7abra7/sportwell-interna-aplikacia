"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAuthContext } from "@/components/providers/AuthProvider";
import DynamicForm from "@/components/forms/DynamicForm";

export default function VyplnitDiagnostikuPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const { currentUserProfile } = useAuthContext();
  const supabase = createClient();
  
  const templateId = params.id as string;
  const clientId = searchParams.get('clientId');

  const [template, setTemplate] = useState<any>(null);
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!templateId || !clientId) {
      setError("Chýbajúce parametre v adrese (ID šablóny alebo ID klienta).");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      
      // Fetch template
      const { data: tplData, error: tplError } = await supabase
        .from('form_templates')
        .select('*')
        .eq('id', templateId)
        .single();
        
      if (tplError || !tplData) {
        setError("Nepodarilo sa načítať šablónu diagnostiky.");
        setLoading(false);
        return;
      }
      setTemplate(tplData);

      // Fetch client
      const { data: clData, error: clError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', clientId)
        .single();
        
      if (clError || !clData) {
        setError("Klient nebol nájdený.");
      } else {
        setClientProfile(clData);
      }
      
      setLoading(false);
    };

    fetchData();
  }, [templateId, clientId]);

  const [submittedData, setSubmittedData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const formatKey = (key: string) => key.replace(/q\d+_/g, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  const renderValue = (val: any) => {
    if (!val) return <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Nezadané</span>;
    if (Array.isArray(val)) return val.join(", ");
    
    // Check if it's an uploaded file object
    if (typeof val === 'object' && val !== null && val.fileName && val.path) {
      if (val.type?.startsWith('image/')) {
        const { data: { publicUrl } } = supabase.storage.from('client_records_files').getPublicUrl(val.path);
        return (
          <div style={{ marginTop: '8px' }}>
            <img src={publicUrl} alt={val.fileName} style={{ maxHeight: '200px', borderRadius: '8px', border: '1px solid #e2e8f0', objectFit: 'contain' }} />
            <p style={{ fontSize: '11px', color: '#6b7280', margin: '4px 0 0 0' }}>{val.fileName}</p>
          </div>
        );
      } else {
        return <span style={{ fontWeight: 500, color: '#00F0FF' }}>📄 Priložený súbor: {val.fileName}</span>;
      }
    }

    if (typeof val === 'object' && val !== null) {
      return (
        <ul style={{ paddingLeft: '20px', listStyleType: 'disc', margin: '4px 0', fontSize: '13px' }}>
          {Object.entries(val).map(([k, v]) => (
            <li key={k}><strong style={{ color: '#374151', fontWeight: 500 }}>{k}:</strong> {String(v)}</li>
          ))}
        </ul>
      );
    }
    return String(val);
  };

  const handleSubmit = async (formData: any) => {
    if (!currentUserProfile || submitting) return;
    setSubmitting(true);

    try {
      // 0. Upload any files first and replace them in formData with their paths
      const processedFormData = { ...formData };
      for (const key of Object.keys(processedFormData)) {
        const val = processedFormData[key];
        if (val instanceof File) {
          const fileExt = val.name.split('.').pop();
          const fileName = `${key}_${Date.now()}.${fileExt}`;
          const filePath = `${clientId}/uploads/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('client_records_files')
            .upload(filePath, val);

          if (uploadError) {
            console.error("Error uploading file:", uploadError);
            throw new Error(`Nepodarilo sa nahrať súbor ${val.name}`);
          }

          // Replace File object with metadata for the DB
          processedFormData[key] = {
            fileName: val.name,
            path: filePath,
            type: val.type
          };
          
          // Upozornenie: Neukladáme do tabuľky 'documents', keďže ide o súčasť 'client_records'.
        }
      }

      // 1. Save data to client_records
      const { data: recordData, error: dbError } = await supabase.from('client_records').insert({
        client_id: clientId,
        created_by: currentUserProfile.id,
        template_id: templateId,
        form_data: processedFormData
      }).select().single();

      if (dbError) throw dbError;

      // 2. Render hidden template
      setSubmittedData({ ...recordData, form_data: processedFormData });
      
      // Wait for React to render the hidden template
      setTimeout(async () => {
        try {
          const { generatePdfBlob } = await import('@/utils/pdfGenerator');
          
          // Generate password from birthDate (DDMMYYYY)
          let password = "sportwell";
          if (clientProfile?.metadata?.birthDate) {
            const d = new Date(clientProfile.metadata.birthDate);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            password = `${day}${month}${year}`;
          }

          const pdfBlob = await generatePdfBlob('pdf-record-new', password);
          if (pdfBlob) {
            const fileName = `${template.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
            const filePath = `${clientId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('client_documents')
              .upload(filePath, pdfBlob, { contentType: 'application/pdf' });

            if (!uploadError) {
              await supabase.from('documents').insert({
                client_id: clientId,
                file_name: fileName,
                storage_path: filePath
              });
            }
          }
          
          alert(`Diagnostika bola úspešne uložená.\nPDF bolo zaheslované heslom: ${password} a pridané do dokumentov.`);
          router.push(`/klienti/${clientId}`);
        } catch (pdfErr) {
          console.error("PDF gen error:", pdfErr);
          alert("Dáta boli uložené, ale generovanie PDF zlyhalo.");
          router.push(`/klienti/${clientId}`);
        }
      }, 500); // give DOM time to render hidden template
      
    } catch (err: any) {
      console.error("Error saving record:", err);
      alert("Nastala chyba pri ukladaní: " + err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Načítavam formulár...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-bold mb-4">{error}</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-gray-200 rounded">Späť</button>
      </div>
    );
  }

  let allFields: any[] = [];
  if (template?.schema?.steps) {
    allFields = template.schema.steps.flatMap((s: any) => s.fields || []);
  } else if (template?.schema?.fields) {
    allFields = template.schema.fields;
  } else if (Array.isArray(template?.schema)) {
    allFields = template.schema;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => router.back()}
          className="p-2 bg-white rounded-full shadow hover:bg-gray-50"
        >
          &larr; Späť
        </button>
        <div>
          <h2 className="text-2xl font-bold text-brand-navy">{template.title}</h2>
          <p className="text-gray-500">Klient: <span className="font-bold text-brand-navy">{clientProfile?.full_name}</span></p>
        </div>
      </div>

      {submitting ? (
        <div className="bg-white p-12 rounded-xl shadow text-center border border-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan mx-auto mb-4"></div>
          <h3 className="text-lg font-bold text-brand-navy mb-2">Ukladám záznamy a generujem PDF...</h3>
          <p className="text-gray-500">Zabezpečujem a šifrujem zdravotné údaje. Prosím čakajte.</p>
        </div>
      ) : (
        <DynamicForm 
          schema={template.schema} 
          onSubmit={handleSubmit} 
          onCancel={() => router.back()} 
        />
      )}

      {/* Hidden PDF template */}
      {submittedData && (
        <div style={{ position: 'absolute', top: 0, left: '-9999px', width: '794px' }}>
          <div id="pdf-record-new" style={{ backgroundColor: '#ffffff', color: '#000000', fontFamily: '"Noto Sans", sans-serif' }}>
            <div style={{ backgroundColor: '#0A192F', color: '#ffffff', padding: '30px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <img src="/logo.png" alt="SportWell Logo" style={{ height: '50px', width: 'auto', marginBottom: '8px' }} />
                <p style={{ fontSize: '13px', color: '#D3FAFF', margin: '2px 0', opacity: 0.8 }}>Černyševského 30, 851 01 Bratislava</p>
                <p style={{ fontSize: '13px', color: '#D3FAFF', margin: '0', opacity: 0.8 }}>IČO: 52 124 118</p>
              </div>
              <div style={{ textAlign: 'right', maxWidth: '350px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#00F0FF', margin: '0 0 8px 0', wordWrap: 'break-word', textTransform: 'uppercase' }}>{template.title}</h2>
                <p style={{ fontSize: '14px', color: '#ffffff', margin: 0, opacity: 0.9 }}>Dátum vyšetrenia: {new Date(submittedData.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div style={{ padding: '40px' }}>
              <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#F7FAFC', borderRadius: '12px', borderLeft: '4px solid #00F0FF', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '16px', color: '#020C1B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Údaje o pacientovi</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                  <p style={{ margin: 0 }}><strong style={{ color: '#0A192F', width: '120px', display: 'inline-block' }}>Meno:</strong> {clientProfile.full_name}</p>
                  <p style={{ margin: 0 }}><strong style={{ color: '#0A192F', width: '120px', display: 'inline-block' }}>Telefón:</strong> {clientProfile.phone || "Nezadané"}</p>
                  <p style={{ margin: 0 }}><strong style={{ color: '#0A192F', width: '120px', display: 'inline-block' }}>E-mail:</strong> {clientProfile.email || "Nezadané"}</p>
                  <p style={{ margin: 0 }}><strong style={{ color: '#0A192F', width: '120px', display: 'inline-block' }}>Dátum nar.:</strong> {clientProfile.metadata?.birthDate ? new Date(clientProfile.metadata.birthDate).toLocaleDateString() : "Nezadané"}</p>
                </div>
              </div>

              <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '20px', paddingBottom: '10px', color: '#020C1B', borderBottom: '2px solid #D3FAFF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Výsledky diagnostiky</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '14px' }}>
                {allFields.map((field) => {
                  const val = submittedData.form_data?.[field.id];
                  return (
                    <div key={field.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid', backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                      <p style={{ fontWeight: 'bold', fontSize: '12px', color: '#00F0FF', margin: '0 0 6px 0', letterSpacing: '0.5px' }}>{field.label}</p>
                      <div style={{ margin: 0, color: '#0A192F', fontWeight: '500' }}>{renderValue(val)}</div>
                    </div>
                  );
                })}
              </div>
              
              <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                <p style={{ margin: 0 }}>Vygenerované a elektronicky zašifrované systémom SportWell • {new Date().toLocaleString('sk-SK')}</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '10px' }}>Tento dokument obsahuje prísne dôverné lekárske a fyzioterapeutické údaje.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
