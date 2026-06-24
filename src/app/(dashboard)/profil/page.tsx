import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ProfileOverview from "./components/ProfileOverview";

export default async function ProfilPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Získanie profilu aktuálne prihláseného používateľa
  const { data: currentUserProfile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !currentUserProfile) {
    redirect("/login");
  }

  return <ProfileOverview profile={currentUserProfile} />;
}
