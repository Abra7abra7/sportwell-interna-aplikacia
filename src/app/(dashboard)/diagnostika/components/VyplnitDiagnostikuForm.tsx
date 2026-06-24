"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import DynamicForm from "@/components/forms/DynamicForm";
import { submitDiagnosticAction } from "../actions";

interface VyplnitDiagnostikuFormProps {
  template: {
    id: string;
    title: string;
    schema: any;
  };
  clientProfile: {
    id: string;
    full_name: string;
    metadata?: {
      birthDate?: string;
    };
  };
}

export default function VyplnitDiagnostikuForm({
  template,
  clientProfile
}: VyplnitDiagnostikuFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  const handleSubmit = (formData: any) => {
    startTransition(async () => {
      try {
        const processedFormData = { ...formData };

        // 1. Upload any File objects in formData client-side
        for (const key of Object.keys(processedFormData)) {
          const val = processedFormData[key];
          if (val instanceof File) {
            const fileExt = val.name.split(".").pop();
            const fileName = `${key}_${Date.now()}.${fileExt}`;
            const filePath = `${clientProfile.id}/uploads/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from("client_records_files")
              .upload(filePath, val);

            if (uploadError) {
              console.error("Error uploading file:", uploadError);
              throw new Error(`Nepodarilo sa nahrať súbor ${val.name}: ${uploadError.message}`);
            }

            // Replace File object with database-compatible metadata
            processedFormData[key] = {
              fileName: val.name,
              path: filePath,
              type: val.type
            };
          }
        }

        // 2. Invoke the Server Action to save records and compile A4 PDF report on the server
        await submitDiagnosticAction(clientProfile.id, template.id, processedFormData);

        // 3. Generate birthdate password string for client alert (DDMMYYYY)
        let password = "sportwell";
        if (clientProfile.metadata?.birthDate) {
          const d = new Date(clientProfile.metadata.birthDate);
          const day = String(d.getDate()).padStart(2, "0");
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const year = d.getFullYear();
          password = `${day}${month}${year}`;
        }

        alert(`Diagnostika bola úspešne uložená.\nPDF bolo vygenerované na serveri, zabezpečené heslom: ${password} a uložené v dokumentoch.`);
        router.push(`/klienti/${clientProfile.id}`);
      } catch (err: any) {
        console.error("Error submitting diagnostic:", err);
        alert(err.message || "Nastala chyba pri ukladaní diagnostiky.");
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 bg-white rounded-full shadow hover:bg-gray-50 flex items-center justify-center font-bold text-gray-700 cursor-pointer"
          title="Späť"
        >
          &larr;
        </button>
        <div>
          <h2 className="text-2xl font-bold text-brand-navy">{template.title}</h2>
          <p className="text-gray-500">
            Klient: <span className="font-bold text-brand-navy">{clientProfile.full_name}</span>
          </p>
        </div>
      </div>

      {isPending ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-gray-100 animate-pulse">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan mx-auto mb-4"></div>
          <h3 className="text-lg font-bold text-brand-navy mb-2">Ukladám záznamy a generujem PDF...</h3>
          <p className="text-gray-500 text-sm">Zabezpečujem a šifrujem zdravotné údaje. Prosím čakajte.</p>
        </div>
      ) : (
        <DynamicForm
          schema={template.schema}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
        />
      )}
    </div>
  );
}
