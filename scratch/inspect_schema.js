const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspect() {
  const { data: ex } = await supabase.from('exercises').select('*').limit(1);
  if (ex && ex.length) console.log("Exercises columns:", Object.keys(ex[0]));
  
  const { data: tp } = await supabase.from('training_plans').select('*').limit(1);
  if (tp && tp.length) console.log("Training plans columns:", Object.keys(tp[0]));
}

inspect();
