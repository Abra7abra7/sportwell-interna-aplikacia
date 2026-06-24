"use server";

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const inviteClientSchema = z.object({
  email: z.string().email('Neplatný formát e-mailovej adresy.'),
  firstName: z.string().min(2, 'Meno musí mať aspoň 2 znaky.').max(50),
  lastName: z.string().min(2, 'Priezvisko musí mať aspoň 2 znaky.').max(50),
  phone: z.string().max(30).optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
});

export async function deletePendingClientAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Neautorizovaný prístup");

  const { error } = await supabase.from('client_invitations').delete().eq('id', id);
  if (error) {
    console.error("Failed to delete pending client:", error);
    throw new Error(error.message);
  }

  revalidatePath('/klienti');
}

export async function assignSpecialistAction(clientId: string, specialistId: string, assignedBy: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Neautorizovaný prístup");

  const { error } = await supabase.from('client_specialist_assignments').insert({
    client_id: clientId,
    specialist_id: specialistId,
    assigned_by: assignedBy
  });

  if (error) {
    console.error("Failed to assign specialist:", error);
    throw new Error(error.message);
  }

  revalidatePath('/klienti');
}

export async function removeAssignmentAction(clientId: string, specialistId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Neautorizovaný prístup");

  const { error } = await supabase.from('client_specialist_assignments')
    .delete()
    .eq('client_id', clientId)
    .eq('specialist_id', specialistId);

  if (error) {
    console.error("Failed to remove assignment:", error);
    throw new Error(error.message);
  }

  revalidatePath('/klienti');
}

export async function inviteClientAction(data: {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
}) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Neautorizovaný prístup");
  }

  // Overenie oprávnení v databáze (len admin, majitel, recepcia)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'majitel', 'recepcia'].includes(profile.role)) {
    throw new Error("Nedostatočné oprávnenia pre túto akciu.");
  }

  // Validácia vstupu
  const validation = inviteClientSchema.safeParse(data);
  if (!validation.success) {
    throw new Error("Neplatné vstupné údaje: " + validation.error.issues.map(e => e.message).join(', '));
  }

  const { email, firstName, lastName, phone, address } = validation.data;

  // 1. Zápis do čakárne (client_invitations)
  const { error: dbError } = await supabase.from('client_invitations').insert({
    email,
    first_name: firstName,
    last_name: lastName,
    phone: phone || '',
    address: address || '',
    created_by: user.id
  });

  if (dbError) {
    console.error("Failed to insert into client_invitations:", dbError);
    throw new Error("Tento e-mail už existuje v čakárni alebo nastala chyba databázy.");
  }

  // 2. Odoslanie pozvánky cez Supabase Admin Auth
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseServiceKey) {
    try {
      const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          first_name: firstName,
          last_name: lastName
        }
      });

      if (inviteError) {
        if (inviteError.status === 422 || inviteError.message.includes('already been registered')) {
          console.warn(`Používateľ ${email} už existuje, pozvánka sa neodosiela.`);
        } else {
          console.error("Email invite failed:", inviteError);
        }
      }
    } catch (err) {
      console.error("Failed to call invite admin API:", err);
    }
  }

  revalidatePath('/klienti');
}
