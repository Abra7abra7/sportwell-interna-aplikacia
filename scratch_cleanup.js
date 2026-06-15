const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function cleanup() {
  try {
    const env = fs.readFileSync('.env.local', 'utf8');
    const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
    const key = env.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1].trim();
    
    const supabase = createClient(url, key);
    
    console.log("Fetching templates...");
    const { data: templates, error } = await supabase.from('form_templates').select('id, title');
    
    if (error) {
      console.error("Error fetching templates:", error);
      return;
    }
    
    const keepTemplate = templates.find(t => t.title === "Základná diagnostika");
    if (!keepTemplate) {
      console.log("Základná diagnostika not found! Aborting to prevent deleting everything.");
      return;
    }
    
    const templatesToDelete = templates.filter(t => t.id !== keepTemplate.id);
    const idsToDelete = templatesToDelete.map(t => t.id);
    
    console.log(`Found ${idsToDelete.length} templates to delete.`);
    
    if (idsToDelete.length > 0) {
      console.log("Deleting associated client records...");
      const { error: recordsError } = await supabase.from('client_records').delete().in('template_id', idsToDelete);
      if (recordsError) console.error("Error deleting records:", recordsError);
      else console.log("Records deleted.");
      
      console.log("Deleting templates...");
      const { error: deleteError } = await supabase.from('form_templates').delete().in('id', idsToDelete);
      if (deleteError) console.error("Error deleting templates:", deleteError);
      else console.log("Templates deleted.");
    } else {
      console.log("No templates to delete.");
    }
    
  } catch (err) {
    console.error("Script error:", err);
  }
}

cleanup();
