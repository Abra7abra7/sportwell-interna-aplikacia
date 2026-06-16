"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

interface TrainingPlan {
  id: string;
  title: string;
  description: string;
  created_at: string;
  is_active: boolean;
  client: { full_name: string };
  creator: { full_name: string };
  _count: { exercises: number };
}

export default function PlansPage() {
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      const { data: userData } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user?.id)
        .single();
        
      setRole(profile?.role || "klient");

      // Fetch plans along with client and creator names.
      // Also get a count of exercises. Supabase allows counting like this.
      const { data, error } = await supabase
        .from("training_plans")
        .select(`
          id, title, description, created_at, is_active,
          client:client_id(full_name),
          creator:creator_id(full_name),
          plan_exercises(count)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Chyba pri sťahovaní plánov:", error);
      } else {
        const formattedData = data?.map((p: any) => ({
          ...p,
          client: p.client || { full_name: "Neznámy" },
          creator: p.creator || { full_name: "Neznámy" },
          _count: { exercises: p.plan_exercises[0]?.count || 0 }
        })) as TrainingPlan[];
        setPlans(formattedData);
      }
      
      setLoading(false);
    }
    
    fetchData();
  }, [supabase]);

  const canCreate = role !== "klient";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">Tréningové Plány</h1>
          <p className="text-gray-500 mt-1">
            {role === "klient" ? "Tvoje aktuálne priradené cvičenia" : "Správa tréningových plánov klientov"}
          </p>
        </div>
        
        {canCreate && (
          <Link 
            href="/plan/create"
            className="bg-brand-cyan text-brand-dark-navy px-4 py-2 rounded-lg font-bold shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
          >
            + Vytvoriť nový plán
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-cyan"></div>
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl text-center shadow-sm border border-gray-100">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
          <h3 className="text-xl font-bold text-brand-navy mb-2">Žiadne plány</h3>
          <p className="text-gray-500">
            {role === "klient" 
              ? "Zatiaľ ti nebol priradený žiadny tréningový plán." 
              : "Ešte si nevytvoril žiadny plán pre klientov."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Link href={`/plan/${plan.id}`} key={plan.id} className="block group">
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1 border border-gray-100 h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-xl text-brand-navy group-hover:text-brand-cyan transition-colors line-clamp-2">
                    {plan.title}
                  </h3>
                  {plan.is_active ? (
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider shrink-0 ml-2">Aktívny</span>
                  ) : (
                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider shrink-0 ml-2">Neaktívny</span>
                  )}
                </div>
                
                {plan.description && (
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{plan.description}</p>
                )}

                <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Klient:</span>
                    <span className="font-semibold text-brand-navy">{plan.client.full_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tréner:</span>
                    <span className="font-medium text-gray-700">{plan.creator.full_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Cvikov:</span>
                    <span className="font-bold text-brand-cyan">{plan._count.exercises}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
