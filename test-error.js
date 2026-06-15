import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pjzhoqussygulucpexlt.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('documents').insert({
    client_id: '50bb64ee-b400-4161-bb39-bd9e101ccba0',
    file_name: 'test.html',
    storage_path: 'test/path'
  });
  console.log('Error details:', error);
}

test();
