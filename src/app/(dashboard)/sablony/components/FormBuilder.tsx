"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTemplateAction, FormField } from "../actions";

interface FormBuilderProps {
  template: {
    id: string;
    title: string;
    category: string;
    schema: {
      fields: FormField[];
    };
  };
}

export default function FormBuilder({ template }: FormBuilderProps) {
  const [title, setTitle] = useState(template.title || "");
  const [category, setCategory] = useState(template.category || "");
  const [fields, setFields] = useState<FormField[]>(template.schema?.fields || []);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();

  const handleSave = () => {
    if (!title.trim()) {
      alert("Názov formulára je povinný.");
      return;
    }
    if (!category.trim()) {
      alert("Kategória je povinná.");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          title: title.trim(),
          category: category.trim(),
          schema: { fields },
        };
        await updateTemplateAction(template.id, payload);
        alert("Šablóna úspešne uložená!");
        router.push("/sablony");
      } catch (err: any) {
        alert(err.message || "Chyba pri ukladaní šablóny.");
      }
    });
  };

  const addField = (type: FormField["type"]) => {
    const newField: FormField = {
      id: `q_${Date.now()}`,
      type,
      label: "Nová otázka",
      required: false,
      ...(type === "select" || type === "radio" || type === "checkbox_group"
        ? { options: ["Možnosť 1", "Možnosť 2"] }
        : {}),
      ...(type === "text" || type === "textarea" ? { placeholder: "Zadajte odpoveď..." } : {}),
    };
    setFields([...fields, newField]);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates } as FormField;
    setFields(newFields);
  };

  const removeField = (index: number) => {
    if (confirm("Naozaj chcete vymazať túto otázku?")) {
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

  return (
    <div className="max-w-4xl mx-auto pb-32 px-4 sm:px-6">
      {/* Header navigácia a tlačidlo Uložiť */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <button
          onClick={() => router.push("/sablony")}
          className="text-brand-cyan hover:text-brand-navy hover:underline text-sm font-bold flex items-center gap-1.5 cursor-pointer h-11"
        >
          &larr; Späť na zoznam
        </button>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="w-full sm:w-auto h-11 bg-brand-navy hover:bg-brand-dark-navy text-white px-6 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isPending ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Ukladám...</span>
            </>
          ) : (
            <span>Uložiť šablónu</span>
          )}
        </button>
      </div>

      {/* Všeobecné nastavenia */}
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-gray-100">
        <h2 className="text-xl font-bold text-brand-navy mb-4">Všeobecné nastavenia</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Názov formulára / diagnostiky</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 border border-gray-300 rounded-xl px-4 focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none transition-all text-sm"
              placeholder="Napr. Diagnostika kolena"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategória</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 border border-gray-300 rounded-xl px-4 focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none transition-all text-sm"
              placeholder="Napr. Koleno, Anamnéza..."
            />
          </div>
        </div>
      </div>

      {/* Otázky a polia */}
      <div className="space-y-5 mb-8">
        <h2 className="text-xl font-bold text-brand-navy">Otázky a polia</h2>
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative group transition-all duration-200 hover:border-gray-300"
          >
            {/* Ovládacie prvky pre posúvanie a mazanie s touch target 44x44px */}
            <div className="absolute top-4 right-4 flex space-x-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => moveField(index, -1)}
                disabled={index === 0}
                className="w-10 h-10 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-30 flex items-center justify-center font-bold text-gray-700 cursor-pointer"
                title="Posunúť hore"
              >
                ↑
              </button>
              <button
                onClick={() => moveField(index, 1)}
                disabled={index === fields.length - 1}
                className="w-10 h-10 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-30 flex items-center justify-center font-bold text-gray-700 cursor-pointer"
                title="Posunúť dole"
              >
                ↓
              </button>
              <button
                onClick={() => removeField(index)}
                className="w-10 h-10 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 flex items-center justify-center font-bold cursor-pointer"
                title="Odstrániť otázku"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 sm:mt-0">
              <div className="col-span-full md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Text otázky / Znenie</label>
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => updateField(index, { label: e.target.value })}
                  className="w-full h-11 border border-gray-300 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan transition-all"
                  placeholder="Zadajte text otázky..."
                />
              </div>

              <div className="col-span-full md:col-span-1 flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Typ odpovede</label>
                  <select
                    value={field.type}
                    onChange={(e) => {
                      const newType = e.target.value as FormField["type"];
                      updateField(index, { type: newType });
                      if (
                        (newType === "select" || newType === "radio" || newType === "checkbox_group") &&
                        !field.options
                      ) {
                        updateField(index, { type: newType, options: ["Možnosť 1", "Možnosť 2"] });
                      }
                    }}
                    className="w-full h-11 border border-gray-300 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan transition-all bg-gray-50 font-medium"
                  >
                    <option value="text">Krátka odpoveď (Text)</option>
                    <option value="textarea">Dlhý text (Textarea)</option>
                    <option value="radio">Výber jednej možnosti (Radio)</option>
                    <option value="checkbox_group">Viacero možností (Zaškrtávacie políčka)</option>
                    <option value="select">Rozbaľovacie menu (Select)</option>
                    <option value="file_upload">Nahrávanie súboru / Fotky</option>
                  </select>
                </div>
                <div className="flex items-end pb-3">
                  <label className="flex items-center space-x-2.5 text-sm cursor-pointer select-none font-semibold text-gray-700">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(index, { required: e.target.checked })}
                      className="w-5 h-5 rounded text-brand-cyan focus:ring-brand-cyan cursor-pointer"
                    />
                    <span>Povinné</span>
                  </label>
                </div>
              </div>

              {/* Nastavenie Placeholderu pre textové polia */}
              {(field.type === "text" || field.type === "textarea") && (
                <div className="col-span-full mt-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Nápoveda (Placeholder)</label>
                  <input
                    type="text"
                    value={field.placeholder || ""}
                    onChange={(e) => updateField(index, { placeholder: e.target.value })}
                    className="w-full h-9 border border-gray-200 rounded-lg px-3 text-xs outline-none focus:border-brand-cyan transition-all"
                    placeholder="Napr.: Zadajte hodnotu v cm..."
                  />
                </div>
              )}

              {/* Informácia pre nahrávanie súborov */}
              {field.type === "file_upload" && (
                <div className="col-span-full mt-2">
                  <p className="text-sm text-brand-cyan bg-brand-light-cyan p-4 rounded-xl border border-brand-cyan/20 font-medium">
                    ℹ️ V tomto poli bude môcť tréner nahrať fotku alebo PDF. Súbor sa automaticky uloží do dokumentov
                    klienta.
                  </p>
                </div>
              )}

              {/* Nastavenie Možností pre výberové polia */}
              {(field.type === "select" || field.type === "radio" || field.type === "checkbox_group") && (
                <div className="col-span-full bg-gray-50 p-4 rounded-xl border border-gray-200 mt-2">
                  <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">
                    Možnosti na výber
                  </label>
                  <div className="space-y-2">
                    {field.options?.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOption(index, optIdx, e.target.value)}
                          className="flex-1 h-10 border border-gray-300 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan transition-all bg-white"
                        />
                        <button
                          onClick={() => removeOption(index, optIdx)}
                          disabled={(field.options?.length || 0) <= 1}
                          className="w-10 h-10 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 flex items-center justify-center font-bold cursor-pointer"
                          title="Odstrániť možnosť"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => addOption(index)}
                    className="mt-4 px-4 h-10 bg-brand-light-cyan hover:bg-brand-cyan text-brand-navy text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center cursor-pointer"
                  >
                    + Pridať ďalšiu možnosť
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {fields.length === 0 && (
          <div className="p-16 text-center border-2 border-dashed border-gray-300 rounded-2xl bg-white/50 backdrop-blur-sm">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 font-medium mb-1">Tento formulár zatiaľ nemá žiadne otázky.</p>
            <p className="text-xs text-gray-400">Pridajte ich pomocou spodného panela.</p>
          </div>
        )}
      </div>

      {/* Pridať nové pole - Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-gray-200 p-4 z-40 shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.08)]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm font-bold text-gray-700 shrink-0">Pridať do formulára:</span>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-center">
            <button
              onClick={() => addField("text")}
              className="flex-1 sm:flex-none h-10 px-4 bg-brand-light-cyan hover:bg-brand-cyan text-brand-navy text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center whitespace-nowrap"
            >
              Krátky text
            </button>
            <button
              onClick={() => addField("textarea")}
              className="flex-1 sm:flex-none h-10 px-4 bg-brand-light-cyan hover:bg-brand-cyan text-brand-navy text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center whitespace-nowrap"
            >
              Dlhý text
            </button>
            <button
              onClick={() => addField("radio")}
              className="flex-1 sm:flex-none h-10 px-4 bg-brand-light-cyan hover:bg-brand-cyan text-brand-navy text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center whitespace-nowrap"
            >
              Výber (Radio)
            </button>
            <button
              onClick={() => addField("checkbox_group")}
              className="flex-1 sm:flex-none h-10 px-4 bg-brand-light-cyan hover:bg-brand-cyan text-brand-navy text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center whitespace-nowrap"
            >
              Viac možností
            </button>
            <button
              onClick={() => addField("file_upload")}
              className="flex-1 sm:flex-none h-10 px-4 bg-brand-light-cyan hover:bg-brand-cyan text-brand-navy text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center whitespace-nowrap"
            >
              Nahrávanie súboru
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
