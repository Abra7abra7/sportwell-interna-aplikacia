import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import PlanList from "./components/PlanList";

export default async function PlansPage() {
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

  // Načítanie plánov podľa prístupových rolí
  let query = supabase
    .from("training_plans")
    .select(`
      id, title, description, created_at, is_active,
      client:client_id(full_name),
      creator:creator_id(full_name),
      plan_exercises(count)
    `)
    .order("created_at", { ascending: false });

  // Ak je to klient, stiahnuť iba jeho vlastné plány
  if (currentUserProfile.role === "klient") {
    query = query.eq("client_id", user.id);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Chyba pri sťahovaní plánov:", error);
  }

  const formattedPlans = (data || []).map((p: any) => ({
    ...p,
    client: p.client || { full_name: "Neznámy" },
    creator: p.creator || { full_name: "Neznámy" },
    _count: { exercises: p.plan_exercises?.[0]?.count || 0 },
  }));

  return (
    <PlanList
      initialPlans={formattedPlans}
      role={currentUserProfile.role}
    />
  );
}
