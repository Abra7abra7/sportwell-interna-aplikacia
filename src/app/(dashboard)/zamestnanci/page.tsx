import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import EmployeeList from "./components/EmployeeList";

export default async function ZamestnanciPage() {
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
    return (
      <div className="flex justify-center py-20">
        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl font-medium border border-red-100">
          Nemáte prístup do tejto sekcie. Iba Administrátor a Majiteľ môžu spravovať zamestnancov.
        </div>
      </div>
    );
  }

  // Načítanie aktívnych zamestnancov
  const { data: activeEmployees, error: activeErr } = await supabase
    .from("profiles")
    .select("*")
    .neq("role", "klient")
    .order("full_name");

  if (activeErr) {
    console.error("Error fetching active employees:", activeErr);
  }

  // Načítanie čakajúcich pozvánok
  const { data: pendingInvites, error: pendingErr } = await supabase
    .from("employee_invitations")
    .select("*")
    .order("created_at", { ascending: false });

  if (pendingErr) {
    console.error("Error fetching pending employee invites:", pendingErr);
  }

  return (
    <EmployeeList
      initialEmployees={activeEmployees || []}
      initialPending={pendingInvites || []}
      currentUserProfile={currentUserProfile}
    />
  );
}
