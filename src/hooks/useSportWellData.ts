import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ClientProfile } from './useAuth';

export interface MedicalCard {
  id: string;
  client_id: string;
  created_by: string;
  type: 'ortoped' | 'fyzio' | 'masaz' | 'trening' | 'nutricia';
  pain_map_data: any[];
  form_data: Record<string, any>;
  created_at: string;
  profiles_client?: { full_name: string };
  profiles_creator?: { full_name: string; role: string };
}

export interface Appointment {
  id: string;
  client_id: string;
  staff_id: string;
  client_name?: string;
  service_name?: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled_by_client' | 'cancelled_by_staff' | 'no_show';
  cancelled_at?: string | null;
  profiles_client?: { full_name: string };
  profiles_staff?: { full_name: string; role: string };
}

export interface AuditLog {
  id: string;
  user_id: string;
  table_name: string;
  action: string;
  record_id: string;
  new_data: any;
  created_at: string;
}

export interface WorkoutPlan {
  id: string;
  client_id: string;
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

export function useSportWellData(triggerToast: (msg: string) => void) {
  const supabase = createClient();

  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [hasMoreClients, setHasMoreClients] = useState(true);
  const [medicalCards, setMedicalCards] = useState<MedicalCard[]>([]);
  const [clientRecords, setClientRecords] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [formTemplates, setFormTemplates] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);

