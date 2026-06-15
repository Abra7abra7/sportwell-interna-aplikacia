"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface FormTemplate {
  id: string;
  title: string;
  category: string;
  schema: any;
}

export default function SablonyPage() {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('form_templates')
      .select('*')
      .order('title', { ascending: true });
      
    if (data) {
      setTemplates(data);
    }
    setLoading(false);
  };

  const handleCreateNew = async () => {
    // Create an empty template and redirect to builder
    const newTemplate = {
      title: 'Nová šablóna',
      category: 'Všeobecné',
      schema: { fields: [] }
    };
    
    const { data, error } = await supabase
      .from('form_templates')
      .insert(newTemplate)
      .select()
      .single();
      
    if (data && !error) {
      router.push(`/sablony/${data.id}`);
    } else {
      alert("Chyba pri vytváraní šablóny.");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (title === "Základná diagnostika") {
      alert("Základnú diagnostiku nie je možné vymazať.");
      return;
    }
    
    if (confirm(`Naozaj chcete vymazať šablónu "${title}"?`)) {
      const { error } = await supabase.from('form_templates').delete().eq('id', id);
      if (error) {
        alert("Chyba pri mazaní šablóny.");
      } else {
        fetchTemplates();
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Načítavam šablóny...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Správa formulárov a šablón</h1>
          <p className="text-sm text-gray-500">Tu môžete upravovať existujúce formuláre (diagnostiky) alebo vytvárať nové.</p>
        </div>
        <button 
          onClick={handleCreateNew}
          className="bg-brand-cyan hover:bg-brand-navy hover:text-white text-brand-navy font-bold py-2 px-6 rounded-lg shadow transition-colors"
        >
          + Nová Šablóna
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <div key={template.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-brand-cyan transition-colors flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-bold text-brand-navy">{template.title}</h2>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{template.category}</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Počet otázok: {template.schema?.fields?.length || 0}
              </p>
            </div>
            
            <div className="flex space-x-2 mt-4">
              <button 
                onClick={() => router.push(`/sablony/${template.id}`)}
                className="flex-1 bg-brand-light-cyan hover:bg-brand-cyan text-brand-navy font-medium py-2 rounded-lg transition-colors"
              >
                Upraviť formulár
              </button>
              <button 
                onClick={() => handleDelete(template.id, template.title)}
                title="Vymazať šablónu"
                className="px-3 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 font-bold rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        
        {templates.length === 0 && (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-gray-500">Zatiaľ nemáte vytvorené žiadne šablóny formulárov.</p>
          </div>
        )}
      </div>
    </div>
  );
}
