"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ClientProfile } from '@/components/providers/AuthProvider';

export interface ExtendedClientProfile extends ClientProfile {
  assignments?: string[];
}

export function useClients() {
  const supabase = createClient();
  const [clients, setClients] = useState<ExtendedClientProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async (search: string = '', page: number = 0) => {
    setLoading(true);
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'klient')
      .order('full_name', { ascending: true });

    if (search.trim()) {
      query = query.ilike('full_name', `%${search.trim()}%`);
    }

    const pageSize = 20;
    const from = page * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error: fetchErr } = await query;
    if (fetchErr) {
      setError(`Chyba načítania klientov: ${fetchErr.message}`);
    } else if (data && data.length > 0) {
      // Fetch all assignments for the returned clients
      const clientIds = data.map((c: any) => c.id);
      
      // We fetch all assignments and all trainers to map their names
      const [{ data: assignments }, { data: trainers }] = await Promise.all([
        supabase.from('client_specialist_assignments').select('client_id, specialist_id').in('client_id', clientIds),
        supabase.from('profiles').select('id, full_name').eq('role', 'trener')
      ]);

      const trainerMap = new Map((trainers || []).map((t: any) => [t.id, t.full_name]));

      const enrichedClients = data.map((client: any) => {
        const theirAssignments = (assignments || [])
          .filter((a: any) => a.client_id === client.id)
          .map((a: any) => trainerMap.get(a.specialist_id))
          .filter(Boolean) as string[];
          
        return {
          ...client,
          assignments: theirAssignments
        };
      });

      setClients(enrichedClients);
    } else {
      setClients([]);
    }
    setLoading(false);
  };

  return {
    clients,
    loading,
    error,
    fetchClients
  };
}
