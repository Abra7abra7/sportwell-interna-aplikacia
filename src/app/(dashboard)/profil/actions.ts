"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateGdprPdf } from "@/utils/pdf/generateGdprPdf";
import { GdprConsentFormData } from "@/components/gdpr/schema";

const profileUpdateSchema = z.object({
  phone: z.string().min(9, "Telefónne číslo je príliš krátke.").regex(/^\+?[0-9\s]+$/, "Telefónne číslo má nesprávny formát."),
  street: z.string().min(3, "Ulica a číslo sú povinné."),
  city: z.string().min(2, "Mesto je povinné."),
  zip: z.string().regex(/^\d{5}$/, "PSČ musí obsahovať presne 5 číslic bez medzier."),
  marketingConsent: z.boolean().optional(),
  metaConsent: z.boolean().optional(),
  diagnosticsConsent: z.boolean().optional(),
});

export async function updateProfileAction(data: {
  phone: string;
  street: string;
  city: string;
  zip: string;
  marketingConsent?: boolean;
  metaConsent?: boolean;
  diagnosticsConsent?: boolean;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Neautorizovaný prístup. Prihláste sa prosím.");
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileErr || !profile) {
    throw new Error("Profil nebol nájdený.");
  }

  const validation = profileUpdateSchema.safeParse(data);
  if (!validation.success) {
    throw new Error("Neplatné vstupné údaje: " + validation.error.issues.map(i => i.message).join(", "));
  }

  const validatedData = validation.data;
  const currentMetadata = profile.metadata || {};

  let newMetadata = { ...currentMetadata };

  // Consents can be edited by both klienti and admins/trainers.
  newMetadata.street = validatedData.street;
  newMetadata.city = validatedData.city;
  newMetadata.zip = validatedData.zip;
  // Fallback string for old logic, optional:
  newMetadata.address = `${validatedData.street}, ${validatedData.zip} ${validatedData.city}`;

  newMetadata.marketingConsent = validatedData.marketingConsent ?? currentMetadata.marketingConsent ?? false;
  newMetadata.metaConsent = validatedData.metaConsent ?? currentMetadata.metaConsent ?? false;
  newMetadata.diagnosticsConsent = validatedData.diagnosticsConsent ?? currentMetadata.diagnosticsConsent ?? false;

  const consentsChanged = 
    newMetadata.marketingConsent !== currentMetadata.marketingConsent ||
    newMetadata.metaConsent !== currentMetadata.metaConsent ||
    newMetadata.diagnosticsConsent !== currentMetadata.diagnosticsConsent;

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({
      phone: validatedData.phone,
      metadata: newMetadata,
    })
    .eq("id", user.id);

  if (updateErr) {
    console.error("Error updating profile:", updateErr);
    throw new Error("Chyba pri ukladaní zmien profilu: " + updateErr.message);
  }

  // If consents changed, generate a new GDPR PDF document
  if (consentsChanged) {
    const fullNameParts = profile.full_name.split(" ");
    const firstName = fullNameParts[0] || "";
    const lastName = fullNameParts.slice(1).join(" ") || "";

    const pdfData: GdprConsentFormData = {
      firstName,
      lastName,
      birthDate: newMetadata.birthDate || "",
      street: newMetadata.street || "",
      city: newMetadata.city || "",
      zip: newMetadata.zip || "",
      email: profile.email || "",
      phone: validatedData.phone || "",
      primaryInterest: newMetadata.serviceInterest || [],
      marketingAccepted: newMetadata.marketingConsent,
      metaAccepted: newMetadata.metaConsent,
      diagAccepted: newMetadata.diagnosticsConsent
    };

    try {
      const pdfBuffer = await generateGdprPdf(pdfData);
      const fileName = `gdpr_${user.id}_${Date.now()}.pdf`;
      const filePath = `${user.id}/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client_documents')
        .upload(filePath, pdfBuffer, { contentType: 'application/pdf' });

      if (uploadError) {
        console.error("Storage upload failed for new PDF:", uploadError);
      } else if (uploadData) {
        // Insert record into documents table
        const { error: docError } = await supabase.from('documents').insert({
          client_id: user.id,
          file_name: `GDPR_Suhlas_Aktualizovany_${lastName}.pdf`,
          storage_path: uploadData.path
        });
        if (docError) {
          console.error("Document insert failed for new PDF:", docError);
        }
      }
    } catch (pdfErr) {
      console.error("Failed to generate updated GDPR PDF:", pdfErr);
      // We don't throw here to avoid failing the profile update, but we log the error.
    }
  }

  revalidatePath("/profil");
}
