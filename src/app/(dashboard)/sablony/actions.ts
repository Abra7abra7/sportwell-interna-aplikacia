"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const formFieldSchema = z.object({
  id: z.string().min(1, "Identifikátor poľa je povinný."),
  type: z.enum(["text", "textarea", "select", "radio", "checkbox_group", "file_upload"]),
  label: z.string().min(2, "Znenie otázky musí mať aspoň 2 znaky.").max(200),
  placeholder: z.string().max(200).optional().nullable(),
  required: z.boolean(),
  options: z.array(z.string().min(1, "Názov možnosti nemôže byť prázdny.")).optional().nullable(),
});

const formTemplateSchema = z.object({
  title: z.string().min(2, "Názov šablóny musí mať aspoň 2 znaky.").max(100),
  category: z.string().min(2, "Kategória musí mať aspoň 2 znaky.").max(100),
  schema: z.object({
    fields: z.array(formFieldSchema),
  }),
});

export type FormField = z.infer<typeof formFieldSchema>;

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

async function checkSablonyPermission(supabase: any) {
  const { role, permissions } = await getUserIdAndRole(supabase);
  
  if (role === "klient") {
    throw new Error("Klienti nemajú prístup k šablónam.");
  }

  const hasAccess = ["admin", "majitel"].includes(role) || permissions.sablony?.write === true;
  if (!hasAccess) {
    throw new Error("Nemáte oprávnenie na úpravu alebo správu šablón.");
  }

  return { role };
}

export async function createTemplateAction() {
  const supabase = await createClient();
  await checkSablonyPermission(supabase);

  const newTemplate = {
    title: 'Nová šablóna',
    category: 'Všeobecné',
    schema: { fields: [] }
  };

  const { data, error } = await supabase
    .from('form_templates')
    .insert(newTemplate)
    .select()
    .single();

  if (error || !data) {
    console.error("Error creating template:", error);
    throw new Error("Chyba pri vytváraní šablóny: " + error?.message);
  }

  revalidatePath('/sablony');
  return data;
}

export async function deleteTemplateAction(id: string) {
  const supabase = await createClient();
  await checkSablonyPermission(supabase);

  const { data: template, error: fetchError } = await supabase
    .from('form_templates')
    .select('title')
    .eq('id', id)
    .single();

  if (fetchError || !template) {
    throw new Error("Šablóna nebola nájdená.");
  }

  if (template.title === "Základná diagnostika") {
    throw new Error("Základnú diagnostiku nie je možné vymazať.");
  }

  const { error } = await supabase
    .from('form_templates')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error deleting template:", error);
    throw new Error("Chyba pri mazaní šablóny: " + error.message);
  }

  revalidatePath('/sablony');
}

export async function updateTemplateAction(
  id: string,
  payload: {
    title: string;
    category: string;
    schema: { fields: FormField[] };
  }
) {
  const supabase = await createClient();
  await checkSablonyPermission(supabase);

  const validation = formTemplateSchema.safeParse(payload);
  if (!validation.success) {
    throw new Error("Neplatné vstupné údaje: " + validation.error.issues.map(i => i.message).join(", "));
  }

  const { title, category, schema } = validation.data;

  const { error } = await supabase
    .from('form_templates')
    .update({
      title,
      category,
      schema,
    })
    .eq('id', id);

  if (error) {
    console.error("Error updating template:", error);
    throw new Error("Chyba pri ukladaní šablóny: " + error.message);
  }

  revalidatePath('/sablony');
  revalidatePath(`/sablony/${id}`);
}
