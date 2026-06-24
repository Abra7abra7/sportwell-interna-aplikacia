import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ExerciseList from "./components/ExerciseList";

export default async function CvikyPage() {
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

  // Ak je to klient, nemá prístup do databázy cvikov (len do svojich aktívnych plánov)
  if (currentUserProfile?.role === "klient") {
    return (
      <div className="flex justify-center py-20">
        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl font-medium border border-red-100">
          Nemáte prístup do tejto sekcie.
        </div>
      </div>
    );
  }

  // Načítanie všetkých cvikov zo Supabase (limit 2000)
  const { data: exercises, error } = await supabase
    .from("exercises")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    console.error("Error fetching exercises:", error);
  }

  return (
    <ExerciseList
      initialExercises={exercises || []}
      currentUserProfile={currentUserProfile}
    />
  );
}
