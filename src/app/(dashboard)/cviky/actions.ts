"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const exerciseSchema = z.object({
  name: z.string().min(2, "Názov cviku musí mať aspoň 2 znaky.").max(100),
  category: z.string().min(1, "Kategória je povinná."),
  equipment: z.string().max(50).optional().or(z.literal("")),
  primary_muscles: z.array(z.string()).default([]),
  description: z.string().max(1000).optional().or(z.literal("")),
  image_url: z.string().url("Neplatná URL adresa obrázka.").optional().or(z.literal("")),
  video_url: z.string().url("Neplatná URL adresa videa.").optional().or(z.literal("")),
});

// Helper na overenie prihláseného používateľa
async function getUserIdAndRole(supabase: any) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Neautorizovaný prístup. Prihláste sa prosím.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return { userId: user.id, role: profile?.role || "klient" };
}

// Overenie, či má používateľ právo upraviť/zmazať konkrétny cvik
async function checkExercisePermission(supabase: any, exerciseId: string, userId: string, role: string) {
  if (["admin", "majitel"].includes(role)) {
    return true; // Admin a majiteľ môžu všetko
  }

  const { data: exercise } = await supabase
    .from("exercises")
    .select("created_by, is_custom")
    .eq("id", exerciseId)
    .single();

  if (!exercise) {
    throw new Error("Cvik nebol nájdený.");
  }

  if (!exercise.is_custom) {
    throw new Error("Globálne (preddefinované) cviky nie je možné upravovať ani mazať.");
  }

  if (exercise.created_by !== userId) {
    throw new Error("Nemáte oprávnenie na úpravu tohto cviku. Upravovať môžete len vlastné cviky.");
  }

  return true;
}

export async function createExerciseAction(data: {
  name: string;
  category: string;
  equipment: string;
  primary_muscles: string[];
  description: string;
  image_url: string;
  video_url: string;
}) {
  const supabase = await createClient();
  const { userId } = await getUserIdAndRole(supabase);

  const validation = exerciseSchema.safeParse(data);
  if (!validation.success) {
    throw new Error("Neplatné vstupné údaje: " + validation.error.issues.map(i => i.message).join(", "));
  }

  const { name, category, equipment, primary_muscles, description, image_url, video_url } = validation.data;

  const { error } = await supabase.from("exercises").insert({
    name,
    category,
    equipment: equipment || "body weight",
    primary_muscles,
    description: description || "",
    image_url: image_url || null,
    video_url: video_url || null,
    is_custom: true,
    difficulty_level: "intermediate",
    created_by: userId,
  });

  if (error) {
    console.error("Error creating exercise:", error);
    throw new Error("Chyba pri ukladaní cviku: " + error.message);
  }

  revalidatePath("/cviky");
}

export async function updateExerciseAction(
  exerciseId: string,
  data: {
    name: string;
    category: string;
    equipment: string;
    primary_muscles: string[];
    description: string;
    image_url: string;
    video_url: string;
  }
) {
  const supabase = await createClient();
  const { userId, role } = await getUserIdAndRole(supabase);

  // Overenie prístupových práv
  await checkExercisePermission(supabase, exerciseId, userId, role);

  const validation = exerciseSchema.safeParse(data);
  if (!validation.success) {
    throw new Error("Neplatné vstupné údaje: " + validation.error.issues.map(i => i.message).join(", "));
  }

  const { name, category, equipment, primary_muscles, description, image_url, video_url } = validation.data;

  const { error } = await supabase
    .from("exercises")
    .update({
      name,
      category,
      equipment: equipment || "body weight",
      primary_muscles,
      description: description || "",
      image_url: image_url || null,
      video_url: video_url || null,
    })
    .eq("id", exerciseId);

  if (error) {
    console.error("Error updating exercise:", error);
    throw new Error("Chyba pri úprave cviku: " + error.message);
  }

  revalidatePath("/cviky");
}

export async function deleteExerciseAction(exerciseId: string) {
  const supabase = await createClient();
  const { userId, role } = await getUserIdAndRole(supabase);

  // Overenie prístupových práv
  await checkExercisePermission(supabase, exerciseId, userId, role);

  const { error } = await supabase
    .from("exercises")
    .delete()
    .eq("id", exerciseId);

  if (error) {
    console.error("Error deleting exercise:", error);
    throw new Error("Chyba pri mazaní cviku: " + error.message);
  }

  revalidatePath("/cviky");
}
