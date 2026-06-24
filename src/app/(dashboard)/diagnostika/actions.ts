"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { generateDiagnosticPdf } from "@/utils/pdf/generateDiagnosticPdf";

async function getUserIdAndRole(supabase: any) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Neautorizovaný prístup. Prihláste sa prosím.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, permissions")
    .eq("id", user.id)
    .single();

  return { userId: user.id, role: profile?.role || "klient", permissions: profile?.permissions || {} };
}

async function checkDiagnostikaPermission(supabase: any) {
  const { role, permissions } = await getUserIdAndRole(supabase);
  
  if (role === "klient") {
    throw new Error("Klienti nemajú prístup k diagnostikám.");
  }

  const hasAccess = ["admin", "majitel", "recepcia"].includes(role) || permissions.diagnostika?.write === true;
  if (!hasAccess) {
    throw new Error("Nemáte oprávnenie na zápis alebo správu diagnostík.");
  }

  return { role };
}

export async function grantProxyConsentAction(clientId: string) {
  const supabase = await createClient();
  await checkDiagnostikaPermission(supabase);

  if (!clientId) {
    throw new Error("Identifikátor klienta je povinný.");
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({ gdpr_signed_at: now })
    .eq("id", clientId);

  if (error) {
    console.error("Error granting proxy GDPR:", error);
    throw new Error("Chyba pri ukladaní zástupného GDPR súhlasu: " + error.message);
  }

  revalidatePath("/diagnostika");
  revalidatePath(`/klienti/${clientId}`);
}

export async function submitDiagnosticAction(
  clientId: string,
  templateId: string,
  formData: any
) {
  const supabase = await createClient();
  const { userId } = await getUserIdAndRole(supabase);
  await checkDiagnostikaPermission(supabase);

  if (!clientId || !templateId || !formData) {
    throw new Error("Všetky parametre (clientId, templateId, formData) sú povinné.");
  }

  // 1. Získať šablónu a profil klienta
  const { data: template, error: tplError } = await supabase
    .from("form_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (tplError || !template) {
    throw new Error("Šablóna diagnostiky nebola nájdená.");
  }

  const { data: clientProfile, error: clError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", clientId)
    .single();

  if (clError || !clientProfile) {
    throw new Error("Profil klienta nebol nájdený.");
  }

  // 2. Uložiť dáta do client_records
  const { data: recordData, error: dbError } = await supabase
    .from("client_records")
    .insert({
      client_id: clientId,
      created_by: userId,
      template_id: templateId,
      form_data: formData,
    })
    .select()
    .single();

  if (dbError || !recordData) {
    console.error("Error inserting client record:", dbError);
    throw new Error("Chyba pri ukladaní výsledkov diagnostiky: " + dbError?.message);
  }

  // 3. Normalizovať otázky a priradiť odpovede
  let allFields: any[] = [];
  if (template.schema?.fields) {
    allFields = template.schema.fields;
  } else if (template.schema?.steps) {
    allFields = template.schema.steps.flatMap((s: any) => s.fields || []);
  } else if (Array.isArray(template.schema)) {
    allFields = template.schema;
  }

  const fieldsWithAnswers = allFields.map((field: any) => {
    return {
      label: field.label || "Otázka",
      value: formData[field.id] !== undefined ? formData[field.id] : null,
    };
  });

  // 4. Vygenerovať PDF na serveri
  try {
    const pdfBuffer = await generateDiagnosticPdf(
      template.title,
      clientProfile,
      recordData.created_at,
      fieldsWithAnswers
    );

    const fileName = `${template.title.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
    const filePath = `${clientId}/${fileName}`;

    // 5. Nahrať do Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("client_documents")
      .upload(filePath, pdfBuffer, { contentType: "application/pdf" });

    if (uploadError) {
      console.error("Error uploading diagnostic PDF:", uploadError);
    } else {
      // 6. Zapísať do tabuľky documents
      const { error: docError } = await supabase
        .from("documents")
        .insert({
          client_id: clientId,
          file_name: fileName,
          storage_path: filePath,
        });

      if (docError) {
        console.error("Error inserting document record:", docError);
      }
    }
  } catch (pdfErr) {
    console.error("Chyba pri generovaní alebo nahrávaní PDF diagnostiky:", pdfErr);
    // Nevyhadzujeme chybu pre celú operáciu, pretože samotné dáta diagnostiky boli úspešne uložené
  }

  revalidatePath(`/klienti/${clientId}`);
  revalidatePath("/diagnostika");
}
