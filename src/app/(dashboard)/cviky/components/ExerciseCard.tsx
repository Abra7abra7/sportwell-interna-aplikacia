"use client";

import React, { useState } from "react";

export interface Exercise {
  id: string;
  name: string;
  difficulty_level: string;
  equipment: string;
  primary_muscles: string[];
  category: string;
  is_custom: boolean;
  image_url?: string | null;
  gif_url?: string | null;
  description?: string;
  video_url?: string | null;
  created_by?: string;
}

interface ExerciseCardProps {
  ex: Exercise;
  onSelect: (ex: Exercise) => void;
  onEdit?: (ex: Exercise) => void;
  currentUserRole?: string;
}

export default function ExerciseCard({ ex, onEdit, onSelect, currentUserRole }: ExerciseCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group border border-transparent hover:border-brand-light-cyan cursor-pointer flex flex-col overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(ex)}
    >
      {/* Visual Container (Preview Image or GIF) */}
      <div className="h-56 w-full bg-gray-100 relative overflow-hidden flex items-center justify-center border-b border-gray-100">
        {(ex.image_url || ex.gif_url) ? (
          <img 
            src={(isHovered && ex.gif_url) ? ex.gif_url : (ex.image_url || ex.gif_url || undefined)} 
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
        
        {/* Category Label Overlay */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-dark-navy bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md shadow-sm">
            {ex.category}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-lg text-brand-navy mb-2 group-hover:text-brand-cyan transition-colors line-clamp-2">{ex.name}</h3>
        
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
          <div className="mt-4 border-t pt-3 flex justify-between items-center shrink-0">
            <span className="text-xs text-brand-cyan font-medium flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
              Vlastný cvik
            </span>
            {onEdit && (
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(ex); }}
                className="text-xs text-gray-500 hover:text-brand-cyan transition-colors flex items-center font-bold min-h-[44px]"
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
