import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Načítaj premenné prostredia z .env.local
dotenv.config({ path: '.env.local' });

// Nastav tvoje premenné (môžu byť aj v .env a čítané cez dotenv)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Chyba: Chýba NEXT_PUBLIC_SUPABASE_URL alebo zodpovedajúci API kľúč v .env.local súbore.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

const GITHUB_JSON_URL = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json';
const GITHUB_MEDIA_BASE_URL = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/';

async function run() {
  console.log('Stiahujem dataset z GitHubu...');
  const response = await fetch(GITHUB_JSON_URL);
  
  if (!response.ok) {
    console.error('Chyba pri sťahovaní datasetu:', response.statusText);
    return;
  }
  
  const exercises = await response.json();
  console.log(`Úspešne stiahnutých ${exercises.length} cvikov. Pripravujem mapovanie dát...`);

  // Namapujeme dáta do našej databázovej štruktúry
  const mappedData = exercises.map((ex: any) => ({
    // nepoužijeme ex.id lebo naša DB používa uuid, radšej necháme vygenerovať defaultný
    name: ex.name,
    category: ex.category,
    equipment: ex.equipment,
    primary_muscles: [ex.target], // konvertujeme na array
    secondary_muscles: ex.secondary_muscles || [],
    instructions: ex.instructions?.en ? [ex.instructions.en] : [],
    difficulty_level: 'intermediate', // default fallback, dataset toto neobsahuje
    image_url: ex.image ? `${GITHUB_MEDIA_BASE_URL}${ex.image}` : null,
    gif_url: ex.gif_url ? `${GITHUB_MEDIA_BASE_URL}${ex.gif_url}` : null,
    is_custom: false
  }));

  console.log('Rozdeľujem do menších dávok (batching) pre bezpečný insert...');
  
  const BATCH_SIZE = 100;
  for (let i = 0; i < mappedData.length; i += BATCH_SIZE) {
    const batch = mappedData.slice(i, i + BATCH_SIZE);
    
    const { error } = await supabase
      .from('exercises')
      .insert(batch);
      
    if (error) {
      console.error(`Chyba pri vkladaní dávky (index ${i}):`, error);
    } else {
      console.log(`Vložená dávka ${i} - ${i + batch.length}`);
    }
  }

  console.log('✅ Import cvičení úspešne dokončený!');
}

run().catch(console.error);
