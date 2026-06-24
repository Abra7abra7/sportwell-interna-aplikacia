"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTemplateAction, deleteTemplateAction } from "../actions";

interface FormTemplate {
  id: string;
  title: string;
  category: string;
  schema: any;
}

interface TemplatesListProps {
  initialTemplates: FormTemplate[];
  role: string;
}

export default function TemplatesList({ initialTemplates, role }: TemplatesListProps) {
  const [templates, setTemplates] = useState<FormTemplate[]>(initialTemplates);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleCreateNew = () => {
    startTransition(async () => {
      try {
        const newTemplate = await createTemplateAction();
        router.push(`/sablony/${newTemplate.id}`);
      } catch (err: any) {
        alert(err.message || "Chyba pri vytváraní šablóny.");
      }
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (title === "Základná diagnostika") {
      alert("Základnú diagnostiku nie je možné vymazať.");
      return;
    }

    if (!confirm(`Naozaj chcete vymazať šablónu "${title}"?`)) {
      return;
    }

    setDeletingId(id);
    startTransition(async () => {
      try {
        await deleteTemplateAction(id);
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      } catch (err: any) {
        alert(err.message || "Chyba pri mazaní šablóny.");
      } finally {
        setDeletingId(null);
      }
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy tracking-tight">Správa formulárov a šablón</h1>
          <p className="text-sm text-gray-500 mt-1">Tu môžete upravovať existujúce formuláre (diagnostiky) alebo vytvárať nové.</p>
        </div>
        <button
          onClick={handleCreateNew}
          disabled={isPending}
          className="w-full sm:w-auto h-11 bg-brand-cyan hover:bg-brand-navy hover:text-white text-brand-navy font-bold px-6 rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isPending ? (
            <div className="w-5 h-5 border-2 border-brand-navy border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>Nová Šablóna</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {templates.map((template) => {
          const isDeleting = deletingId === template.id;
          const questionsCount = template.schema?.fields?.length || 0;

          return (
            <div
              key={template.id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-brand-cyan hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <h2 className="text-lg font-bold text-brand-navy leading-tight">{template.title}</h2>
                  <span className="text-xs font-semibold bg-brand-light-cyan text-brand-navy px-2.5 py-1 rounded-full shrink-0">
                    {template.category}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Počet otázok: <span className="font-semibold text-gray-700">{questionsCount}</span>
                </p>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => router.push(`/sablony/${template.id}`)}
                  className="flex-1 h-11 bg-brand-light-cyan hover:bg-brand-cyan text-brand-navy font-bold rounded-xl transition-all duration-200 flex items-center justify-center text-sm cursor-pointer"
                >
                  Upraviť formulár
                </button>
                <button
                  onClick={() => handleDelete(template.id, template.title)}
                  disabled={isDeleting}
                  title="Vymazať šablónu"
                  className="w-11 h-11 shrink-0 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 font-bold rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {templates.length === 0 && (
          <div className="col-span-full p-16 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-white/50 backdrop-blur-sm">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-500 font-medium">Zatiaľ nemáte vytvorené žiadne šablóny formulárov.</p>
          </div>
        )}
      </div>
    </div>
  );
}
