import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import FormBuilder from "../components/FormBuilder";
import { FormField } from "../actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FormBuilderPage({ params }: PageProps) {
  const { id: templateId } = await params;
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

  // Načítanie konkrétnej šablóny
  const { data: template, error } = await supabase
    .from("form_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (error || !template) {
    console.error("Šablóna nebola nájdená:", error);
    redirect("/sablony");
  }

  // Normalizácia schémy (podpora legacy a nového formátu)
  let loadedFields: FormField[] = [];
  if (template.schema?.fields) {
    loadedFields = template.schema.fields;
  } else if (template.schema?.steps) {
    loadedFields = template.schema.steps.reduce((acc: FormField[], step: any) => {
      return [...acc, ...(step.fields || [])];
    }, []);
  } else if (Array.isArray(template.schema)) {
    loadedFields = template.schema;
  }

  const normalizedTemplate = {
    id: template.id,
    title: template.title || "Bez názvu",
    category: template.category || "Všeobecné",
    schema: {
      fields: loadedFields,
    },
  };

  return <FormBuilder template={normalizedTemplate} />;
}
