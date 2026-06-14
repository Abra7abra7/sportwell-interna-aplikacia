const { createClient } = require('@supabase/supabase-js');

const url = 'https://pjzhoqussygulucpexlt.supabase.co';
const key = 'sb_publishable_AsEleiSKyYgKhKwmZnn48g_gQ6wgVU_';
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('profiles').select('id, full_name, email, role');
  if (error) {
    console.error('Error fetching profiles:', error);
  } else {
    console.log('Profiles:');
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
