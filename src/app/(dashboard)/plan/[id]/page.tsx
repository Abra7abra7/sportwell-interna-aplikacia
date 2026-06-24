import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import PlanDetails from "../components/PlanDetails";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlanDetailsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Získanie profilu prihláseného používateľa
  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!currentUserProfile) {
    redirect("/login");
  }

  // Načítanie detailu plánu
  const { data: plan, error } = await supabase
    .from("training_plans")
    .select(`
      id, title, description, warmup_notes, created_at, client_id,
      client:client_id(full_name),
      creator:creator_id(full_name),
      plan_exercises (
        id, order_index, target_sets, target_reps, target_rest_seconds, tempo, rpe, rest_between_exercises, notes,
        exercise:exercise_id (
          name, category, equipment, image_url, gif_url
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error || !plan) {
    return (
      <div className="bg-white p-10 rounded-2xl text-center shadow-sm max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-brand-navy">Plán sa nenašiel</h2>
        <p className="text-gray-500 mt-2">Požadovaný tréningový plán neexistuje.</p>
      </div>
    );
  }

  // Ak je to klient, overiť či si pozerá vlastný plán
  if (currentUserProfile.role === "klient" && plan.client_id !== user.id) {
    return (
      <div className="flex justify-center py-20">
        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl font-medium border border-red-100">
          Nemáte prístup k tomuto tréningovému plánu.
        </div>
      </div>
    );
  }

  // Zoradenie cvikov podľa order_index
  if (plan.plan_exercises) {
    plan.plan_exercises.sort((a: any, b: any) => a.order_index - b.order_index);
  }

  return (
    <PlanDetails
      plan={plan as any}
      role={currentUserProfile.role}
    />
  );
}
