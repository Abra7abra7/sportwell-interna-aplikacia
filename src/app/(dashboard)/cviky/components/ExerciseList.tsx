"use client";

import React, { useState, useEffect } from "react";
import ExerciseCard, { Exercise } from "./ExerciseCard";
import ExerciseDetailModal from "./ExerciseDetailModal";
import ExerciseFormModal from "./ExerciseFormModal";

interface ExerciseListProps {
  initialExercises: Exercise[];
  currentUserProfile: any;
}

export default function ExerciseList({ initialExercises, currentUserProfile }: ExerciseListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMuscle, setFilterMuscle] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(30);

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  // Extract unique values for filters
  const uniqueMuscles = Array.from(
    new Set(initialExercises.flatMap((e) => e.primary_muscles || []))
  )
    .filter(Boolean)
    .sort();

  const uniqueCategories = Array.from(new Set(initialExercises.map((e) => e.category)))
    .filter(Boolean)
    .sort();

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(30);
  }, [searchQuery, filterMuscle, filterCategory, sortOrder]);

  // Apply filtering and searching
  const filteredExercises = initialExercises.filter((ex) => {
    const matchesSearch =
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = filterMuscle ? ex.primary_muscles?.includes(filterMuscle) : true;
    const matchesCategory = filterCategory ? ex.category === filterCategory : true;
    return matchesSearch && matchesMuscle && matchesCategory;
  });

  // Apply sorting (newest is default from Supabase, so we keep order)
  const sortedExercises = [...filteredExercises];
  if (sortOrder === "az") {
    sortedExercises.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortOrder === "za") {
    sortedExercises.sort((a, b) => b.name.localeCompare(a.name));
  }

  const visibleExercises = sortedExercises.slice(0, visibleCount);

  const openCreateModal = () => {
    setFormMode("create");
    setEditingExercise(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (ex: Exercise) => {
    setFormMode("edit");
    setEditingExercise(ex);
    setIsFormModalOpen(true);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4 bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-gray-100/50">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">Databáza Cvikov</h1>
          <p className="text-gray-500 mt-1 font-medium">Prehľad všetkých dostupných cvičení v systéme</p>
        </div>
        <button
          onClick={openCreateModal}
          className="w-full sm:w-auto bg-brand-cyan hover:bg-brand-cyan/90 hover:-translate-y-0.5 text-brand-dark-navy px-5 py-2.5 rounded-xl font-bold shadow-[0_4px_14px_0_rgba(0,240,255,0.39)] transition-all duration-200 whitespace-nowrap min-h-[44px] flex items-center justify-center text-sm gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Pridať vlastný cvik
        </button>
      </div>

      {/* Filters and Search Query */}
      <div className="mb-6 space-y-3">
        <input
          type="text"
          placeholder="Vyhľadaj cvik podľa názvu alebo kategórie..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-100 shadow-sm focus:ring-2 focus:ring-brand-cyan transition-shadow bg-white text-brand-navy placeholder-gray-400 text-sm"
        />

        <div className="flex flex-col md:flex-row gap-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full md:w-auto md:flex-1 px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm focus:ring-2 focus:ring-brand-cyan bg-white text-gray-600 text-sm capitalize h-[44px]"
          >
            <option value="">Všetky Kategórie</option>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={filterMuscle}
            onChange={(e) => setFilterMuscle(e.target.value)}
            className="w-full md:w-auto md:flex-1 px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm focus:ring-2 focus:ring-brand-cyan bg-white text-gray-600 text-sm capitalize h-[44px]"
          >
            <option value="">Všetky Partie (Svaly)</option>
            {uniqueMuscles.map((muscle) => (
              <option key={muscle} value={muscle}>
                {muscle}
              </option>
            ))}
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full md:w-auto md:flex-1 px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm focus:ring-2 focus:ring-brand-cyan bg-white text-gray-600 text-sm h-[44px]"
          >
            <option value="newest">Najnovšie (Vlastné prvé)</option>
            <option value="az">Abecedne (A - Z)</option>
            <option value="za">Abecedne (Z - A)</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      <div>
        {sortedExercises.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-500 text-lg">Nenašli sa žiadne cviky podľa zadaných kritérií.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterCategory("");
                setFilterMuscle("");
              }}
              className="mt-4 text-brand-cyan font-bold hover:underline min-h-[44px]"
            >
              Zrušiť filtre
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleExercises.map((ex) => (
              <ExerciseCard
                key={ex.id}
                ex={ex}
                onSelect={(selected) => {
                  setSelectedExercise(selected);
                  setIsDetailModalOpen(true);
                }}
                onEdit={ex.is_custom ? openEditModal : undefined}
                currentUserRole={currentUserProfile?.role}
              />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {visibleCount < sortedExercises.length && (
          <div className="flex justify-center mt-10 mb-6">
            <button
              onClick={() => setVisibleCount((prev) => prev + 30)}
              className="px-8 py-3 bg-white border border-gray-200 text-brand-navy font-bold rounded-xl shadow-sm hover:shadow-md hover:border-brand-cyan hover:text-brand-cyan transition-all duration-200 flex items-center min-h-[44px]"
            >
              Načítať ďalšie cviky
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedExercise && (
        <ExerciseDetailModal
          ex={selectedExercise}
          onClose={() => setIsDetailModalOpen(false)}
          onEdit={() => {
            setIsDetailModalOpen(false);
            openEditModal(selectedExercise);
          }}
          currentUserProfile={currentUserProfile}
        />
      )}

      {/* Create / Edit Form Modal */}
      {isFormModalOpen && (
        <ExerciseFormModal
          mode={formMode}
          exercise={editingExercise}
          onClose={() => setIsFormModalOpen(false)}
        />
      )}
    </div>
  );
}
