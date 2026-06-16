"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";

export default function LogWorkoutPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const supabase = createClient();
  
  const [clientName, setClientName] = useState("");
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [exercisesDb, setExercisesDb] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Workout state
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().substring(0, 16));
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [difficulty, setDifficulty] = useState<number>(3);
  const [notes, setNotes] = useState("");
  
  const [workoutSets, setWorkoutSets] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      // 1. Client profile
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", clientId).single();
      if (profile) setClientName(profile.full_name);
      
      // 2. Active plans
      const { data: activePlans } = await supabase
        .from("training_plans")
        .select("id, title")
        .eq("client_id", clientId)
        .eq("is_active", true);
      if (activePlans) setPlans(activePlans);
      
      // 3. Exercise database
      const { data: exDb } = await supabase.from("exercises").select("*").order("name");
      if (exDb) setExercisesDb(exDb);
      
      setLoading(false);
    }
    loadData();
  }, [clientId, supabase]);

  const handlePlanSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const planId = e.target.value;
    setSelectedPlanId(planId);
    
    if (!planId) {
      setWorkoutSets([]);
      return;
    }
    
    // Load plan exercises
    setLoading(true);
    const { data: planEx } = await supabase
      .from("plan_exercises")
      .select(`
        id, order_index, target_sets, target_reps, target_duration, target_rest_seconds,
        exercise:exercise_id(*)
      `)
      .eq("plan_id", planId)
      .order("order_index", { ascending: true });
      
    if (planEx) {
      // Expand into individual sets
      const newSets: any[] = [];
      planEx.forEach((pe: any) => {
        const setsCount = pe.target_sets || 1;
        for (let i = 1; i <= setsCount; i++) {
          newSets.push({
            tempId: Math.random().toString(36).substr(2, 9),
            exercise: pe.exercise,
            set_number: i,
            reps: pe.target_reps || "",
            weight_kg: "",
            completed: true,
            target_reps: pe.target_reps
          });
        }
      });
      setWorkoutSets(newSets);
    }
    setLoading(false);
  };

  const addManualExercise = (exercise: any) => {
    const existingSets = workoutSets.filter(s => s.exercise.id === exercise.id).length;
    setWorkoutSets(prev => [
      ...prev,
      {
        tempId: Math.random().toString(36).substr(2, 9),
        exercise: exercise,
        set_number: existingSets + 1,
        reps: "",
        weight_kg: "",
        completed: true,
        target_reps: ""
      }
    ]);
  };

  const removeSet = (tempId: string) => {
    setWorkoutSets(prev => prev.filter(s => s.tempId !== tempId));
  };

  const updateSet = (tempId: string, field: string, value: any) => {
    setWorkoutSets(prev => prev.map(s => s.tempId === tempId ? { ...s, [field]: value } : s));
  };

  const handleSave = async () => {
    if (workoutSets.length === 0) {
      alert("Pridajte aspoň jeden cvik.");
      return;
    }
    
    setIsSaving(true);
    
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    
    // 1. Insert workout log
    const { data: logData, error: logError } = await supabase.from("client_workout_logs").insert({
      client_id: clientId,
      plan_id: selectedPlanId || null,
      completed_at: new Date(workoutDate).toISOString(),
      client_feedback_rating: difficulty,
      client_notes: notes
    }).select("id").single();
    
    if (logError || !logData) {
      alert("Chyba pri ukladaní hlavičky: " + logError?.message);
      setIsSaving(false);
      return;
    }
    
    // 2. Insert sets
    const setsToInsert = workoutSets.map(s => ({
      log_id: logData.id,
      exercise_id: s.exercise.id,
      set_index: s.set_number,
      reps_performed: parseInt(s.reps) || 0,
      weight_kg: s.weight_kg ? parseFloat(s.weight_kg) : null
    }));
    
    const { error: setsError } = await supabase.from("client_workout_log_sets").insert(setsToInsert);
    
    setIsSaving(false);
    
    if (setsError) {
      alert("Tréning uložený, ale nastala chyba pri sériách: " + setsError.message);
    } else {
      router.push(`/klienti/${clientId}`);
    }
  };

  const filteredDb = exercisesDb.filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()) || ex.category.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 50);

  if (loading && !clientName) {
    return <div className="p-20 text-center"><div className="animate-spin inline-block w-8 h-8 border-4 border-brand-cyan border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden animate-in fade-in duration-500 -m-4 md:-m-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 shrink-0 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">Záznam tréningu</h1>
          <p className="text-gray-500 mt-1">Klient: <span className="font-bold">{clientName}</span></p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 text-brand-navy font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Zrušiť
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-brand-cyan text-brand-dark-navy px-6 py-2 rounded-lg font-bold shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 flex items-center"
          >
            {isSaving ? "Ukladám..." : "Uložiť Záznam"}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full min-h-0 overflow-y-auto lg:overflow-hidden pb-10">
        
        {/* Ľavý stĺpec - Nastavenia a Cviky */}
        <div className="w-full lg:w-1/3 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden shrink-0 lg:shrink h-full">
          <div className="p-5 border-b border-gray-100 bg-brand-off-white">
            <h3 className="font-bold text-brand-navy mb-4">Základné údaje</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dátum a Čas</label>
                <input 
                  type="datetime-local" 
                  value={workoutDate}
                  onChange={e => setWorkoutDate(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-cyan text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Podľa plánu</label>
                <select 
                  value={selectedPlanId}
                  onChange={handlePlanSelect}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-cyan text-sm"
                >
                  <option value="">Voľný tréning (bez plánu)</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trvanie (min)</label>
                  <input 
                    type="number" 
                    value={durationMinutes}
                    onChange={e => setDurationMinutes(parseInt(e.target.value) || 0)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-cyan text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Náročnosť (1-5)</label>
                  <select 
                    value={difficulty}
                    onChange={e => setDifficulty(parseInt(e.target.value))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-cyan text-sm"
                  >
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} - {n===1?'Veľmi ľahké':n===5?'Veľmi ťažké':''}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pocit / Poznámka</label>
                <textarea 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ako sa klient cítil..."
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-cyan text-sm h-20 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col bg-gray-50">
            <h3 className="font-bold text-brand-navy mb-2 text-sm uppercase tracking-wide">Pridať cvik ručne</h3>
            <input 
              type="text" 
              placeholder="Hľadať cvik..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full p-2 border rounded-lg mb-3 text-sm"
            />
            <div className="space-y-2 overflow-y-auto">
              {filteredDb.map(ex => (
                <div key={ex.id} className="bg-white p-2 border rounded-lg flex justify-between items-center text-sm">
                  <div className="truncate pr-2">
                    <p className="font-bold text-brand-navy truncate">{ex.name}</p>
                    <p className="text-xs text-gray-500">{ex.category}</p>
                  </div>
                  <button 
                    onClick={() => addManualExercise(ex)}
                    className="w-8 h-8 bg-brand-light-cyan text-brand-navy rounded-full flex items-center justify-center font-bold shrink-0 hover:bg-brand-cyan"
                  >+</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pravý stĺpec - Logovanie sérií */}
        <div className="w-full lg:w-2/3 flex flex-col bg-white rounded-2xl shadow-sm border border-brand-light-cyan overflow-hidden h-full shrink-0 lg:shrink">
          <div className="p-4 bg-brand-navy text-white shrink-0">
            <h2 className="font-bold text-xl">Priebeh tréningu</h2>
            <p className="text-brand-light-cyan text-sm">Zaznamenajte reálne opakovania a váhy.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 bg-brand-off-white space-y-6 relative">
            {loading && <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center"><div className="animate-spin border-4 border-brand-cyan border-t-transparent w-8 h-8 rounded-full"></div></div>}
            
            {workoutSets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <p>Zatiaľ žiadne cviky.</p>
                <p className="text-sm">Vyberte plán alebo pridajte cviky ručne zľava.</p>
              </div>
            ) : (
              // Group rendering
              Object.entries(
                workoutSets.reduce((acc: any, set) => {
                  if (!acc[set.exercise.id]) acc[set.exercise.id] = { exercise: set.exercise, sets: [] };
                  acc[set.exercise.id].sets.push(set);
                  return acc;
                }, {})
              ).map(([exId, group]: [string, any]) => (
                <div key={exId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                    <h3 className="font-bold text-brand-navy text-lg">{group.exercise.name}</h3>
                    <button 
                      onClick={() => addManualExercise(group.exercise)}
                      className="text-sm bg-white border px-3 py-1 rounded hover:bg-gray-50 font-medium"
                    >
                      + Pridať sériu
                    </button>
                  </div>
                  <div className="p-0">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white border-b text-xs text-gray-500 uppercase">
                        <tr>
                          <th className="py-3 px-4 w-16 text-center">Séria</th>
                          <th className="py-3 px-4">Opakovania</th>
                          <th className="py-3 px-4">Váha (kg)</th>
                          <th className="py-3 px-4 w-24 text-center">Dokončené</th>
                          <th className="py-3 px-4 w-12 text-center"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.sets.map((set: any, idx: number) => (
                          <tr key={set.tempId} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="py-2 px-4 text-center font-bold text-gray-400">{idx + 1}.</td>
                            <td className="py-2 px-4">
                              <input 
                                type="text"
                                placeholder={set.target_reps ? `Cieľ: ${set.target_reps}` : "napr. 10"}
                                value={set.reps}
                                onChange={e => updateSet(set.tempId, "reps", e.target.value)}
                                className="w-full p-2 border rounded focus:ring-1 focus:ring-brand-cyan bg-white"
                              />
                            </td>
                            <td className="py-2 px-4">
                              <input 
                                type="number"
                                step="0.5"
                                placeholder="0"
                                value={set.weight_kg}
                                onChange={e => updateSet(set.tempId, "weight_kg", e.target.value)}
                                className="w-full p-2 border rounded focus:ring-1 focus:ring-brand-cyan bg-white"
                              />
                            </td>
                            <td className="py-2 px-4 text-center">
                              <input 
                                type="checkbox"
                                checked={set.completed}
                                onChange={e => updateSet(set.tempId, "completed", e.target.checked)}
                                className="w-5 h-5 text-brand-cyan rounded focus:ring-brand-cyan"
                              />
                            </td>
                            <td className="py-2 px-4 text-center">
                              <button 
                                onClick={() => removeSet(set.tempId)}
                                className="text-red-400 hover:text-red-600 font-bold"
                              >×</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
