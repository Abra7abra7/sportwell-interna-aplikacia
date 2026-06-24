import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardOverview from "./components/DashboardOverview";

export default async function DashboardPage() {
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

  const isClient = currentUserProfile.role === "klient";
  let templates: any[] = [];
  let clients: any[] = [];

  // Načítanie dát pre trénerov/adminov
  if (!isClient) {
    const { data: templatesData } = await supabase
      .from("form_templates")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (templatesData) {
      templates = templatesData;
    }

    const { data: clientsData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "klient")
      .order("full_name", { ascending: true });

    if (clientsData) {
      clients = clientsData;
    }
  }

  return (
    <DashboardOverview
      initialTemplates={templates}
      initialClients={clients}
      profile={{
        role: currentUserProfile.role,
        full_name: currentUserProfile.full_name,
      }}
    />
  );
}
