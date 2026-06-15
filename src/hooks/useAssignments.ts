"use client";

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ClientProfile } from '@/components/providers/AuthProvider';

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
    await supabase.from('client_specialist_assignments').insert({
      client_id: clientId,
      specialist_id: specialistId,
      assigned_by: assignedBy
    });
  };

  const removeAssignment = async (clientId: string, specialistId: string) => {
    await supabase.from('client_specialist_assignments')
      .delete()
      .eq('client_id', clientId)
      .eq('specialist_id', specialistId);
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
