const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  const email = 'stancikmarian8@gmail.com';
  
  const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).single();
  console.log("Profile:", profile);

  const { data: inv } = await supabase.from('employee_invitations').select('*').eq('email', email).single();
  console.log("Invitation:", inv);
}
checkUser();
