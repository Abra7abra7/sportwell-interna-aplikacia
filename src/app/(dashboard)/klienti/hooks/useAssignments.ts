"use client";

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ClientProfile } from '@/components/providers/AuthProvider';
import { assignSpecialistAction, removeAssignmentAction } from '../actions';

export function useAssignments() {
  const supabase = createClient();
  const [specialists, setSpecialists] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSpecialists = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'trener')
      .order('full_name');
    if (data) {
      setSpecialists(data);
    }
    setLoading(false);
  };

  const fetchAssignedSpecialists = async (clientId: string) => {
    const { data } = await supabase
      .from('client_specialist_assignments')
      .select('specialist_id')
      .eq('client_id', clientId);
    
    return data?.map((d: any) => d.specialist_id) || [];
  };

  const assignSpecialist = async (clientId: string, specialistId: string, assignedBy: string) => {
    await assignSpecialistAction(clientId, specialistId, assignedBy);
  };

  const removeAssignment = async (clientId: string, specialistId: string) => {
    await removeAssignmentAction(clientId, specialistId);
  };

  return {
    specialists,
    loading,
    fetchSpecialists,
    fetchAssignedSpecialists,
    assignSpecialist,
    removeAssignment
  };
}
