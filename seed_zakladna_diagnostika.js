const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) env[key.trim()] = val.join('=').trim().replace(/"/g, '');
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const schema = {
  steps: [
    {
      id: "step1",
      title: "Vstupná anamnéza",
      description: "Vaše ciele a požiadavky na charakter a frekvenciu tréningov",
      fields: [
        {
          id: "q1_dozvedeli_sa",
          type: "radio",
          label: "1. Ako ste sa o nás dozvedeli?",
          required: true,
          options: ["Cez Facebook", "Cez Instagram", "Cez webovú stránku", "Odporúčanie", "Osobné referencie", "Iné (uveďte)"]
        },
        {
          id: "q1_dozvedeli_sa_ine",
          type: "text",
          label: "Sem uveďte",
          required: false,
          conditionalLogic: { dependsOn: "q1_dozvedeli_sa", value: "Iné (uveďte)" }
        },
        {
          id: "q2_ciele",
          type: "checkbox",
          label: "2. Charakterizujte vaše ciele (prečo ste prišli):",
          required: true,
          options: ["Schudnúť", "Vyrysovať", "Nabrať svalovú hmotu", "Zlepšiť kondíciu", "Kompenzovať pracovné zaťaženie (psychohygiena)", "Športová špecializácia", "Zlepšenie držania tela", "Riešiť pooperačné stavy", "Iné (uveďte)"]
        },
        {
          id: "q2_ciele_ine",
          type: "text",
          label: "Sem napíšte dôvod iné",
          required: false,
          conditionalLogic: { dependsOn: "q2_ciele", value: "Iné (uveďte)" }
        },
        {
          id: "q3_vyzivovy_poradca",
          type: "radio",
          label: "3. Ak ste uviedli ako Váš cieľ (resp. aspoň jeden z Vašich cieľov) schudnutie alebo vyrysovanie, využívate zároveň aj služby výživového poradcu?",
          required: false,
          options: ["Áno, chcem", "Nie, nemám záujem"],
          conditionalLogic: { dependsOn: "q2_ciele", value: "Schudnúť" } // simplified condition, ideally checking arrays
        },
        {
          id: "q4_cas_denne",
          type: "text",
          label: "4. Koľko času denne ste ochotná/ý venovať svojim cieľom?*",
          required: true,
          placeholder: "Sem napíšte vašu odpoveď"
        },
        {
          id: "q5_dni_v_tyzdni",
          type: "text",
          label: "5. Koľkokrát do týždňa chcete cvičiť? Aké dni/čas by Vám vyhovovali?*",
          required: true,
          placeholder: "Sem napíšte vašu odpoveď"
        },
        {
          id: "q6_vysledky_kedy",
          type: "text",
          label: "6. Kedy by ste si priali vidieť výsledky? *",
          required: true,
          placeholder: "Sem napíšte vašu odpoveď"
        }
      ]
    },
    {
      id: "step2",
      title: "Zdravotná anamnéza",
      description: "Vyplnenie časti II. dotazníka a udelenie súhlasu na spracovanie osobných údajov týkajúcich sa zdravotného stavu a diagnostiky vnútorného prostredia, je dobrovoľné. Prosím, zoberte však na vedomie, že v prípade nezodpovedania nasledovných otázok uvedených v časti II. dotazníka, neabsolvovania diagnostiky a neudelenia súhlasu, Vám nebudeme môcť poskytnúť služby, ktoré by zohľadňovali Váš aktuálny zdravotný stav a zdravotné obmedzenia, čo môže znížiť kvalitu a efektivitu poskytovaných služieb, a zároveň zvýšiť riziko vzniku zranenia, či zhoršenia Vášho zdravotného stavu.",
      fields: [
        {
          id: "q7_zdravotne_problemy",
          type: "checkbox",
          label: "1. Označte, ak trpíte niektorými z nasledujúcich problémov",
          required: false,
          options: ["Srdcovou arytmiou", "Vysokým/nízkym krvným tlakom", "Alergiou", "Zvýšenou hladinou cholesterolu", "Dysfunkciou štítnej žľazy", "Astmou", "Opuchmi", "Migrénou", "Opakovanými krátkodobými stratami vedomia", "Reumou", "Bolesťami kĺbov", "Nespavosťou", "Epilepsiou", "Cukrovkou", "Závratmi", "Skoliózou", "Diastázou", "Pruhom", "Iné (uveďte)"]
        },
        {
          id: "q7_zdravotne_problemy_ine",
          type: "text",
          label: "Sem uveďte váš iný dôvod",
          required: false,
          conditionalLogic: { dependsOn: "q7_zdravotne_problemy", value: "Iné (uveďte)" }
        },
        {
          id: "q8_dlhodobe_problemy",
          type: "checkbox",
          label: "2. Mali ste niekedy dlhodobé problémy:",
          required: false,
          options: ["Chrbtice", "Chodidiel", "Bedier", "Svalov", "Kolien", "Členkov", "Ramien", "Iné (uveďte)"]
        },
        {
          id: "q8_dlhodobe_problemy_ine",
          type: "text",
          label: "Sem bližšie špecifikujte Váš problém",
          required: false,
          conditionalLogic: { dependsOn: "q8_dlhodobe_problemy", value: "Iné (uveďte)" }
        },
        {
          id: "q9_operacie",
          type: "checkbox",
          label: "3. Mali ste niekedy operačný zákrok?",
          required: false,
          options: ["Členka", "Kolena", "Bedra", "Chrbtice", "Ramien", "Iné (uveďte)"]
        },
        {
          id: "q9_operacie_ine",
          type: "text",
          label: "Aký iný operačný zákrok ste absolvovali?",
          required: false,
          conditionalLogic: { dependsOn: "q9_operacie", value: "Iné (uveďte)" }
        },
        {
          id: "q10_urazy",
          type: "radio",
          label: "4. Mali ste niekedy zlomeninu, výron, vytknutie alebo iný úraz?",
          required: false,
          options: ["Áno", "Nie"]
        },
        {
          id: "q10_urazy_specifikacia",
          type: "textarea",
          label: "Ak ste uviedli áno, bližšie špecifikujte vaše zranenie.",
          required: false,
          conditionalLogic: { dependsOn: "q10_urazy", value: "Áno" }
        },
        {
          id: "q11_tehotenstvo",
          type: "radio",
          label: "5. Ste alebo boli ste za posledných 12 mesiacov tehotná?",
          required: false,
          options: ["Áno", "Nie"]
        },
        {
          id: "q12_lieky",
          type: "radio",
          label: "6. Užívate pravidelne lieky?",
          required: false,
          options: ["Áno", "Nie"]
        },
        {
          id: "q12_lieky_specifikacia",
          type: "text",
          label: "Ak ste vyššie odpovedali áno, uveďte aké lieky užívate.",
          required: false,
          conditionalLogic: { dependsOn: "q12_lieky", value: "Áno" }
        },
        {
          id: "q13_obmedzenia",
          type: "radio",
          label: "7. Je Vám v súčasnej dobe, na základe odporučenia lekára alebo iného špecialistu v zdravotnom odbore, obmedzená alebo zakázaná akákoľvek pohybová aktivita?",
          required: false,
          options: ["Áno", "Nie"]
        },
        {
          id: "q13_obmedzenia_specifikacia",
          type: "textarea",
          label: "Ak ste vyššie odpovedali áno, aká a z akých dôvodov?",
          required: false,
          conditionalLogic: { dependsOn: "q13_obmedzenia", value: "Áno" }
        }
      ]
    },
    {
      id: "step3",
      title: "Životný štýl a doplňujúce informácie",
      description: "",
      fields: [
        {
          id: "q14_sportujete",
          type: "radio",
          label: "1. Športujete?",
          required: false,
          options: ["Áno", "Nie"]
        },
        {
          id: "q14_sportujete_specifikacia",
          type: "text",
          label: "Ak ste vyššie uviedol možnosť áno, uveďte akému športu sa venujete.",
          required: false,
          conditionalLogic: { dependsOn: "q14_sportujete", value: "Áno" }
        },
        {
          id: "q15_sport_minulost",
          type: "radio",
          label: "2. Športovali ste v minulosti?",
          required: false,
          options: ["Áno", "Nie"]
        },
        {
          id: "q15_sport_minulost_specifikacia",
          type: "text",
          label: "Ak ste vyššie uviedol áno, o aký šport išlo?",
          required: false,
          conditionalLogic: { dependsOn: "q15_sport_minulost", value: "Áno" }
        },
        {
          id: "q16_vyska",
          type: "number",
          label: "3. Vaša výška? (cm)",
          required: false
        },
        {
          id: "q17_hmotnost",
          type: "number",
          label: "4. Vaša hmotnosť? (kg)",
          required: false
        },
        {
          id: "q18_zamestnanie",
          type: "checkbox",
          label: "5. Aké je vaše zamestnanie?",
          required: false,
          options: ["sedavé", "fyzicky náročné", "manuálne", "psychicky náročné"]
        },
        {
          id: "q19_spanok",
          type: "number",
          label: "6. V priemere koľko hodín denne spávate?",
          required: false
        },
        {
          id: "q20_strava_frekvencia",
          type: "grid",
          label: "7. Koľkokrát týždenne jete či pijete?",
          required: false,
          rows: ["Zeleninu", "Sladkosti", "Mäso", "Vyprážané jedlá", "Alkohol", "Cestoviny"]
        },
        {
          id: "q21_denne_jedlo",
          type: "text",
          label: "8. Ako často denne jete?",
          required: false
        },
        {
          id: "q22_denne_pitie",
          type: "text",
          label: "9. Ako často denne pijete?",
          required: false
        },
        {
          id: "q23_dieta",
          type: "radio",
          label: "10. Držali ste niekedy diétu?",
          required: false,
          options: ["Áno", "Nie"]
        },
        {
          id: "q23_dieta_specifikacia",
          type: "text",
          label: "Ak ste vyššie odpovedal áno, uveďte o akú diétu išlo.",
          required: false,
          conditionalLogic: { dependsOn: "q23_dieta", value: "Áno" }
        },
        {
          id: "q24_vyzivovy_poradca_znova",
          type: "radio",
          label: "11. Chcete využívať zároveň aj služby výživového poradcu?",
          required: false,
          options: ["Áno, chcem", "Nie, nemám záujem"]
        },
        {
          id: "q25_inbody_sken",
          type: "file_upload",
          label: "12. Priložte InBody sken alebo fotku postavy (voliteľné)",
          required: false
        }
      ]
    }
  ]
};

async function seed() {
  console.log("Seeding Základná diagnostika...");
  // Let's check if it exists
  const { data, error } = await supabase
    .from('form_templates')
    .select('id')
    .eq('title', 'Základná diagnostika')
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is no rows
    console.error("Error fetching template:", error);
    return;
  }

  if (data) {
    // Update existing
    const { error: updateError } = await supabase
      .from('form_templates')
      .update({ schema: schema })
      .eq('id', data.id);
    
    if (updateError) {
      console.error("Update error:", updateError);
    } else {
      console.log("Template updated successfully.");
    }
  } else {
    console.log("Template not found, run insert instead? (Actually we assume it exists based on UI).");
    // Just in case:
    const { error: insertError } = await supabase
      .from('form_templates')
      .insert({
        title: "Základná diagnostika",
        category: "Diagnostika",
        is_active: true,
        schema: schema
      });
    if (insertError) {
      console.error("Insert error:", insertError);
    } else {
      console.log("Template inserted successfully.");
    }
  }
}

seed();
