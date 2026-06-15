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

  const handleSubmit = async (formData: any) => {
    if (!currentUserProfile) return;

    try {
      const { error: dbError } = await supabase.from('client_records').insert({
        client_id: clientId,
        created_by: currentUserProfile.id,
        template_id: templateId,
        form_data: formData
      });

      if (dbError) throw dbError;

      alert("Diagnostika bola úspešne uložená.");
      router.push(`/klienti/${clientId}`);
      
    } catch (err: any) {
      console.error("Error saving record:", err);
      alert("Nastala chyba pri ukladaní: " + err.message);
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

      <DynamicForm 
        schema={template.schema} 
        onSubmit={handleSubmit} 
        onCancel={() => router.back()} 
      />
    </div>
  );
}
