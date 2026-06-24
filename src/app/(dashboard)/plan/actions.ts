"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const planExerciseSchema = z.object({
  exerciseId: z.string().uuid("Neplatný identifikátor cviku."),
  targetSets: z.number().int().min(1, "Počet sérií musí byť aspoň 1.").default(3),
  targetReps: z.string().min(1, "Počet opakovaní je povinný.").default("10-12"),
  targetDuration: z.number().int().nullable().default(null),
  targetRestSeconds: z.number().int().nonnegative().default(60),
  tempo: z.string().default("2-0-2-0"),
  rpe: z.string().default("80%"),
  restBetweenExercises: z.number().int().nonnegative().default(0),
  notes: z.string().optional().default(""),
});

const planSchema = z.object({
  title: z.string().min(2, "Názov plánu musí mať aspoň 2 znaky.").max(100),
  description: z.string().max(1000).optional().default(""),
  warmupNotes: z.string().max(1000).optional().default(""),
  clientId: z.string().uuid("Neplatný identifikátor klienta."),
  exercises: z.array(planExerciseSchema).min(1, "Plán musí obsahovať aspoň jeden cvik."),
});

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

async function checkPlanPermission(supabase: any, planId: string, userId: string, role: string) {
  if (["admin", "majitel"].includes(role)) {
    return true;
  }

  const { data: plan } = await supabase
    .from("training_plans")
    .select("creator_id")
    .eq("id", planId)
    .single();

  if (!plan) {
    throw new Error("Tréningový plán nebol nájdený.");
  }

  if (plan.creator_id !== userId) {
    throw new Error("Nemáte oprávnenie na úpravu tohto plánu. Úpravy môže vykonať len tvorca plánu alebo administrátor.");
  }

  return true;
}

export async function createPlanAction(data: {
  title: string;
  description: string;
  warmupNotes: string;
  clientId: string;
  exercises: any[];
}) {
  const supabase = await createClient();
  const { userId, role } = await getUserIdAndRole(supabase);

  if (role === "klient") {
    throw new Error("Klienti nemôžu vytvárať tréningové plány.");
  }

  const validation = planSchema.safeParse(data);
  if (!validation.success) {
    throw new Error("Neplatné vstupné údaje: " + validation.error.issues.map(i => i.message).join(", "));
  }

  const { title, description, warmupNotes, clientId, exercises } = validation.data;

  // 1. Uložiť hlavičku plánu
  const { data: plan, error: planError } = await supabase
    .from("training_plans")
    .insert({
      client_id: clientId,
      creator_id: userId,
      title,
      description,
      warmup_notes: warmupNotes,
      is_active: true,
    })
    .select("id")
    .single();

  if (planError || !plan) {
    console.error("Error creating plan header:", planError);
    throw new Error("Chyba pri ukladaní hlavičky plánu: " + planError?.message);
  }

  // 2. Uložiť priradené cviky
  const exercisesToInsert = exercises.map((pe, index) => ({
    plan_id: plan.id,
    exercise_id: pe.exerciseId,
    order_index: index + 1,
    target_sets: pe.targetSets,
    target_reps: pe.targetReps,
    target_duration: pe.targetDuration,
    target_rest_seconds: pe.targetRestSeconds,
    tempo: pe.tempo,
    rpe: pe.rpe,
    rest_between_exercises: pe.restBetweenExercises,
    notes: pe.notes,
  }));

  const { error: exError } = await supabase
    .from("plan_exercises")
    .insert(exercisesToInsert);

  if (exError) {
    console.error("Error inserting plan exercises:", exError);
    throw new Error("Plán bol vytvorený, ale nepodarilo sa priradiť cviky: " + exError.message);
  }

  revalidatePath("/plan");
}

export async function updatePlanAction(
  planId: string,
  data: {
    title: string;
    description: string;
    warmupNotes: string;
    clientId: string;
    exercises: any[];
  }
) {
  const supabase = await createClient();
  const { userId, role } = await getUserIdAndRole(supabase);

  // Overiť práva
  await checkPlanPermission(supabase, planId, userId, role);

  const validation = planSchema.safeParse(data);
  if (!validation.success) {
    throw new Error("Neplatné vstupné údaje: " + validation.error.issues.map(i => i.message).join(", "));
  }

  const { title, description, warmupNotes, clientId, exercises } = validation.data;

  // 1. Aktualizovať hlavičku plánu
  const { error: planError } = await supabase
    .from("training_plans")
    .update({
      client_id: clientId,
      title,
      description,
      warmup_notes: warmupNotes,
    })
    .eq("id", planId);

  if (planError) {
    console.error("Error updating plan header:", planError);
    throw new Error("Chyba pri ukladaní zmien plánu: " + planError.message);
  }

  // 2. Zmazať staré priradenia cvikov
  const { error: deleteError } = await supabase
    .from("plan_exercises")
    .delete()
    .eq("plan_id", planId);

  if (deleteError) {
    console.error("Error deleting old plan exercises:", deleteError);
  }

  // 3. Uložiť nové priradenia
  const exercisesToInsert = exercises.map((pe, index) => ({
    plan_id: planId,
    exercise_id: pe.exerciseId,
    order_index: index + 1,
    target_sets: pe.targetSets,
    target_reps: pe.targetReps,
    target_duration: pe.targetDuration,
    target_rest_seconds: pe.targetRestSeconds,
    tempo: pe.tempo,
    rpe: pe.rpe,
    rest_between_exercises: pe.restBetweenExercises,
    notes: pe.notes,
  }));

  const { error: exError } = await supabase
    .from("plan_exercises")
    .insert(exercisesToInsert);

  if (exError) {
    console.error("Error updating plan exercises:", exError);
    throw new Error("Hlavička plánu bola zmenená, ale nepodarilo sa aktualizovať cviky: " + exError.message);
  }

  revalidatePath("/plan");
  revalidatePath(`/plan/${planId}`);
}

export async function deletePlanAction(planId: string) {
  const supabase = await createClient();
  const { userId, role } = await getUserIdAndRole(supabase);

  // Overiť práva
  await checkPlanPermission(supabase, planId, userId, role);

  const { error } = await supabase
    .from("training_plans")
    .delete()
    .eq("id", planId);

  if (error) {
    console.error("Error deleting plan:", error);
    throw new Error("Chyba pri mazaní tréningového plánu: " + error.message);
  }

  revalidatePath("/plan");
}

export async function createQuickExerciseAction(name: string) {
  const supabase = await createClient();
  const { userId, role } = await getUserIdAndRole(supabase);

  if (role === "klient") {
    throw new Error("Klienti nemôžu vytvárať cviky.");
  }

  if (!name || !name.trim()) {
    throw new Error("Názov cviku je povinný.");
  }

  const { data: newEx, error } = await supabase
    .from("exercises")
    .insert({
      name: name.trim(),
      category: "Vlastné",
      equipment: "Vlastná váha",
      primary_muscles: [],
      is_custom: true,
      difficulty_level: "intermediate",
      created_by: userId,
    })
    .select("*")
    .single();

  if (error || !newEx) {
    console.error("Error creating quick exercise:", error);
    throw new Error("Chyba pri rýchlom vytváraní cviku: " + error.message);
  }

  revalidatePath("/cviky");
  return newEx;
}
