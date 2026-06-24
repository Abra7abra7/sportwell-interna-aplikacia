import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email('Neplatný formát e-mailovej adresy.'),
  firstName: z.string().min(2, 'Meno musí mať aspoň 2 znaky.').max(50),
  lastName: z.string().max(50).optional().or(z.literal('')),
});

export async function POST(request: Request) {
  try {
    // 1. Overenie relácie prihláseného používateľa
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Neautorizovaný prístup' }, { status: 401 });
    }

    // 2. Overenie oprávnení v databáze (len admin, majitel, recepcia)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !['admin', 'majitel', 'recepcia'].includes(profile.role)) {
      return NextResponse.json({ error: 'Nedostatočné oprávnenia' }, { status: 403 });
    }

    // 3. Validácia vstupných údajov
    const body = await request.json();
    const validation = inviteSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Neplatné vstupné údaje', 
        details: validation.error.format() 
      }, { status: 400 });
    }

    const { email, firstName, lastName } = validation.data;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Chýba Supabase konfigurácia v prostredí');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Vytvorenie admin klienta so service_role kľúčom
    const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Pozvanie používateľa pomocou Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        first_name: firstName,
        last_name: lastName || ''
      }
    });

    if (error) {
      // Ak používateľ už existuje, inviteUserByEmail vyhodí chybu 422.
      if (error.status === 422 || error.message.includes('already been registered')) {
        console.warn(`Používateľ ${email} už existuje, pozvánka sa neodosiela.`);
        return NextResponse.json({ success: true, warning: 'User already exists' });
      }
      
      console.error('Supabase admin invite chyba:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (error: any) {
    console.error('Chyba pri odosielaní pozvánky:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

