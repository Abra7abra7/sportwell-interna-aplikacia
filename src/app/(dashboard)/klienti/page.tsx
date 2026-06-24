import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ClientList from "./components/ClientList";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function KlientiPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const q = resolvedParams.q || "";

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

  if (!currentUserProfile || currentUserProfile.role === "klient") {
    return (
      <div className="flex justify-center py-20">
        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl font-medium border border-red-100">
          Nemáte prístup do tejto sekcie.
        </div>
      </div>
    );
  }

  // Načítanie aktívnych klientov
  let query = supabase
    .from("profiles")
    .select("*")
    .eq("role", "klient")
    .order("full_name", { ascending: true });

  if (q.trim()) {
    query = query.ilike("full_name", `%${q.trim()}%`);
  }

  // Zobrazenie prvých 200 klientov
  query = query.range(0, 199);

  const { data: clientsData, error: fetchErr } = await query;
  let enrichedClients: any[] = [];

  if (fetchErr) {
    console.error("Chyba pri načítavaní klientov:", fetchErr);
  } else if (clientsData && clientsData.length > 0) {
    const clientIds = clientsData.map((c: any) => c.id);

    const [
      { data: assignments },
      { data: trainers },
      { data: plans }
    ] = await Promise.all([
      supabase.from("client_specialist_assignments").select("client_id, specialist_id").in("client_id", clientIds),
      supabase.from("profiles").select("id, full_name").eq("role", "trener"),
      supabase.from("training_plans").select("client_id").in("client_id", clientIds)
    ]);

    const trainerMap = new Map((trainers || []).map((t: any) => [t.id, t.full_name]));

    enrichedClients = clientsData.map((client: any) => {
      const theirAssignments = (assignments || [])
        .filter((a: any) => a.client_id === client.id)
        .map((a: any) => trainerMap.get(a.specialist_id))
        .filter(Boolean) as string[];

      const theirPlansCount = (plans || []).filter((p: any) => p.client_id === client.id).length;

      return {
        ...client,
        assignments: theirAssignments,
        plansCount: theirPlansCount
      };
    });
  }

  // Načítanie čakajúcich pozvánok (čakáreň)
  const { data: pendingClients } = await supabase
    .from("client_invitations")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <ClientList
      initialClients={enrichedClients}
      initialPending={pendingClients || []}
      currentUserProfile={currentUserProfile}
      query={q}
    />
  );
}
