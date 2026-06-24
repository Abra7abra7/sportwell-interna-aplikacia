import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import TemplatesList from "./components/TemplatesList";

export default async function SablonyPage() {
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
  const canRead = perms.sablony?.read === true || ["admin", "majitel"].includes(role);

  if (!canRead || role === "klient") {
    redirect("/dashboard");
  }

  // Načítanie šablón zoradených podľa názvu
  const { data: templates, error } = await supabase
    .from("form_templates")
    .select("*")
    .order("title", { ascending: true });

  if (error) {
    console.error("Chyba pri sťahovaní šablón:", error);
  }

  return (
    <TemplatesList
      initialTemplates={templates || []}
      role={role}
    />
  );
}
