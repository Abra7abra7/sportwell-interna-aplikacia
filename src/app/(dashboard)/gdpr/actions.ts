"use server";

import { createClient } from "@/utils/supabase/server";
import { gdprConsentSchema, GdprConsentFormData } from "@/components/gdpr/schema";
import { generateGdprPdf } from "@/utils/pdf/generateGdprPdf";
import { revalidatePath } from "next/cache";

export async function submitGdprConsent(formData: GdprConsentFormData) {
  const supabase = await createClient();

  // 1. Overenie identity používateľa na serveri
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Neautorizovaný prístup");
  }

  // 2. Bezpečná server-side validácia údajov
  const validatedData = gdprConsentSchema.parse(formData);

  // 3. Generovanie PDF na serveri (žiadny html2canvas v prehliadači)
  const pdfBuffer = await generateGdprPdf(validatedData);
  const fileName = `gdpr_${user.id}_${Date.now()}.pdf`;

  // 4. Bezpečný upload do privátneho bucketu client_documents
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('client_documents')
    .upload(fileName, pdfBuffer, { contentType: 'application/pdf' });
    
  if (uploadError) {
    console.error("Storage upload failed:", uploadError);
    throw new Error("Chyba pri ukladaní PDF zmluvy v úložisku.");
  }

  // 5. Upsert profilu klienta
  const signedAt = new Date().toISOString();
  
  // Získanie existujúceho profilu pre zachovanie iných metadata hodnôt
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('metadata')
    .eq('id', user.id)
    .single();

  const newMetadata = {
    ...(existingProfile?.metadata || {}),
    address: validatedData.address,
    birthDate: validatedData.birthDate,
    serviceInterest: validatedData.primaryInterest,
    marketingConsent: validatedData.marketingAccepted,
    metaConsent: validatedData.metaAccepted,
    diagnosticsConsent: validatedData.diagAccepted
  };

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      role: 'klient',
      email: user.email,
      full_name: `${validatedData.firstName} ${validatedData.lastName}`.trim(),
      phone: validatedData.phone,
      gdpr_signed_at: signedAt,
      metadata: newMetadata
    });

  if (profileError) {
    console.error("Profile update failed:", profileError);
    throw new Error("Chyba pri aktualizácii profilu v databáze.");
  }

  // 6. Pridanie záznamu do tabuľky documents
  if (uploadData) {
    const { error: docError } = await supabase.from('documents').insert({
      client_id: user.id,
      file_name: `GDPR_Suhlas_${validatedData.lastName}.pdf`,
      storage_path: uploadData.path
    });
    
    if (docError) {
      console.error("Document insert failed:", docError);
    }
  }

  // 7. Vymazanie pozvánky z čakárne
  if (user.email) {
     await supabase.from('client_invitations').delete().eq('email', user.email);
  }

  // 8. Revalidácia dashboard cache
  revalidatePath('/dashboard');
}
