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
  image_url: string;
  gif_url: string;
}

function ExerciseCard({ ex, onEdit }: { ex: Exercise, onEdit?: (ex: Exercise) => void }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group border border-transparent hover:border-brand-light-cyan cursor-pointer flex flex-col overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Vizuálny kontajner (Náhľad / GIF) */}
      <div className="h-56 w-full bg-gray-100 relative overflow-hidden flex items-center justify-center border-b border-gray-100">
        {(ex.image_url || ex.gif_url) ? (
          <img 
            src={isHovered && ex.gif_url ? ex.gif_url : ex.image_url} 
            alt={ex.name}
            className="object-cover w-full h-full mix-blend-multiply"
            loading="lazy"
          />
        ) : (
          <div className="text-gray-400 flex flex-col items-center">
            <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <span className="text-xs">Žiadny náhľad</span>
          </div>
        )}
        
        {/* Odznak v rohu obrázka */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-dark-navy bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm">
            {ex.category}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-lg text-brand-navy mb-2 group-hover:text-brand-cyan transition-colors">{ex.name}</h3>
        
        <div className="space-y-2 mt-auto text-sm">
          <div className="flex items-center text-gray-600">
            <span className="font-medium mr-2 text-gray-400">Náradie:</span>
            <span className="truncate capitalize">{ex.equipment || "Vlastná váha"}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <span className="font-medium mr-2 text-gray-400">Svaly:</span>
            <span className="truncate capitalize">{ex.primary_muscles?.join(", ") || "-"}</span>
          </div>
        </div>
        
        {ex.is_custom && (
          <div className="mt-4 border-t pt-3 flex justify-between items-center">
            <span className="text-xs text-brand-cyan font-medium flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
              Vlastný cvik
            </span>
            {onEdit && (
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(ex); }}
                className="text-xs text-gray-500 hover:text-brand-cyan transition-colors flex items-center font-semibold"
              >
                Upraviť
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CvikyPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  
  const [newExercise, setNewExercise] = useState({
    id: "",
    name: "",
    category: "strength",
    equipment: "body weight",
    primary_muscles: "",
    image_url: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [filterMuscle, setFilterMuscle] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  const supabase = createClient();

  const fetchExercises = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .order("created_at", { ascending: false }) // vlastné budú navrchu
      .limit(2000); // načítame všetky cviky z datasetu pre rýchle lokálne filtrovanie

    if (error) {
      console.error("Chyba pri načítavaní cvikov:", error);
    } else {
      setExercises(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExercises();
  }, [supabase]);

  // Extrahovanie unikátnych hodnôt pre filtre
  const uniqueMuscles = Array.from(new Set(exercises.flatMap(e => e.primary_muscles || []))).filter(Boolean).sort();
  const uniqueCategories = Array.from(new Set(exercises.map(e => e.category))).filter(Boolean).sort();

  // Aplikácia filtrov a vyhľadávania
  let filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) || ex.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = filterMuscle ? ex.primary_muscles?.includes(filterMuscle) : true;
    const matchesCategory = filterCategory ? ex.category === filterCategory : true;
    return matchesSearch && matchesMuscle && matchesCategory;
  });

  // Aplikácia zoradenia
  if (sortOrder === "az") {
    filteredExercises.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortOrder === "za") {
    filteredExercises.sort((a, b) => b.name.localeCompare(a.name));
  } else if (sortOrder === "newest") {
    // keďže už sú zo Supabase zoradené podľa dátumu od najnovších, pre newest nerobíme nič
  }

  // --- Ostatné funkcie (openCreateModal, handleAddCustom...) zostávajú rovnaké ---

  const openCreateModal = () => {
    setModalMode("create");
    setNewExercise({ id: "", name: "", category: "strength", equipment: "body weight", primary_muscles: "", image_url: "" });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (ex: Exercise) => {
    setModalMode("edit");
    setNewExercise({
      id: ex.id,
      name: ex.name,
      category: ex.category,
      equipment: ex.equipment || "body weight",
      primary_muscles: ex.primary_muscles?.[0] || "",
      image_url: ex.image_url || "",
    });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleAddCustomExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let finalImageUrl = newExercise.image_url;

    if (selectedFile) {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('exercise_images')
        .upload(fileName, selectedFile);
        
      if (uploadError) {
        alert("Chyba pri nahrávaní obrázka: " + uploadError.message);
        setIsSubmitting(false);
        return;
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('exercise_images')
        .getPublicUrl(fileName);
        
      finalImageUrl = publicUrlData.publicUrl;
    }
    
    const exerciseData = {
      name: newExercise.name,
      category: newExercise.category,
      equipment: newExercise.equipment,
      primary_muscles: newExercise.primary_muscles ? [newExercise.primary_muscles] : [],
      is_custom: true,
      difficulty_level: 'intermediate',
      image_url: finalImageUrl || null,
    };

    let error = null;

    if (modalMode === "create") {
      const { data: userData } = await supabase.auth.getUser();
      const insertData = { ...exerciseData, created_by: userData?.user?.id || null };
      const res = await supabase.from("exercises").insert([insertData]);
      error = res.error;
    } else {
      const res = await supabase.from("exercises").update(exerciseData).eq('id', newExercise.id);
      error = res.error;
    }

    setIsSubmitting(false);

    if (error) {
      alert("Chyba pri ukladaní cviku: " + error.message);
    } else {
      setIsModalOpen(false);
      fetchExercises(); 
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">Databáza Cvikov</h1>
          <p className="text-gray-500 mt-1">Prehľad všetkých dostupných cvičení v systéme</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-brand-cyan text-brand-dark-navy px-4 py-2 rounded-lg font-bold shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
        >
          + Pridať vlastný cvik
        </button>
      </div>

      <div className="mb-6 space-y-3">
        <input 
          type="text" 
          placeholder="Vyhľadaj cvik podľa názvu alebo kategórie..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-brand-cyan transition-shadow bg-white text-brand-navy placeholder-gray-400"
        />
        
        <div className="flex flex-wrap gap-3">
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-brand-cyan bg-white text-gray-600 text-sm capitalize"
          >
            <option value="">Všetky Kategórie</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select 
            value={filterMuscle} 
            onChange={(e) => setFilterMuscle(e.target.value)}
            className="px-4 py-2 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-brand-cyan bg-white text-gray-600 text-sm capitalize"
          >
            <option value="">Všetky Partie (Svaly)</option>
            {uniqueMuscles.map(muscle => (
              <option key={muscle} value={muscle}>{muscle}</option>
            ))}
          </select>

          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-4 py-2 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-brand-cyan bg-white text-gray-600 text-sm"
          >
            <option value="newest">Najnovšie (Vlastné prvé)</option>
            <option value="az">Abecedne (A - Z)</option>
            <option value="za">Abecedne (Z - A)</option>
          </select>
        </div>
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
            <ExerciseCard key={ex.id} ex={ex} onEdit={openEditModal} />
          ))}
        </div>
      )}

      {/* Modálne okno pre nový/upravovaný cvik */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-dark-navy/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-brand-off-white shrink-0">
              <h2 className="text-xl font-bold text-brand-navy">
                {modalMode === "create" ? "Nový vlastný cvik" : "Upraviť cvik"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleAddCustomExercise} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fotografia cviku (voliteľné)</label>
                {newExercise.image_url && !selectedFile && (
                  <div className="mb-2 relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
                     <img src={newExercise.image_url} alt="Náhľad" className="object-cover w-full h-full" />
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-cyan focus:border-transparent text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-light-cyan file:text-brand-navy hover:file:bg-brand-cyan transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">Ideálne PNG/JPG. Bude zobrazená namiesto 3D animácie.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Názov cviku *</label>
                <input 
                  required
                  type="text" 
                  value={newExercise.name}
                  onChange={(e) => setNewExercise({...newExercise, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-cyan focus:border-transparent" 
                  placeholder="napr. Kliky na bradlách"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategória</label>
                  <select 
                    value={newExercise.category}
                    onChange={(e) => setNewExercise({...newExercise, category: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-cyan focus:border-transparent"
                  >
                    <option value="strength">Strength</option>
                    <option value="stretching">Stretching</option>
                    <option value="plyometrics">Plyometrics</option>
                    <option value="cardio">Cardio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Náradie</label>
                  <input 
                    type="text" 
                    value={newExercise.equipment}
                    onChange={(e) => setNewExercise({...newExercise, equipment: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-cyan" 
                    placeholder="napr. Jednoručky"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primárny sval (Cieľ)</label>
                <input 
                  type="text" 
                  value={newExercise.primary_muscles}
                  onChange={(e) => setNewExercise({...newExercise, primary_muscles: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-cyan" 
                  placeholder="napr. Triceps"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Zrušiť
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-brand-cyan text-brand-dark-navy px-6 py-2 rounded-lg font-bold shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? "Ukladám..." : "Uložiť cvik"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
