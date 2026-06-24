"use client";

import React, { useState } from "react";
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

interface PlanListProps {
  initialPlans: TrainingPlan[];
  role: string;
}

export default function PlanList({ initialPlans, role }: PlanListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const canCreate = role !== "klient";

  const filteredPlans = initialPlans.filter((plan) => {
    const query = searchQuery.toLowerCase();
    return (
      plan.title.toLowerCase().includes(query) ||
      (plan.description && plan.description.toLowerCase().includes(query)) ||
      plan.client.full_name.toLowerCase().includes(query) ||
      plan.creator.full_name.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Heading Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-gray-100/50">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">Tréningové Plány</h1>
          <p className="text-gray-500 mt-1 font-medium">
            {role === "klient" ? "Tvoje aktuálne priradené cvičenia" : "Správa tréningových plánov klientov"}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/plan/create"
            className="mt-4 md:mt-0 bg-brand-cyan hover:bg-brand-cyan/90 hover:-translate-y-0.5 text-brand-dark-navy px-5 py-2.5 rounded-xl font-bold shadow-[0_4px_14px_0_rgba(0,240,255,0.39)] transition-all duration-200 whitespace-nowrap min-h-[44px] flex items-center justify-center text-sm gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Vytvoriť nový plán
          </Link>
        )}
      </div>

      {/* Search Filter */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400 group-focus-within:text-brand-cyan transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
        <input
          type="text"
          placeholder="Vyhľadaj plán podľa názvu, klienta alebo trénera..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 shadow-sm focus:ring-2 focus:ring-brand-cyan transition-shadow bg-white text-brand-navy placeholder-gray-400 text-sm"
        />
      </div>

      {/* Grid List */}
      {filteredPlans.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl text-center shadow-sm border border-gray-100">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-25 text-brand-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
          <h3 className="text-xl font-bold text-brand-navy mb-2">Žiadne tréningové plány</h3>
          <p className="text-gray-500">
            {role === "klient"
              ? "Zatiaľ ti nebol priradený žiadny tréningový plán."
              : "Nenašli sa žiadne plány podľa vašich kritérií."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <Link href={`/plan/${plan.id}`} key={plan.id} className="block group min-h-[44px]">
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-brand-light-cyan transition-all duration-300 transform group-hover:-translate-y-1 border border-gray-100 h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <h3 className="font-bold text-xl text-brand-navy group-hover:text-brand-cyan transition-colors line-clamp-2 leading-snug">
                      {plan.title}
                    </h3>
                    {plan.is_active ? (
                      <span className="bg-green-50 text-green-700 border border-green-100 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                        Aktívny
                      </span>
                    ) : (
                      <span className="bg-gray-50 text-gray-600 border border-gray-100 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                        Neaktívny
                      </span>
                    )}
                  </div>

                  {plan.description && (
                    <p className="text-gray-500 text-sm mb-6 line-clamp-2 leading-relaxed">
                      {plan.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-50 space-y-2 mt-auto">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-medium">Klient:</span>
                    <span className="font-bold text-brand-navy">{plan.client.full_name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-medium">Tréner:</span>
                    <span className="font-semibold text-gray-700">{plan.creator.full_name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-medium">Cvikov:</span>
                    <span className="font-extrabold text-brand-cyan">{plan._count.exercises}</span>
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
