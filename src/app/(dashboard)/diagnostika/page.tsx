import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DiagnosticsOverview from "./components/DiagnosticsOverview";

interface PageProps {
  searchParams: Promise<{ clientId?: string }>;
}

export default async function DiagnostikaPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const urlClientId = resolvedParams.clientId || null;

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
  const canRead = perms.diagnostika?.read === true || ["admin", "majitel", "recepcia"].includes(role);

  if (!canRead || role === "klient") {
    redirect("/dashboard");
  }

  // Načítanie aktívnych šablón formulárov (ak existuje stĺpec is_active, inak všetky)
  // Použijeme query bez filtra pre prípad, že stĺpec neexistuje, alebo s filtrom ak existuje.
  // Podľa pôvodného kódu je tam filter: .eq('is_active', true)
  const { data: templates, error: tplError } = await supabase
    .from("form_templates")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (tplError) {
    console.error("Chyba pri sťahovaní šablón:", tplError);
  }

  // Načítanie klientov (RLS automaticky vyfiltruje priradených pre trénerov)
  const { data: clients, error: clError } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, gdpr_signed_at")
    .eq("role", "klient")
    .order("full_name", { ascending: true });

  if (clError) {
    console.error("Chyba pri sťahovaní klientov:", clError);
  }

  return (
    <DiagnosticsOverview
      initialTemplates={templates || []}
      initialClients={clients || []}
      role={role}
      urlClientId={urlClientId}
    />
  );
}
