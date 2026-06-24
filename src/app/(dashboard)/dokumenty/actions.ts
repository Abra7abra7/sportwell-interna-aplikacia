"use server";

import { createClient } from "@/utils/supabase/server";

export async function getSignedDocumentUrlAction(path: string) {
  if (!path) {
    throw new Error("Cesta k súboru je povinná.");
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Neautorizovaný prístup. Prihláste sa prosím.");
  }

  const { data, error } = await supabase.storage
    .from("client_documents")
    .createSignedUrl(path, 60);

  if (error || !data) {
    console.error("Error creating signed URL:", error);
    throw new Error("Nepodarilo sa vygenerovať odkaz na stiahnutie: " + (error?.message || "neznáma chyba"));
  }

  return data.signedUrl;
}
