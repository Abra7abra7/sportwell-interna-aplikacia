import React, { useState } from 'react';

export interface ExerciseListItem {
  id: string;
  title: string;
}

export interface ClientListItem {
  id: string;
  full_name: string;
  role: string;
}

export interface WorkoutPlanItem {
  id: string;
  exercise_title: string;
  sets: number;
  reps: number;
  tempo: string;
  pause: string;
  notes: string;
  completed: boolean;
  rpe?: number;
  pain_level?: number;
}

interface PrescriptionProps {
  clients: ClientListItem[];
  selectedClientId: string;
  onChangeClient: (clientId: string) => void;
  exercises: ExerciseListItem[];
  workoutPlans: WorkoutPlanItem[];
  onPrescribe: (data: {
    exercise_title: string;
    sets: number;
    reps: number;
    tempo: string;
    pause: string;
    notes: string;
  }) => void;
  onDelete: (id: string) => void;
}

export default function Prescription({
  clients,
  selectedClientId,
  onChangeClient,
  exercises,
  workoutPlans,
  onPrescribe,
  onDelete,
}: PrescriptionProps) {
  const [exTitle, setExTitle] = useState(exercises[0]?.title || 'Mostík na jednej nohe');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [tempo, setTempo] = useState('3-0-3');
  const [pause, setPause] = useState('60s');
  const [notes, setNotes] = useState('');
  const [customTitle, setCustomTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;

    const finalTitle = exTitle === 'Iné custom cvičenie' ? customTitle : exTitle;
    onPrescribe({
      exercise_title: finalTitle || 'Custom cvičenie',
      sets,
      reps,
      tempo,
      pause,
      notes,
    });

    setNotes('');
    setCustomTitle('');
  };

  const filteredClients = clients.filter((c) => c.role === 'klient');
  const currentClient = clients.find((c) => c.id === selectedClientId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
      {/* Left: Form Builder */}
      <div className="md:col-span-1 bg-white rounded-2xl p-5 shadow-sm border border-gray-200/50 space-y-5 flex flex-col">
        <h3 className="font-bold text-brand-navy text-sm">Predpísať cvičenie</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold mb-1 text-gray-600">Klient</label>
            <select
              required
              value={selectedClientId}
              onChange={(e) => onChangeClient(e.target.value)}
              className="w-full bg-brand-off-white border p-2 rounded-lg outline-none min-h-[44px]"
            >
              <option value="">-- Vyberte klienta --</option>
              {filteredClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-gray-600">Cvičenie z knižnice</label>
            <select
              value={exTitle}
              onChange={(e) => setExTitle(e.target.value)}
              className="w-full bg-brand-off-white border p-2 rounded-lg outline-none min-h-[44px]"
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.title}>
                  {ex.title}
                </option>
              ))}
              <option value="Iné custom cvičenie">-- Iné custom cvičenie --</option>
            </select>
          </div>

          {exTitle === 'Iné custom cvičenie' && (
            <div>
              <label className="block font-semibold mb-1 text-gray-600">Custom názov cvičenia</label>
              <input
                type="text"
                placeholder="Názov cvičenia"
                required
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none min-h-[44px]"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-gray-600">Série</label>
              <input
                type="number"
                min="1"
                value={sets}
                onChange={(e) => setSets(parseInt(e.target.value) || 3)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none min-h-[44px]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-gray-600">Opakovania</label>
              <input
                type="number"
                min="1"
                value={reps}
                onChange={(e) => setReps(parseInt(e.target.value) || 10)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none min-h-[44px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-gray-600">Tempo</label>
              <input
                type="text"
                value={tempo}
                onChange={(e) => setTempo(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none min-h-[44px]"
                placeholder="napr. 3-0-3"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-gray-600">Pauza</label>
              <input
                type="text"
                value={pause}
                onChange={(e) => setPause(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none min-h-[44px]"
                placeholder="napr. 60s"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-gray-600">Poznámka / inštrukcie</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-brand-off-white border p-2 rounded-lg outline-none h-16"
              placeholder="napr. dbať na postavenie panvy..."
            />
          </div>

          <button
            type="submit"
            disabled={!selectedClientId}
            className="w-full py-2.5 min-h-[44px] bg-brand-cyan text-brand-dark-navy font-bold rounded-xl hover:bg-brand-hover-cyan transition-colors disabled:opacity-50"
          >
            Uložiť do plánu v DB
          </button>
        </form>
      </div>

      {/* Right: Selected client plan */}
      <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-4 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-brand-navy">Aktuálny plán klienta</h3>
          <p className="text-gray-400 text-xs">
            Prehľad a správa cvičení pre klienta: <strong>{currentClient?.full_name || 'Nevybraný'}</strong>
          </p>

          {!selectedClientId ? (
            <p className="text-gray-500 italic p-6 text-center">Vyberte klienta na zobrazenie a úpravu plánu.</p>
          ) : workoutPlans.length === 0 ? (
            <p className="text-gray-500 italic p-6 text-center">Klient zatiaľ nemá predpísaný žiadny plán.</p>
          ) : (
            <div className="space-y-3 mt-4">
              {workoutPlans.map((w) => (
                <div key={w.id} className="flex justify-between items-center bg-brand-off-white/50 p-4 rounded-xl border gap-4">
                  <div>
                    <strong className="text-sm text-brand-navy">{w.exercise_title}</strong>
                    <div className="text-gray-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Série: <strong>{w.sets}</strong></span>
                      <span>Opakovania: <strong>{w.reps}</strong></span>
                      <span>Tempo: <strong>{w.tempo}</strong></span>
                      <span>Pauza: <strong>{w.pause}</strong></span>
                    </div>
                    {w.notes && <p className="text-[11px] text-gray-400 mt-1 italic">Poznámka: {w.notes}</p>}
                    {w.completed && (
                      <div className="mt-2 text-[10px] text-emerald-700 font-semibold bg-emerald-50 p-1.5 rounded">
                        ✓ Splnené (RPE: {w.rpe}/10, Bolesť: {w.pain_level}/10)
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onDelete(w.id)}
                    className="px-3 py-1.5 min-h-[44px] border border-red-200 hover:bg-red-50 text-red-600 rounded-xl font-bold transition-all text-xs"
                  >
                    Zmazať
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
