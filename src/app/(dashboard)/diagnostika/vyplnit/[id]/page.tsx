import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import VyplnitDiagnostikuForm from "../../components/VyplnitDiagnostikuForm";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ clientId?: string }>;
}

export default async function VyplnitDiagnostikuPage({ params, searchParams }: PageProps) {
  const { id: templateId } = await params;
  const resolvedSearchParams = await searchParams;
  const clientId = resolvedSearchParams.clientId;

  if (!templateId || !clientId) {
    redirect("/diagnostika");
  }

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

  // Načítanie šablóny diagnostiky
  const { data: template, error: tplError } = await supabase
    .from("form_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (tplError || !template) {
    console.error("Šablóna nebola nájdená:", tplError);
    redirect("/diagnostika");
  }

  // Načítanie profilu cieľového klienta
  const { data: clientProfile, error: clError } = await supabase
    .from("profiles")
    .select("id, full_name, metadata")
    .eq("id", clientId)
    .single();

  if (clError || !clientProfile) {
    console.error("Klient nebol nájdený:", clError);
    redirect("/diagnostika");
  }

  return (
    <VyplnitDiagnostikuForm
      template={template}
      clientProfile={clientProfile}
    />
  );
}
