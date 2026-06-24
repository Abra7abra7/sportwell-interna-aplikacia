"use client";

import React, { useState } from "react";
import { deleteExerciseAction } from "../actions";
import { Exercise } from "./ExerciseCard";

interface ExerciseDetailModalProps {
  ex: Exercise;
  onClose: () => void;
  onEdit: () => void;
  currentUserProfile: any;
}

export default function ExerciseDetailModal({
  ex,
  onClose,
  onEdit,
  currentUserProfile,
}: ExerciseDetailModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Naozaj chcete zmazať tento cvik?")) return;
    setIsDeleting(true);

    try {
      await deleteExerciseAction(ex.id);
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Chyba pri mazaní cviku.");
    } finally {
      setIsDeleting(false);
    }
  };

  const hasPermission =
    (ex.is_custom && ex.created_by === currentUserProfile?.id) ||
    ["admin", "majitel"].includes(currentUserProfile?.role || "");

  return (
    <div className="fixed inset-0 bg-brand-dark-navy/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[95vh] flex flex-col relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/50 hover:bg-white rounded-full p-2 text-gray-600 hover:text-red-500 transition-colors z-10 backdrop-blur-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <div className="overflow-y-auto flex-1">
          <div className="w-full bg-gray-100 relative min-h-[300px] flex items-center justify-center">
            {ex.video_url ? (
              <video
                src={ex.video_url}
                controls
                autoPlay
                className="w-full max-h-[500px] object-contain bg-black"
              />
            ) : (ex.gif_url || ex.image_url) ? (
              <img
                src={ex.gif_url || ex.image_url || undefined}
                alt={ex.name}
                className="w-full max-h-[500px] object-contain mix-blend-multiply"
              />
            ) : (
              <div className="text-gray-400 p-20 flex flex-col items-center">
                <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <span className="text-sm font-medium">Zatiaľ žiadne video ani obrázok</span>
              </div>
            )}
          </div>

          <div className="p-8">
            <div className="flex gap-2 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-dark-navy bg-brand-light-cyan px-3 py-1 rounded-full">
                {ex.category}
              </span>
              {ex.is_custom && (
                <span className="text-xs font-bold uppercase tracking-wider text-white bg-brand-cyan px-3 py-1 rounded-full">
                  Vlastný cvik
                </span>
              )}
            </div>

            <h2 className="text-3xl font-black text-brand-navy mb-6">{ex.name}</h2>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm text-gray-500 font-medium mb-1">Potrebné náradie</p>
                <p className="text-lg font-bold text-brand-navy capitalize">{ex.equipment || "Vlastná váha"}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm text-gray-500 font-medium mb-1">Zapojené svaly</p>
                <p className="text-lg font-bold text-brand-navy capitalize">{ex.primary_muscles?.join(", ") || "-"}</p>
              </div>
            </div>

            {ex.description && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-brand-navy mb-3">Inštrukcie a Popis</h3>
                <div className="bg-brand-off-white p-5 rounded-2xl border border-gray-100">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{ex.description}</p>
                </div>
              </div>
            )}

            {/* Edit / Delete Buttons */}
            {hasPermission && (
              <div className="border-t border-gray-100 pt-6 mt-6 flex justify-end gap-4 shrink-0">
                <button
                  onClick={onEdit}
                  className="px-6 py-2.5 bg-brand-light-cyan hover:bg-brand-cyan text-brand-navy font-bold rounded-xl transition-colors text-sm min-h-[44px]"
                >
                  Upraviť cvik
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-6 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors text-sm min-h-[44px]"
                >
                  {isDeleting ? "Mažem..." : "Zmazať cvik"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