  const fetchClients = async (search: string = '', page: number = 0, append: boolean = false) => {
    let query = supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });

    if (search.trim()) {
      query = query.ilike('full_name', `%${search.trim()}%`);
    }

    const pageSize = 20;
    const from = page * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error } = await query;
    if (error) {
      triggerToast(`Chyba načítania klientov: ${error.message}`);
      return;
    }

    if (data) {
      if (append) {
        setClients((prev) => [...prev, ...data]);
      } else {
        setClients(data);
      }
      setHasMoreClients(data.length === pageSize);
    }
  };

  const loadData = async (profile: ClientProfile) => {
    // 1. Fetch Clients list (for employees)
    if (profile.role !== 'klient') {
      await fetchClients('', 0, false);

      const { data: audits } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
      if (audits) setAuditLogs(audits);
    }

    // 2. Fetch Medical cards
    let query = supabase.from('medical_cards').select('*, profiles_client:client_id(full_name), profiles_creator:created_by(full_name, role)');
    if (profile.role === 'klient') {
      query = query.eq('client_id', profile.id);
    }
    const { data: cards } = await query;
    if (cards) setMedicalCards(cards as any);

    // 3. Fetch Bookings
    let bookingQuery = supabase.from('reservations').select('*, profiles_client:client_id(full_name), profiles_staff:staff_id(full_name, role)');
    if (profile.role === 'klient') {
      bookingQuery = bookingQuery.eq('client_id', profile.id);
    }
    const { data: appts } = await bookingQuery;
    if (appts) setAppointments(appts as any);

    // 4. Fetch Documents
    let docQuery = supabase.from('documents').select('*');
    if (profile.role === 'klient') {
      docQuery = docQuery.eq('client_id', profile.id);
    }
    const { data: docs, error: docsErr } = await docQuery;
    if (docs) setDocuments(docs);

    // Self-healing GDPR document log if missing
    if (profile.role === 'klient' && profile.gdpr_signed_at && (!docs || docs.length === 0) && !docsErr) {
      const safeName = (profile.full_name || 'Klient').replace(/\s+/g, '_');
      const { error: insertDocErr } = await supabase.from('documents').insert({
        client_id: profile.id,
        file_name: `GDPR_Suhlas_${safeName}.pdf`,
        storage_path: `gdpr/gdpr_${profile.id}.pdf`,
      });
      if (!insertDocErr) {
        const { data: docsRefetched } = await supabase.from('documents').select('*').eq('client_id', profile.id);
        if (docsRefetched) setDocuments(docsRefetched);
      }
    }

    // 5. Fetch Form Templates
    const { data: templates } = await supabase
      .from('form_templates')
      .select('*')
      .eq('is_active', true);
    if (templates) setFormTemplates(templates);

    // 6. Fetch Exercises from DB
    const { data: dbExercises } = await supabase.from('exercises').select('*');
    if (dbExercises) setExercises(dbExercises as any);

    // 7. Fetch Training Plans (workoutPlans)
    if (profile.role === 'klient') {
      await fetchClientWorkoutPlans(profile.id);
    }

    // 8. Fetch Client Records (diagnostics)
    let recordsQuery = supabase
      .from('client_records')
      .select('*, profiles_client:client_id(full_name), profiles_creator:created_by(full_name, role), form_templates:template_id(title, category)');
    if (profile.role === 'klient') {
      recordsQuery = recordsQuery.eq('client_id', profile.id);
    }
    const { data: dbRecords } = await recordsQuery;
    if (dbRecords) setClientRecords(dbRecords);
  };

  const fetchClientWorkoutPlans = async (clientId: string) => {
    const { data: dbPlans } = await supabase
      .from('training_plans')
      .select('*')
      .eq('client_id', clientId);
    if (dbPlans && dbPlans.length > 0) {
      const combined = dbPlans.flatMap((p: any) => p.plan_data || []);
      setWorkoutPlans(combined);
    } else {
      setWorkoutPlans([]);
    }
  };

  const prescribeExercise = async (
    creatorId: string,
    clientId: string,
    exerciseData: {
      exercise_title: string;
      sets: number;
      reps: number;
      tempo: string;
      pause: string;
      notes: string;
    }
  ) => {
    const newWorkout: WorkoutPlan = {
      id: `w-${Date.now()}`,
      client_id: clientId,
      exercise_title: exerciseData.exercise_title,
      sets: exerciseData.sets,
      reps: exerciseData.reps,
      tempo: exerciseData.tempo,
      pause: exerciseData.pause,
      notes: exerciseData.notes,
      completed: false,
    };

    const updatedPlans = [...workoutPlans, newWorkout];

    const { data: dbPlans } = await supabase
      .from('training_plans')
      .select('id')
      .eq('client_id', clientId)
      .limit(1);

    if (dbPlans && dbPlans.length > 0) {
      const { error } = await supabase
        .from('training_plans')
        .update({ plan_data: updatedPlans })
        .eq('id', dbPlans[0].id);

      if (!error) {
        setWorkoutPlans(updatedPlans);
        triggerToast('Cvičenie pridané do plánu v DB!');
      } else {
        triggerToast(`Chyba uloženia: ${error.message}`);
      }
    } else {
      const { error } = await supabase.from('training_plans').insert({
        client_id: clientId,
        created_by: creatorId,
        plan_data: updatedPlans,
      });

      if (!error) {
        setWorkoutPlans(updatedPlans);
        triggerToast('Nový tréningový plán bol vytvorený a uložený do DB!');
      } else {
        triggerToast(`Chyba vytvorenia: ${error.message}`);
      }
    }
  };

  const deleteClientExercise = async (clientId: string, workoutId: string) => {
    const updated = workoutPlans.filter((w) => w.id !== workoutId);

    const { data: dbPlans } = await supabase
      .from('training_plans')
      .select('id')
      .eq('client_id', clientId)
      .limit(1);

    if (dbPlans && dbPlans.length > 0) {
      const { error } = await supabase
        .from('training_plans')
        .update({ plan_data: updated })
        .eq('id', dbPlans[0].id);

      if (!error) {
        setWorkoutPlans(updated);
        triggerToast('Cvičenie bolo odstránené z plánu klienta.');
      } else {
        triggerToast(`Chyba: ${error.message}`);
      }
    }
  };

  const submitDiagnosis = async (
    creatorId: string,
    clientId: string,
    templateId: string,
    formData: Record<string, any>,
    profileRef: ClientProfile
  ) => {
    const { error } = await supabase.from('client_records').insert({
      client_id: clientId || creatorId,
      created_by: creatorId,
      template_id: templateId,
      form_data: formData,
    });

    if (!error) {
      triggerToast('Diagnostický záznam bol bezpečne uložený do databázy.');
      await loadData(profileRef);
      return true;
    } else {
      triggerToast(`Chyba uloženia: ${error.message}`);
      return false;
    }
  };

  const savePainPoint = async (creatorId: string, clientProfile: ClientProfile, painPoint: { region: string; intensity: number; notes: string }) => {
    const clientFyzioCard = medicalCards.find((c) => c.client_id === clientProfile.id && c.type === 'fyzio');

    if (clientFyzioCard) {
      const updatedPainList = [
        ...clientFyzioCard.pain_map_data.filter((p) => p.region !== painPoint.region),
        painPoint,
      ];

      const { error } = await supabase
        .from('medical_cards')
        .update({ pain_map_data: updatedPainList })
        .eq('id', clientFyzioCard.id);

      if (!error) {
        triggerToast('Bolesť bola zaznamenaná v databáze.');
        await loadData(clientProfile);
      }
    } else {
      const { error } = await supabase.from('medical_cards').insert({
        client_id: clientProfile.id,
        created_by: creatorId,
        type: 'fyzio',
        pain_map_data: [painPoint],
        form_data: {},
      });

      if (!error) {
        triggerToast('Záznam bolesti bol úspešne vytvorený.');
        await loadData(clientProfile);
      }
    }
  };

  return {
    clients,
    setClients,
    fetchClients,
    hasMoreClients,
    medicalCards,
    setMedicalCards,
    clientRecords,
    setClientRecords,
    appointments,
    setAppointments,
    auditLogs,
    setAuditLogs,
    documents,
    setDocuments,
    formTemplates,
    setFormTemplates,
    exercises,
    setExercises,
    workoutPlans,
    setWorkoutPlans,
    loadData,
    fetchClientWorkoutPlans,
    prescribeExercise,
    deleteClientExercise,
    submitDiagnosis,
    savePainPoint,
  };
}
