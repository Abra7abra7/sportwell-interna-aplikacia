"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface Exercise {
  id: string;
  name: string;
  category: string;
  equipment: string;
  primary_muscles: string[];
  image_url: string;
  gif_url: string;
  is_custom: boolean;
}

interface PlanExercise {
  tempId: string; // pre lokálnu správu poradia pred uložením
  exercise: Exercise;
  target_sets: number;
  target_reps: string;
  target_duration: number | null;
  target_rest_seconds: number;
  tempo: string;
  rpe: string;
  rest_between_exercises: number;
  notes: string;
}

interface ClientProfile {
  id: string;
  full_name: string;
  email: string;
}

export default function CreatePlanPage() {
  const router = useRouter();
  const supabase = createClient();
  
  // Stavy pre ľavý panel (Zoznam cvikov)
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMuscle, setFilterMuscle] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [sortOrder, setSortOrder] = useState("az");
  const [loadingExercises, setLoadingExercises] = useState(true);

  // Stavy pre pravý panel (Plán)
  const [planExercises, setPlanExercises] = useState<PlanExercise[]>([]);
  const [planTitle, setPlanTitle] = useState("");
  const [planDescription, setPlanDescription] = useState("");
  const [warmupNotes, setWarmupNotes] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [clients, setClients] = useState<ClientProfile[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'catalog' | 'plan'>('plan');

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    async function loadData() {
      // 1. Načítaj cviky
      const { data: exData, error: exError } = await supabase
        .from("exercises")
        .select("*")
        .order("name", { ascending: true })
        .limit(2000); 
      if (!exError) setExercises(exData || []);
      setLoadingExercises(false);

      // 2. Načítaj klientov
      const { data: clientData, error: clientError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "klient")
        .order("full_name", { ascending: true });
      if (!clientError) setClients(clientData || []);
    }
    loadData();
  }, [supabase]);

  // Extrahovanie unikátnych hodnôt pre filtre v stĺpci cvikov
  const uniqueMuscles = Array.from(new Set(exercises.flatMap(e => e.primary_muscles || []))).filter(Boolean).sort();
  const uniqueCategories = Array.from(new Set(exercises.map(e => e.category))).filter(Boolean).sort();

  // Vyhľadávanie na klientskej strane
  let filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) || ex.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = filterMuscle ? ex.primary_muscles?.includes(filterMuscle) : true;
    const matchesCategory = filterCategory ? ex.category === filterCategory : true;
    return matchesSearch && matchesMuscle && matchesCategory;
  });

  if (sortOrder === "az") {
    filteredExercises.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortOrder === "za") {
    filteredExercises.sort((a, b) => b.name.localeCompare(a.name));
  }

  const handleAddExerciseToPlan = (ex: Exercise) => {
    setPlanExercises(prev => [
      ...prev,
      {
        tempId: Math.random().toString(36).substr(2, 9),
        exercise: ex,
        target_sets: 3,
        target_reps: "10-12",
        target_duration: null,
        target_rest_seconds: 60,
        tempo: "2-0-2-0",
        rpe: "80%",
        rest_between_exercises: 0,
        notes: ""
      }
    ]);
    showToast(`Cvik "${ex.name}" bol pridaný do plánu`);
  };

  const handleRemoveExercise = (tempId: string) => {
    const exerciseToRemove = planExercises.find(pe => pe.tempId === tempId);
    setPlanExercises(prev => prev.filter(pe => pe.tempId !== tempId));
    if (exerciseToRemove) {
      showToast(`Cvik "${exerciseToRemove.exercise.name}" bol odobraný z plánu`);
    }
  };

  const handleUpdateExerciseParam = (tempId: string, field: keyof PlanExercise, value: any) => {
    setPlanExercises(prev => prev.map(pe => 
      pe.tempId === tempId ? { ...pe, [field]: value } : pe
    ));
  };

  const handleCreateQuickCustomExercise = async () => {
    const name = window.prompt("Zadajte názov nového vlastného cviku (napr. 'Tlak s jednoručkami'):");
    if (!name || !name.trim()) return;

    const { data: userData } = await supabase.auth.getUser();
    const creatorId = userData?.user?.id;

    if (!creatorId) {
      alert("Chyba autentifikácie.");
      return;
    }

    setIsSaving(true);
    const { data: newExData, error: newExError } = await supabase
      .from("exercises")
      .insert([{
        name: name.trim(),
        category: "Vlastné",
        equipment: "Vlastná váha",
        primary_muscles: [],
        is_custom: true,
        created_by: creatorId
      }])
      .select("*")
      .single();
    
    setIsSaving(false);

    if (newExError || !newExData) {
      alert("Chyba pri vytváraní cviku: " + newExError?.message);
      return;
    }

    setExercises(prev => [...prev, newExData].sort((a, b) => a.name.localeCompare(b.name)));
    handleAddExerciseToPlan(newExData);
  };

  const handleSavePlan = async () => {
    if (!planTitle.trim()) {
      alert("Zadajte názov plánu.");
      return;
    }
    if (!selectedClientId) {
      alert("Vyberte klienta pre tento plán.");
      return;
    }
    if (planExercises.length === 0) {
      alert("Plán musí obsahovať aspoň jeden cvik.");
      return;
    }

    setIsSaving(true);
    
    // Zistíme, kto plán vytvoril
    const { data: userData } = await supabase.auth.getUser();
    const creatorId = userData?.user?.id;

    if (!creatorId) {
      alert("Chyba autentifikácie.");
      setIsSaving(false);
      return;
    }

    // 1. Vlož do training_plans
    const { data: planData, error: planError } = await supabase
      .from("training_plans")
      .insert([{
        client_id: selectedClientId,
        creator_id: creatorId,
        title: planTitle,
        description: planDescription,
        warmup_notes: warmupNotes,
        is_active: true
      }])
      .select("id")
      .single();

    if (planError || !planData) {
      alert("Chyba pri ukladaní hlavičky plánu: " + planError?.message);
      setIsSaving(false);
      return;
    }

    // 2. Vlož do plan_exercises
    const exercisesToInsert = planExercises.map((pe, index) => ({
      plan_id: planData.id,
      exercise_id: pe.exercise.id,
      order_index: index + 1,
      target_sets: pe.target_sets,
      target_reps: pe.target_reps,
      target_duration: pe.target_duration,
      target_rest_seconds: pe.target_rest_seconds,
      tempo: pe.tempo,
      rpe: pe.rpe,
      rest_between_exercises: pe.rest_between_exercises,
      notes: pe.notes
    }));

    const { error: exError } = await supabase
      .from("plan_exercises")
      .insert(exercisesToInsert);

    setIsSaving(false);

    if (exError) {
      alert("Plán bol vytvorený, ale nepodarilo sa uložiť cviky: " + exError.message);
    } else {
      alert("Plán úspešne uložený!");
      router.push("/plan");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-64px)] overflow-hidden animate-in fade-in duration-500 -m-4 md:-m-6 p-4 md:p-6 relative">
      
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-brand-cyan text-brand-dark-navy px-4 py-2 rounded-xl font-bold shadow-lg animate-in slide-in-from-top-4 fade-in duration-300">
          {toastMessage}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 shrink-0 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-navy">Tvorca Tréningového Plánu</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">Zostavte plán na mieru z databázy cvičení</p>
        </div>
        <div className="flex gap-2 md:gap-4">
          <button 
            onClick={() => router.back()}
            className="px-3 md:px-4 py-2 text-brand-navy font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm md:text-base"
          >
            Zrušiť
          </button>
          <button 
            onClick={handleSavePlan}
            disabled={isSaving}
            className="bg-brand-cyan text-brand-dark-navy px-4 md:px-6 py-2 rounded-lg font-bold shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 flex items-center text-sm md:text-base"
          >
            {isSaving ? "Ukladám..." : "Uložiť Plán"}
          </button>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="lg:hidden flex gap-2 mb-4 bg-gray-100 p-1 rounded-xl shrink-0">
        <button 
          onClick={() => setActiveTab('plan')} 
          className={`flex-1 py-2 font-bold text-sm rounded-lg transition-colors ${activeTab === 'plan' ? 'bg-white shadow text-brand-cyan' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Váš plán ({planExercises.length})
        </button>
        <button 
          onClick={() => setActiveTab('catalog')} 
          className={`flex-1 py-2 font-bold text-sm rounded-lg transition-colors ${activeTab === 'catalog' ? 'bg-white shadow text-brand-cyan' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Katalóg cvikov
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full min-h-0 overflow-hidden pb-10 lg:pb-0">
        {/* Ľavý stĺpec: Databáza cvikov */}
        <div className={`${activeTab === 'catalog' ? 'flex' : 'hidden'} lg:flex w-full lg:w-1/2 flex-col bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 h-full`}>
          <div className="p-4 border-b border-gray-100 bg-brand-off-white shrink-0">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-lg text-brand-navy">Katalóg Cvikov</h2>
              <button
                onClick={handleCreateQuickCustomExercise}
                className="text-xs bg-brand-navy text-white px-3 py-1.5 rounded-lg font-bold hover:bg-brand-cyan hover:text-brand-dark-navy transition-colors flex items-center gap-1"
              >
                <span>+ Vlastný</span>
              </button>
            </div>
            <div className="space-y-2">
              <input 
                type="text" 
                placeholder="Vyhľadať cvik..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-cyan focus:border-transparent text-sm"
              />
              <div className="flex gap-2">
                <select 
                  value={filterCategory} 
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-1/2 px-2 py-1.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-cyan text-xs capitalize"
                >
                  <option value="">Všetky Kategórie</option>
                  {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <select 
                  value={filterMuscle} 
                  onChange={(e) => setFilterMuscle(e.target.value)}
                  className="w-1/2 px-2 py-1.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-cyan text-xs capitalize"
                >
                  <option value="">Všetky Partie</option>
                  {uniqueMuscles.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>
          
          <div className="overflow-y-auto p-4 space-y-3 flex-1 bg-gray-50/50">
            {loadingExercises ? (
              <div className="flex justify-center p-10"><div className="animate-spin h-8 w-8 border-t-2 border-brand-cyan rounded-full"></div></div>
            ) : filteredExercises.length === 0 ? (
              <p className="text-center text-gray-500 py-10">Žiadne cviky sa nenašli.</p>
            ) : (
              filteredExercises.map(ex => (
                <div key={ex.id} className="bg-white border border-gray-100 rounded-xl p-3 flex gap-4 hover:border-brand-cyan hover:shadow-md transition-all group items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    {(ex.image_url || ex.gif_url) ? (
                      <img src={ex.image_url || ex.gif_url} alt={ex.name} className="w-full h-full object-cover mix-blend-multiply" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-brand-navy truncate">{ex.name}</h4>
                    <p className="text-xs text-gray-500 truncate">{ex.category} • {ex.equipment || 'Vlastná váha'}</p>
                  </div>
                  <button 
                    onClick={() => handleAddExerciseToPlan(ex)}
                    className="w-10 h-10 rounded-full bg-brand-off-white text-brand-cyan flex items-center justify-center hover:bg-brand-cyan hover:text-brand-dark-navy transition-colors shrink-0"
                    title="Pridať do plánu"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pravý stĺpec: Aktuálny Plán */}
        <div className={`${activeTab === 'plan' ? 'flex' : 'hidden'} lg:flex w-full lg:w-1/2 flex-col bg-white rounded-2xl shadow-sm border border-brand-light-cyan overflow-hidden h-full`}>
          <div className="p-5 border-b border-gray-100 bg-brand-navy shrink-0 text-white space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-cyan mb-1 uppercase tracking-wider">Názov Plánu *</label>
                <input 
                  type="text" 
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  placeholder="napr. ACL Rehab Fáza 1"
                  className="w-full px-3 py-2 bg-brand-dark-navy/50 border border-brand-cyan/30 rounded-lg text-white focus:outline-none focus:border-brand-cyan"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-cyan mb-1 uppercase tracking-wider">Klient *</label>
                <select 
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-dark-navy/50 border border-brand-cyan/30 rounded-lg text-white focus:outline-none focus:border-brand-cyan"
                >
                  <option value="">-- Vyber klienta --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-cyan mb-1 uppercase tracking-wider">Rozcvička (Zápis na začiatku)</label>
              <textarea 
                value={warmupNotes}
                onChange={(e) => setWarmupNotes(e.target.value)}
                placeholder="Napr. 10 minút bicykel, dynamický strečing..."
                className="w-full px-3 py-2 bg-brand-dark-navy/50 border border-brand-cyan/30 rounded-lg text-white focus:outline-none focus:border-brand-cyan resize-none h-16"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-cyan mb-1 uppercase tracking-wider">Cieľ / Popis (voliteľné)</label>
              <textarea 
                value={planDescription}
                onChange={(e) => setPlanDescription(e.target.value)}
                placeholder="Krátky popis pre klienta..."
                className="w-full px-3 py-2 bg-brand-dark-navy/50 border border-brand-cyan/30 rounded-lg text-white focus:outline-none focus:border-brand-cyan resize-none h-16"
              />
            </div>
            
          </div>

          <div className="overflow-y-auto flex-1 p-5 space-y-4 bg-brand-off-white">
            {planExercises.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                <p>Plán je zatiaľ prázdny.</p>
                <p className="text-sm">Kliknite na + vľavo pre pridanie cvikov.</p>
              </div>
            ) : (
              planExercises.map((pe, index) => (
                <div key={pe.tempId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
                  {/* Číslovanie */}
                  <div className="absolute top-0 left-0 w-8 h-8 bg-brand-cyan text-brand-dark-navy flex items-center justify-center font-bold text-sm rounded-br-lg z-10">
                    {index + 1}
                  </div>
                  
                  <div className="p-4 pl-10 flex gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-brand-navy text-lg">{pe.exercise.name}</h4>
                        <button 
                          onClick={() => handleRemoveExercise(pe.tempId)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-3">
                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                          <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Série</label>
                          <input 
                            type="number" 
                            value={pe.target_sets}
                            onChange={(e) => handleUpdateExerciseParam(pe.tempId, "target_sets", parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent border-none text-brand-navy font-bold focus:ring-0 p-0 text-sm"
                          />
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                          <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Opakovania</label>
                          <input 
                            type="text" 
                            value={pe.target_reps}
                            onChange={(e) => handleUpdateExerciseParam(pe.tempId, "target_reps", e.target.value)}
                            className="w-full bg-transparent border-none text-brand-navy font-bold focus:ring-0 p-0 text-sm"
                          />
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                          <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Tempo</label>
                          <input 
                            type="text" 
                            value={pe.tempo}
                            onChange={(e) => handleUpdateExerciseParam(pe.tempId, "tempo", e.target.value)}
                            className="w-full bg-transparent border-none text-brand-navy font-bold focus:ring-0 p-0 text-sm"
                            placeholder="2-0-2-0"
                          />
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                          <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">RPE / %</label>
                          <input 
                            type="text" 
                            value={pe.rpe}
                            onChange={(e) => handleUpdateExerciseParam(pe.tempId, "rpe", e.target.value)}
                            className="w-full bg-transparent border-none text-brand-navy font-bold focus:ring-0 p-0 text-sm"
                            placeholder="80%"
                          />
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                          <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1" title="Pauza medzi sériami">Pauza(s)</label>
                          <input 
                            type="number" 
                            value={pe.target_rest_seconds}
                            onChange={(e) => handleUpdateExerciseParam(pe.tempId, "target_rest_seconds", parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent border-none text-brand-navy font-bold focus:ring-0 p-0 text-sm"
                          />
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                          <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1" title="Pauza po tomto cviku pred ďalším">Extr. pauza</label>
                          <input 
                            type="number" 
                            value={pe.rest_between_exercises}
                            onChange={(e) => handleUpdateExerciseParam(pe.tempId, "rest_between_exercises", parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent border-none text-brand-navy font-bold focus:ring-0 p-0 text-sm"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <input 
                          type="text" 
                          placeholder="Poznámka pre klienta k technike (voliteľné)..."
                          value={pe.notes}
                          onChange={(e) => handleUpdateExerciseParam(pe.tempId, "notes", e.target.value)}
                          className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand-cyan focus:border-transparent bg-white"
                        />
                      </div>
                      
                    </div>
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
