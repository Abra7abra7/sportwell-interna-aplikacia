"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const profileUpdateSchema = z.object({
  phone: z.string().min(9, "Telefónne číslo je príliš krátke.").regex(/^\+?[0-9\s]+$/, "Telefónne číslo má nesprávny formát."),
  address: z.string().min(10, "Adresa je príliš krátka. Zadajte Ulicu, Číslo, PSČ a Mesto."),
  marketingConsent: z.boolean().optional(),
  metaConsent: z.boolean().optional(),
  diagnosticsConsent: z.boolean().optional(),
});

export async function updateProfileAction(data: {
  phone: string;
  address: string;
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

  // Rule: GDPR consents in profile are read-only for clients.
  if (profile.role === "klient") {
    // If the role is client, we ignore consents from request payload and preserve existing consents from DB.
    newMetadata.address = validatedData.address;
    // Consents remain unchanged!
  } else {
    // If the role is trainer/admin, they can edit consents.
    newMetadata.address = validatedData.address;
    newMetadata.marketingConsent = validatedData.marketingConsent ?? currentMetadata.marketingConsent ?? false;
    newMetadata.metaConsent = validatedData.metaConsent ?? currentMetadata.metaConsent ?? false;
    newMetadata.diagnosticsConsent = validatedData.diagnosticsConsent ?? currentMetadata.diagnosticsConsent ?? false;
  }

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

  revalidatePath("/profil");
}
