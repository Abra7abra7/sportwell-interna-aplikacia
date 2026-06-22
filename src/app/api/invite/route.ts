import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, firstName, lastName } = await request.json();

    if (!email || !firstName) {
      return NextResponse.json({ error: 'Chýbajúce povinné údaje' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Chýba Supabase konfigurácia v prostredí');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Vytvorenie admin klienta so service_role kľúčom
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Pozvanie používateľa pomocou Supabase Auth
    // Toto automaticky odošle email podľa šablóny 'Invite User' v Supabase
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        first_name: firstName,
        last_name: lastName
      }
    });

    if (error) {
      // Ak používateľ už existuje, inviteUserByEmail vyhodí chybu 422.
      // V takom prípade to môžeme ignorovať, lebo klient už má účet.
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
