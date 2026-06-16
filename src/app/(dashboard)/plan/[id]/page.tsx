"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";

interface PlanDetails {
  id: string;
  title: string;
  description: string;
  created_at: string;
  client: { full_name: string };
  creator: { full_name: string };
  plan_exercises: {
    id: string;
    order_index: number;
    target_sets: number;
    target_reps: string;
    target_rest_seconds: number;
    notes: string;
    exercise: {
      name: string;
      category: string;
      equipment: string;
      image_url: string;
      gif_url: string;
    }
  }[];
}

export default function PlanDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [plan, setPlan] = useState<PlanDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlan() {
      const { data, error } = await supabase
        .from("training_plans")
        .select(`
          id, title, description, created_at,
          client:client_id(full_name),
          creator:creator_id(full_name),
          plan_exercises (
            id, order_index, target_sets, target_reps, target_rest_seconds, notes,
            exercise:exercise_id (
              name, category, equipment, image_url, gif_url
            )
          )
        `)
        .eq("id", params.id)
        .single();

      if (error) {
        console.error("Chyba:", error);
      } else {
        // Zoradiť cviky podľa order_index
        if (data && data.plan_exercises) {
          data.plan_exercises.sort((a: any, b: any) => a.order_index - b.order_index);
        }
        setPlan(data as any);
      }
      setLoading(false);
    }
    fetchPlan();
  }, [supabase, params.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-cyan"></div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="bg-white p-10 rounded-2xl text-center shadow-sm">
        <h2 className="text-2xl font-bold text-brand-navy">Plán sa nenašiel</h2>
        <button onClick={() => router.back()} className="mt-4 text-brand-cyan hover:underline">Späť na zoznam</button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-20">
      <button onClick={() => router.back()} className="mb-6 text-gray-500 hover:text-brand-navy flex items-center gap-2 font-medium">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        Späť
      </button>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-brand-navy mb-2">{plan.title}</h1>
            <p className="text-gray-600 text-lg mb-6">{plan.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 border-t border-gray-100 pt-6">
          <div>
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Klient</span>
            <span className="font-semibold text-brand-navy text-lg">{plan.client.full_name}</span>
          </div>
          <div>
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Zostavil</span>
            <span className="font-medium text-gray-700 text-lg">{plan.creator.full_name}</span>
          </div>
          <div>
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Počet cvikov</span>
            <span className="font-bold text-brand-cyan text-lg">{plan.plan_exercises.length}</span>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-brand-navy mb-6">Zoznam cvičení</h2>

      <div className="space-y-6">
        {plan.plan_exercises.map((pe, index) => (
          <div key={pe.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col sm:flex-row relative">
            <div className="absolute top-0 left-0 bg-brand-cyan text-brand-dark-navy w-10 h-10 flex items-center justify-center font-bold text-lg rounded-br-2xl z-10 shadow-sm">
              {index + 1}
            </div>

            {/* Fotka / GIF - Zobrazený priamo (bez hover pre klienta pre lepšiu odozvu) */}
            <div className="w-full sm:w-48 h-48 bg-gray-100 shrink-0 relative flex items-center justify-center">
              {(pe.exercise.gif_url || pe.exercise.image_url) ? (
                <img 
                  src={pe.exercise.gif_url || pe.exercise.image_url} 
                  alt={pe.exercise.name} 
                  className="w-full h-full object-cover mix-blend-multiply"
                />
              ) : (
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              )}
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-brand-navy mb-1">{pe.exercise.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{pe.exercise.category} • {pe.exercise.equipment || "Vlastná váha"}</p>
              
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="bg-brand-off-white px-4 py-2 rounded-lg border border-gray-100">
                  <span className="block text-[10px] uppercase font-bold text-gray-400">Série</span>
                  <span className="font-bold text-brand-navy text-lg">{pe.target_sets}</span>
                </div>
                <div className="bg-brand-off-white px-4 py-2 rounded-lg border border-gray-100">
                  <span className="block text-[10px] uppercase font-bold text-gray-400">Opakovania</span>
                  <span className="font-bold text-brand-navy text-lg">{pe.target_reps}</span>
                </div>
                <div className="bg-brand-off-white px-4 py-2 rounded-lg border border-gray-100">
                  <span className="block text-[10px] uppercase font-bold text-gray-400">Pauza</span>
                  <span className="font-bold text-brand-navy text-lg">{pe.target_rest_seconds}s</span>
                </div>
              </div>

              {pe.notes && (
                <div className="mt-auto bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm border border-yellow-100">
                  <span className="font-bold mr-2">Poznámka od trénera:</span>
                  {pe.notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
