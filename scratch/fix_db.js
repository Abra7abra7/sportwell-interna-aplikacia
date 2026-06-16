const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';
envLocal.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUser() {
  const email = 'stancikmarian8@gmail.com';
  
  // Zistenie ID
  const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).single();
  console.log("Current Profile:", profile);

  if (profile && profile.full_name === 'Nový Používateľ') {
    const { error } = await supabase.from('profiles').update({ full_name: 'Marian Stancik' }).eq('email', email);
    console.log("Update error?", error);
    console.log("Updated to Marian Stancik!");
  }
}
fixUser();
