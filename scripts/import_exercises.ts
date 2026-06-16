import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Zmeň na reálne premenné z prostredia
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'VASE_SUPABASE_URL';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'VAS_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function importDataset() {
  const filePath = path.join(process.cwd(), 'exercises.json');
  if (!fs.existsSync(filePath)) {
    console.error(`Súbor ${filePath} sa nenašiel.`);
    return;
  }

  const rawData = fs.readFileSync(filePath, 'utf8');
  const exercises = JSON.parse(rawData);

  console.log(`Načítaných ${exercises.length} cvičení. Spúšťam import...`);

  // Supabase chunking (vkladanie po dávkach, napr. po 100 kusoch)
  const chunkSize = 100;
  for (let i = 0; i < exercises.length; i += chunkSize) {
    const chunk = exercises.slice(i, i + chunkSize);
    
    const mappedChunk = chunk.map((ex: any) => ({
      name: ex.name,
      exercise_force: ex.force || null,
      difficulty_level: ex.level,
      mechanic: ex.mechanic || null,
      equipment: ex.equipment || null,
      primary_muscles: ex.primaryMuscles || [],
      secondary_muscles: ex.secondaryMuscles || [],
      instructions: ex.instructions || [],
      category: ex.category,
      is_custom: false
    }));

    const { error } = await supabase.from('exercises').insert(mappedChunk);
    if (error) {
      console.error(`Chyba pri blocku ${i}:`, error.message);
    } else {
      console.log(`Importované: ${i} - ${i + mappedChunk.length}`);
    }
  }
  console.log('Import úspešne dokončený!');
}

importDataset();
