"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deletePlanAction } from "../actions";

interface PlanExercise {
  id: string;
  order_index: number;
  target_sets: number;
  target_reps: string;
  target_rest_seconds: number;
  tempo: string;
  rpe: string;
  rest_between_exercises: number;
  notes: string;
  exercise: {
    name: string;
    category: string;
    equipment: string;
    image_url?: string | null;
    gif_url?: string | null;
  };
}

interface Plan {
  id: string;
  title: string;
  description: string;
  warmup_notes: string;
  created_at: string;
  client: { full_name: string };
  creator: { full_name: string };
  plan_exercises: PlanExercise[];
}

interface PlanDetailsProps {
  plan: Plan;
  role: string;
}

export default function PlanDetails({ plan, role }: PlanDetailsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Naozaj chcete vymazať tento tréningový plán? Táto akcia je nevratná.")) return;
    setIsDeleting(true);

    try {
      await deletePlanAction(plan.id);
      router.push("/plan");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Chyba pri mazaní tréningového plánu.");
    } finally {
      setIsDeleting(false);
    }
  };

  const canEdit = role === "admin" || role === "trener" || role === "majitel";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-20">
      
      {/* Top Navigation & Controls */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => router.push("/plan")}
          className="text-gray-500 hover:text-brand-navy flex items-center gap-2 font-bold min-h-[44px]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Späť
        </button>
        {canEdit && (
          <div className="flex gap-3">
            <Link
              href={`/plan/edit/${plan.id}`}
              className="px-5 py-2.5 bg-brand-light-cyan hover:bg-brand-cyan text-brand-navy font-bold rounded-xl transition-colors text-sm min-h-[44px] flex items-center"
            >
              Upraviť
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors text-sm min-h-[44px]"
            >
              {isDeleting ? "Mažem..." : "Vymazať"}
            </button>
          </div>
        )}
      </div>

      {/* Plan Header Info */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold text-brand-navy mb-2">{plan.title}</h1>
            {plan.description && <p className="text-gray-500 text-lg mb-6 leading-relaxed">{plan.description}</p>}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-y border-gray-50 py-4 mb-4">
            <div>
              <p className="text-xs text-gray-400 font-medium">Klient</p>
              <p className="font-bold text-brand-navy mt-0.5">{plan.client.full_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Tvorca</p>
              <p className="font-semibold text-gray-700 mt-0.5">{plan.creator.full_name}</p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="text-xs text-gray-400 font-medium">Dátum vytvorenia</p>
              <p className="text-gray-700 mt-0.5 text-sm">
                {new Date(plan.created_at).toLocaleDateString("sk-SK")}
              </p>
            </div>
          </div>

          {plan.warmup_notes && (
            <div className="bg-brand-light-cyan/20 p-5 rounded-2xl border border-brand-cyan/20">
              <h3 className="text-sm font-bold text-brand-cyan uppercase tracking-wider mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"></path></svg>
                Rozcvička / Warmup inštrukcie
              </h3>
              <p className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">{plan.warmup_notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Exercises Section */}
      <h2 className="text-2xl font-black text-brand-navy mb-6">Zoznam cvičení ({plan.plan_exercises.length})</h2>
      
      <div className="space-y-6">
        {plan.plan_exercises.map((pe, idx) => (
          <div key={pe.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
            
            {/* Exercise preview */}
            <div className="w-full md:w-48 h-36 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden relative">
              {pe.exercise.image_url || pe.exercise.gif_url ? (
                <img
                  src={pe.exercise.image_url || pe.exercise.gif_url || undefined}
                  alt={pe.exercise.name}
                  className="object-cover w-full h-full mix-blend-multiply"
                />
              ) : (
                <span className="text-xs text-gray-400">Bez náhľadu</span>
              )}
              <div className="absolute top-2 left-2 bg-brand-dark-navy text-brand-cyan text-[10px] font-bold px-2 py-0.5 rounded">
                #{idx + 1}
              </div>
            </div>

            {/* Exercise details parameters */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-brand-navy mb-1 leading-snug">{pe.exercise.name}</h3>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-navy/60">
                  {pe.exercise.category} · {pe.exercise.equipment || "Vlastná váha"}
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Série</span>
                    <p className="font-extrabold text-brand-navy text-sm mt-0.5">{pe.target_sets}x</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Opakovania</span>
                    <p className="font-extrabold text-brand-navy text-sm mt-0.5">{pe.target_reps}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tempo / RPE</span>
                    <p className="font-bold text-gray-700 text-xs mt-0.5">{pe.tempo} / {pe.rpe}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pauza</span>
                    <p className="font-bold text-brand-cyan text-sm mt-0.5">{pe.target_rest_seconds}s</p>
                  </div>
                </div>

                {pe.notes && (
                  <div className="mt-4 bg-yellow-50/40 border border-yellow-100/50 p-3.5 rounded-xl">
                    <span className="text-[9px] font-extrabold text-yellow-700 uppercase tracking-wider">Poznámky k cviku:</span>
                    <p className="text-gray-700 text-xs mt-0.5 leading-relaxed">{pe.notes}</p>
                  </div>
                )}
              </div>

              {pe.rest_between_exercises > 0 && (
                <div className="mt-4 bg-brand-light-cyan/30 text-brand-dark-navy text-xs font-bold px-4 py-2.5 rounded-xl border border-brand-cyan/20 flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Extra pauza po tomto cviku: {pe.rest_between_exercises} sekúnd
                </div>
              )}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
