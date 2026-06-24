"use client";

import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { createExerciseAction, updateExerciseAction } from "../actions";
import { Exercise } from "./ExerciseCard";

interface ExerciseFormModalProps {
  mode: "create" | "edit";
  exercise: Exercise | null;
  onClose: () => void;
}

export default function ExerciseFormModal({ mode, exercise, onClose }: ExerciseFormModalProps) {
  const supabase = createClient();
  const [name, setName] = useState(exercise?.name || "");
  const [category, setCategory] = useState(exercise?.category || "strength");
  const [equipment, setEquipment] = useState(exercise?.equipment || "body weight");
  const [primaryMuscles, setPrimaryMuscles] = useState(exercise?.primary_muscles?.[0] || "");
  const [imageUrl, setImageUrl] = useState(exercise?.image_url || "");
  const [description, setDescription] = useState(exercise?.description || "");
  const [videoUrl, setVideoUrl] = useState(exercise?.video_url || "");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setIsSubmitting(true);
    setErrorMsg("");

    let finalImageUrl = imageUrl;
    let finalVideoUrl = videoUrl;

    try {
      // 1. Nahrávanie obrázka na kliente (ak bol zvolený)
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("exercise_images")
          .upload(fileName, selectedFile);

        if (uploadError) {
          throw new Error("Chyba pri nahrávaní obrázka: " + uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from("exercise_images")
          .getPublicUrl(fileName);

        finalImageUrl = publicUrlData.publicUrl;
      }

      // 2. Nahrávanie videa na kliente (ak bolo zvolené)
      if (selectedVideoFile) {
        const fileExt = selectedVideoFile.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("exercise_videos")
          .upload(fileName, selectedVideoFile);

        if (uploadError) {
          throw new Error("Chyba pri nahrávaní videa: " + uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from("exercise_videos")
          .getPublicUrl(fileName);

        finalVideoUrl = publicUrlData.publicUrl;
      }

      // 3. Odoslanie dát cez Server Action
      const payload = {
        name,
        category,
        equipment,
        primary_muscles: primaryMuscles ? [primaryMuscles] : [],
        description,
        image_url: finalImageUrl,
        video_url: finalVideoUrl,
      };

      if (mode === "create") {
        await createExerciseAction(payload);
      } else {
        if (!exercise) throw new Error("Cvik chýba.");
        await updateExerciseAction(exercise.id, payload);
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Chyba pri ukladaní cviku.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-dark-navy/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-brand-off-white shrink-0">
          <h2 className="text-xl font-bold text-brand-navy">
            {mode === "create" ? "Nový vlastný cvik" : "Upraviť cvik"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Fotografia cviku (voliteľné)</label>
            {imageUrl && !selectedFile && (
              <div className="mb-2 relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
                <img src={imageUrl} alt="Náhľad" className="object-cover w-full h-full" />
              </div>
            )}
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-brand-cyan text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-light-cyan file:text-brand-navy hover:file:bg-brand-cyan transition-colors"
            />
            <p className="text-[10px] text-gray-400 mt-1">Ideálne PNG/JPG. Bude zobrazená namiesto 3D animácie.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Inštruktážne video (voliteľné)</label>
            {videoUrl && !selectedVideoFile && (
              <p className="text-sm text-brand-cyan mb-2">✓ Video je už nahrané</p>
            )}
            <input
              type="file"
              accept="video/mp4, video/webm"
              onChange={(e) => setSelectedVideoFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-brand-cyan text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-light-cyan file:text-brand-navy hover:file:bg-brand-cyan transition-colors"
            />
            <p className="text-[10px] text-gray-400 mt-1">Podporované formáty: MP4, WebM (max 20MB).</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Názov cviku *</label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan text-sm"
              placeholder="napr. Kliky na bradlách"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Podrobný popis / Inštrukcie</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan text-sm"
              placeholder="Popíšte techniku cviku, na čo si dať pozor..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Kategória</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan bg-white text-sm h-[40px]"
              >
                <option value="strength">Strength</option>
                <option value="stretching">Stretching</option>
                <option value="plyometrics">Plyometrics</option>
                <option value="cardio">Cardio</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Náradie</label>
              <input
                type="text"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan text-sm"
                placeholder="napr. Jednoručky"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Primárny sval (Cieľ)</label>
            <input
              type="text"
              value={primaryMuscles}
              onChange={(e) => setPrimaryMuscles(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan text-sm"
              placeholder="napr. Triceps"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors text-sm min-h-[44px]"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-brand-cyan text-brand-dark-navy px-6 py-2.5 rounded-xl font-bold shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 text-sm min-h-[44px]"
            >
              {isSubmitting ? "Ukladám..." : "Uložiť cvik"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
