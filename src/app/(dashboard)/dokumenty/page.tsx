import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DocumentList from "./components/DocumentList";

export default async function DokumentyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Získanie profilu aktuálne prihláseného používateľa
  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!currentUserProfile) {
    redirect("/login");
  }

  // Overenie prístupových práv (RBAC)
  const role = currentUserProfile.role;
  const perms = currentUserProfile.permissions || {};
  const canRead = perms.dokumenty?.read === true || ["admin", "majitel", "recepcia", "klient", "trener", "fyzioterapeut"].includes(role);

  if (!canRead) {
    redirect("/dashboard");
  }

  // Načítanie dokumentov z databázy
  let query = supabase
    .from("documents")
    .select("*, profiles:client_id(full_name)")
    .order("created_at", { ascending: false });

  // Ak je to klient, vidí len svoje vlastné dokumenty
  if (role === "klient") {
    query = query.eq("client_id", user.id);
  }

  const { data: documents, error } = await query;

  if (error) {
    console.error("Chyba pri načítavaní dokumentov:", error);
  }

  return (
    <DocumentList
      initialDocuments={documents || []}
      role={role}
    />
  );
}
