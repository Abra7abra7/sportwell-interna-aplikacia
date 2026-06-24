import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import SettingsOverview from "./components/SettingsOverview";

export default async function SettingsPage() {
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

  if (!currentUserProfile || !["admin", "majitel"].includes(currentUserProfile.role)) {
    redirect("/dashboard");
  }

  // Načítanie modulov z databázy
  const { data: modules, error: modError } = await supabase
    .from("modules")
    .select("*")
    .order("name");

  if (modError) {
    console.error("Error loading modules:", modError);
  }

  // Načítanie existujúcich oprávnení z databázy
  const { data: permissions, error: permError } = await supabase
    .from("role_permissions")
    .select("*");

  if (permError) {
    console.error("Error loading role permissions:", permError);
  }

  return (
    <SettingsOverview
      initialModules={modules || []}
      initialPermissions={permissions || []}
    />
  );
}
