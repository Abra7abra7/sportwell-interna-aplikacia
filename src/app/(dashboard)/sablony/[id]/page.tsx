"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface FormField {
  id: string;
  type: "text" | "textarea" | "select" | "radio" | "checkbox_group" | "file_upload";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // Pre select, radio, checkbox_group
}

interface FormSchema {
  fields: FormField[];
}

export default function FormBuilderPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;
  const supabase = createClient();

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  const loadTemplate = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('form_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (data && !error) {
      setTitle(data.title || "Bez názvu");
      setCategory(data.category || "Všeobecné");
      
      let loadedFields: FormField[] = [];
      if (data.schema?.fields) {
        loadedFields = data.schema.fields;
      } else if (data.schema?.steps) {
        // Zlúčenie všetkých otázok zo všetkých krokov (legacy format)
        loadedFields = data.schema.steps.reduce((acc: FormField[], step: any) => {
          return [...acc, ...(step.fields || [])];
        }, []);
      } else if (Array.isArray(data.schema)) {
        loadedFields = data.schema;
      }
      
      setFields(loadedFields);
    } else {
      alert("Šablóna nebola nájdená.");
      router.push('/sablony');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const updatedSchema: FormSchema = { fields };
    
    const { error } = await supabase
      .from('form_templates')
      .update({
        title,
        category,
        schema: updatedSchema,
      })
      .eq('id', templateId);

    setSaving(false);
    if (error) {
      alert("Chyba pri ukladaní šablóny.");
    } else {
      alert("Šablóna úspešne uložená!");
      router.push('/sablony');
    }
  };

  const addField = (type: FormField["type"]) => {
    const newField: FormField = {
      id: `q_${Date.now()}`,
      type,
      label: "Nová otázka",
      required: false,
      ...(type === "select" || type === "radio" || type === "checkbox_group" ? { options: ["Možnosť 1", "Možnosť 2"] } : {}),
      ...(type === "text" || type === "textarea" ? { placeholder: "Zadajte odpoveď..." } : {})
    };
    setFields([...fields, newField]);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const removeField = (index: number) => {
    if(confirm("Naozaj chcete vymazať túto otázku?")) {
      const newFields = [...fields];
      newFields.splice(index, 1);
      setFields(newFields);
    }
  };

  const moveField = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= fields.length) return;
    const newFields = [...fields];
    const temp = newFields[index];
    newFields[index] = newFields[index + direction];
    newFields[index + direction] = temp;
    setFields(newFields);
  };

  const updateOption = (fieldIndex: number, optionIndex: number, newValue: string) => {
    const field = fields[fieldIndex];
    if (!field.options) return;
    const newOptions = [...field.options];
    newOptions[optionIndex] = newValue;
    updateField(fieldIndex, { options: newOptions });
  };

  const addOption = (fieldIndex: number) => {
    const field = fields[fieldIndex];
    const newOptions = [...(field.options || []), `Nová možnosť ${(field.options?.length || 0) + 1}`];
    updateField(fieldIndex, { options: newOptions });
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const field = fields[fieldIndex];
    if (!field.options) return;
    const newOptions = [...field.options];
    newOptions.splice(optionIndex, 1);
    updateField(fieldIndex, { options: newOptions });
  };

  if (loading) return <div className="p-8 text-center">Načítavam builder...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => router.push('/sablony')} className="text-brand-cyan hover:underline">&larr; Späť na zoznam</button>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-brand-navy text-white px-6 py-2 rounded-lg font-bold hover:bg-brand-dark-navy disabled:opacity-50"
        >
          {saving ? "Ukladám..." : "Uložiť šablónu"}
        </button>
      </div>

      {/* Nastavenia formulára */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-100">
        <h2 className="text-xl font-bold text-brand-navy mb-4">Všeobecné nastavenia</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Názov formulára / diagnostiky</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategória</label>
            <input 
              type="text" 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none"
            />
          </div>
        </div>
      </div>

      {/* Polia formulára */}
      <div className="space-y-4 mb-8">
        <h2 className="text-xl font-bold text-brand-navy">Otázky a polia</h2>
        {fields.map((field, index) => (
          <div key={field.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 relative group">
            
            {/* Ovládacie prvky pre posúvanie a mazanie */}
            <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => moveField(index, -1)} disabled={index === 0} className="p-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-30">↑</button>
              <button onClick={() => moveField(index, 1)} disabled={index === fields.length - 1} className="p-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-30">↓</button>
              <button onClick={() => removeField(index)} className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-full md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Text otázky / Znenie</label>
                <input 
                  type="text" 
                  value={field.label} 
                  onChange={(e) => updateField(index, { label: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-brand-cyan"
                />
              </div>

              <div className="col-span-full md:col-span-1 flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Typ odpovede</label>
                  <select 
                    value={field.type}
                    onChange={(e) => {
                      const newType = e.target.value as FormField["type"];
                      updateField(index, { type: newType });
                      if ((newType === "select" || newType === "radio" || newType === "checkbox_group") && !field.options) {
                        updateField(index, { type: newType, options: ["Možnosť 1", "Možnosť 2"] });
                      }
                    }}
                    className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-brand-cyan bg-gray-50"
                  >
                    <option value="text">Krátka odpoveď (Text)</option>
                    <option value="textarea">Dlhý text (Textarea)</option>
                    <option value="radio">Výber jednej možnosti (Radio)</option>
                    <option value="checkbox_group">Viacero možností (Zaškrtávacie políčka)</option>
                    <option value="select">Rozbaľovacie menu (Select)</option>
                    <option value="file_upload">Nahrávanie súboru / Fotky</option>
                  </select>
                </div>
                <div className="pt-7">
                  <label className="flex items-center space-x-2 text-sm cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={field.required}
                      onChange={(e) => updateField(index, { required: e.target.checked })}
                      className="rounded text-brand-cyan focus:ring-brand-cyan"
                    />
                    <span>Povinné</span>
                  </label>
                </div>
              </div>

              {/* Nastavenie Placeholderu pre textové polia */}
              {(field.type === "text" || field.type === "textarea") && (
                <div className="col-span-full">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nápoveda (Placeholder)</label>
                  <input 
                    type="text" 
                    value={field.placeholder || ""} 
                    onChange={(e) => updateField(index, { placeholder: e.target.value })}
                    className="w-full border border-gray-200 rounded p-1.5 text-xs outline-none focus:border-brand-cyan"
                    placeholder="Napr.: Zadajte hodnotu v cm..."
                  />
                </div>
              )}

              {/* Informácia pre nahrávanie súborov */}
              {field.type === "file_upload" && (
                <div className="col-span-full mt-2">
                  <p className="text-sm text-brand-cyan bg-brand-light-cyan p-3 rounded-lg border border-brand-cyan/20">
                    ℹ️ V tomto poli bude môcť tréner nahrať fotku alebo PDF. Súbor sa automaticky uloží do dokumentov klienta.
                  </p>
                </div>
              )}

              {/* Nastavenie Možností pre výberové polia */}
              {(field.type === "select" || field.type === "radio" || field.type === "checkbox_group") && (
                <div className="col-span-full bg-gray-50 p-3 rounded border border-gray-200 mt-2">
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Možnosti na výber</label>
                  <div className="space-y-2">
                    {field.options?.map((opt, optIdx) => (
                      <div key={optIdx} className="flex space-x-2">
                        <input 
                          type="text" 
                          value={opt} 
                          onChange={(e) => updateOption(index, optIdx, e.target.value)}
                          className="flex-1 border border-gray-300 rounded p-1.5 text-sm outline-none focus:border-brand-cyan"
                        />
                        <button 
                          onClick={() => removeOption(index, optIdx)}
                          disabled={(field.options?.length || 0) <= 1}
                          className="px-2 text-red-500 hover:bg-red-50 rounded disabled:opacity-30"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => addOption(index)}
                    className="mt-3 text-xs font-bold text-brand-cyan hover:underline"
                  >
                    + Pridať ďalšiu možnosť
                  </button>
                </div>
              )}
            </div>
            
          </div>
        ))}

        {fields.length === 0 && (
          <div className="p-12 text-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
            <p className="text-gray-500 mb-2">Tento formulár zatiaľ nemá žiadne otázky.</p>
          </div>
        )}
      </div>

      {/* Pridať nové pole - Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-gray-200 p-4 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-sm font-bold text-gray-700 hidden sm:block">Pridať do formulára:</span>
          <div className="flex space-x-2 overflow-x-auto pb-1 sm:pb-0">
            <button onClick={() => addField("text")} className="whitespace-nowrap px-3 py-2 bg-brand-light-cyan text-brand-navy text-xs font-bold rounded hover:bg-brand-cyan transition-colors">Krátky text</button>
            <button onClick={() => addField("textarea")} className="whitespace-nowrap px-3 py-2 bg-brand-light-cyan text-brand-navy text-xs font-bold rounded hover:bg-brand-cyan transition-colors">Dlhý text</button>
            <button onClick={() => addField("radio")} className="whitespace-nowrap px-3 py-2 bg-brand-light-cyan text-brand-navy text-xs font-bold rounded hover:bg-brand-cyan transition-colors">Výber (Radio)</button>
            <button onClick={() => addField("checkbox_group")} className="whitespace-nowrap px-3 py-2 bg-brand-light-cyan text-brand-navy text-xs font-bold rounded hover:bg-brand-cyan transition-colors">Viac možností</button>
            <button onClick={() => addField("file_upload" as any)} className="whitespace-nowrap px-3 py-2 bg-brand-light-cyan text-brand-navy text-xs font-bold rounded hover:bg-brand-cyan transition-colors">Nahrávanie súboru</button>
          </div>
        </div>
      </div>
    </div>
  );
}
