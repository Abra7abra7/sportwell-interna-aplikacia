"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface Exercise {
  id: string;
  name: string;
  difficulty_level: string;
  equipment: string;
  primary_muscles: string[];
  category: string;
  is_custom: boolean;
}

export default function CvikyPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function fetchExercises() {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .order("name", { ascending: true })
        .limit(100);

      if (error) {
        console.error("Chyba pri načítavaní cvikov:", error);
      } else {
        setExercises(data || []);
      }
      setLoading(false);
    }

    fetchExercises();
  }, [supabase]);

  const filteredExercises = exercises.filter(ex => 
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">Databáza Cvikov</h1>
          <p className="text-gray-500 mt-1">Prehľad všetkých dostupných cvičení v systéme</p>
        </div>
        <button className="bg-brand-cyan text-brand-dark-navy px-4 py-2 rounded-lg font-bold shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200">
          + Pridať vlastný cvik
        </button>
      </div>

      <div className="mb-6 relative">
        <input 
          type="text" 
          placeholder="Vyhľadaj cvik podľa názvu alebo kategórie..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-1/2 px-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-brand-cyan transition-shadow bg-white text-brand-navy placeholder-gray-400"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-cyan"></div>
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl text-center shadow-sm">
          <p className="text-gray-500 text-lg">Nenašli sa žiadne cviky zodpovedajúce vyhľadávaniu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredExercises.map((ex) => (
            <div 
              key={ex.id} 
              className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group border border-transparent hover:border-brand-light-cyan cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-cyan bg-brand-dark-navy px-2 py-1 rounded-md">
                  {ex.category}
                </span>
                {ex.difficulty_level && (
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                    ex.difficulty_level === 'beginner' ? 'bg-green-100 text-green-700' :
                    ex.difficulty_level === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {ex.difficulty_level}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-lg text-brand-navy mb-2 group-hover:text-brand-cyan transition-colors">{ex.name}</h3>
              
              <div className="space-y-2 mt-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <span className="font-medium mr-2 text-gray-400">Náradie:</span>
                  <span className="truncate">{ex.equipment || "Vlastná váha"}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <span className="font-medium mr-2 text-gray-400">Svaly:</span>
                  <span className="truncate">{ex.primary_muscles?.join(", ") || "-"}</span>
                </div>
              </div>
              
              {ex.is_custom && (
                <div className="mt-4 border-t pt-3">
                  <span className="text-xs text-brand-cyan font-medium flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                    Vlastný cvik
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
