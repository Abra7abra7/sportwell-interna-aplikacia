<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Technická dokumentácia & Vývojárska príručka (SportWell v3.0)

Tento dokument slúži ako **jediný zdroj pravdy (Single Source of Truth)** pre vývojárov a AI agentov. Popisuje kompletnú architektúru, dátový model, bezpečnostné politiky (RLS/RBAC), vývojové konvencie a detailný postup pre rozširovanie aplikácie o nové moduly.

---

## 1. ARCHITEKTÚRA & TECHNOLOGICKÝ STACK

Aplikácia SportWell funguje ako **Progressive Web App (PWA)** navrhnutá s primárnym zameraním na mobilné zariadenia (Mobile-First).

*   **Frontend:** React 19, Next.js 16.2.7. 
    *   *Dôležité:* Spúšťa sa vo Webpack režime (`--webpack` prepínač) pre zaistenie spätnej kompatibility s PWA a offline pluginmi.
*   **Styling:** Tailwind CSS v4.
    *   Využíva lokálne načítané písmo *Noto Sans* (latinka + rozšírená latinka).
    *   Dizajn implementuje moderný "glassmorphism", čisté rozhrania, zaoblené tvary a jemné prechody s dôrazom na prémiový vzhľad.
*   **Backend & Databáza:** Supabase (PostgreSQL).
    *   Zabezpečuje správu používateľov (Auth via passwordless OTP), relačnú databázu a úložisko súborov (Storage Buckets).
*   **PDF Generovanie:** Server-side generovanie PDF dokumentov pomocou knižnice `pdfmake` v prostredí Server Actions na elimináciu klientskeho zaťaženia a ochranu citlivých lekárskych údajov.

---

## 2. VIZUÁLNA IDENTITA & BRAND MANUAL

Všetky prvky rozhrania striktne dodržiavajú farebnú schému a typografické pravidlá špecifikované v `src/app/globals.css`.

### CSS Premenné pre Farby a Typografiu:
*   `--font-sans`: *Noto Sans* (systémové bezpätkové písmo).
*   `--color-brand-navy` (`#0A192F`): Tmavomodrá, základný tón pre texty, nadpisy a dôležité tlačidlá.
*   `--color-brand-dark-navy` (`#020C1B`): Extra tmavomodrá pre pozadia panelov a login rozhrania.
*   `--color-brand-cyan` (`#00F0FF`): Svietiaca azúrová pre interaktívne stavy, akcenty a aktívne prvky.
*   `--color-brand-light-cyan` (`#D3FAFF`): Jemná svetloazúrová pre alternatívne pozadia tlačidiel a svetlé stavy.
*   `--color-brand-off-white` (`#F7FAFC`): Neutrálne svetlé pozadie pre klientske a administratívne rozhranie dashboardu.

### Pravidlá pre Mobilné Rozhranie (UX & PWA):
1.  **Eliminácia zoomu na iOS:** HTML hlavička obsahuje viewport meta tag s parametrom `user-scalable=no`, čím zabraňuje automatickému zoomovaniu pri kliknutí do vstupných polí na zariadeniach iPhone.
2.  **Minimálna veľkosť dotykovej plochy:** Všetky interaktívne a klikateľné prvky (tlačidlá, odkazy, ikony) musia spĺňať minimálny rozmer **44x44px** pre bezproblémové ovládanie prstom.
3.  **Mobilná navigácia:** Pre rolu `klient` sa na mobilných zariadeniach zobrazuje spodná fixná navigačná lišta (Bottom Navigation Bar) obsahujúca položky: *Home, Moje Cviky, Dokumenty, Profil*. 
    *   *Dôležité:* Spodná časť hlavného kontajnera v `layout.tsx` musí mať dostatočný offset (napr. triedu `pb-32`), aby spodná lišta neprekrývala funkčný obsah stránky.
4.  **No Hover-only interaction:** Žiadna kľúčová akcia ani informácia nesmie byť prístupná výhradne po nabehnutí myšou (hover), pretože mobilné zariadenia hover stavy nepodporujú.

---

## 3. DÁTOVÝ MODEL & POSTGRESQL SCHÉMA

Databáza v Supabase pozostáva z nasledujúcich tabuliek a štruktúr v schéme `public`:

### A. Profily (`public.profiles`)
Reprezentuje registrovaných používateľov (prepojené s `auth.users` pomocou cudzieho kľúča `id`).
*   `id` (uuid, PK): ID používateľa z `auth.users`.
*   `email` (text): Unikátna e-mailová adresa.
*   `full_name` (text): Celé meno a priezvisko.
*   `phone` (text): Telefónne číslo.
*   `role` (enum `user_role`): Určuje rolu používateľa:
    *   `'admin'`, `'majitel'`: Správa celého systému a personálu.
    *   `'recepcia'`: Registrácie klientov, čakáreň a správa zmlúv.
    *   `'trener'`, `'fitness_trener'`, `'fyzioterapeut'`, `'maser'`, `'lekar'`, `'nutricny_poradca'`: Špecialisti starajúci sa o priradených klientov.
    *   `'klient'`: Koncoví zákazníci.
*   `is_active` (boolean): Prepínač aktivity konta. Neaktívne kontá nemajú prístup do systému.
*   `gdpr_signed_at` (timestamp with time zone): Dátum podpisu GDPR zmluvy. Ak je `NULL`, používateľ je pri prihlásení presmerovaný na Onboarding (`/gdpr`).
*   `metadata` (jsonb): Flexibilné dáta (adresa, narodeniny, špecifické nastavenia, GDPR súhlasy ako `marketingConsent`, `metaConsent`, `diagnosticsConsent`).

### B. Invitations a Čakáreň
*   **`public.employee_invitations`**: Pozvánky pre personál vytvorené administrátorom. Systém na ich základe priraďuje správnu rolu pri registrácii nového zamestnanca.
*   **`public.client_invitations`** (Čakáreň): Evidencia predregistrovaných klientov recepciou. Pri prvej fyzickej návšteve recepcia vyplní meno, priezvisko, e-mail a telefón klienta do tejto čakárne. Klient sa následne prihlási, systém jeho e-mail spáruje a predvyplní registračný formulár na stránke `/gdpr`.

### C. Priradenia Klient-Špecialista (`public.client_specialist_assignments`)
Mapovacia tabuľka určujúca vzťahy medzi klientmi a terapeutmi/trénermi.
*   `client_id` (uuid): Odkaz na `profiles.id` (rola klient).
*   `specialist_id` (uuid): Odkaz na `profiles.id` (rola špecialistu).
*   `assigned_by` (uuid): Odkaz na profily, kto priradenie vytvoril.

### D. Diagnostiky a Formuláre
*   **`public.form_templates`**: Šablóny pre lekárske a tréningové diagnostiky. Obsahujú stĺpce `name`, `description`, `fields` (jsonb schema pre dynamické generovanie formulárov) a `created_by`.
*   **`public.client_records`**: Vyplnené diagnostické záznamy. Obsahujú stĺpce `client_id`, `template_id`, `record_data` (jsonb s hodnotami z formulára), `created_by` a `created_at`.
*   **Storage Bucket `client_records_files`**: Súkromný bucket na ukladanie príloh k diagnostikám (fotky tela, skeny z InBody a pod.).

### E. Tréningové Plány a Cviky
*   **`public.exercises`**: Databáza cvikov. Stĺpce `name`, `description`, `category` (prehľad kategórií), `media_url` (odkaz na video/gif z bucketu `exercise_images`), `is_custom` (či ide o vlastný cvik trénera) a `created_by`.
*   **`public.training_plans`**: Tréningové plány klientov. Stĺpce `client_id`, `name`, `description`, `warmup_notes` (poznámky k rozcvičke) a `created_by`.
*   **`public.plan_exercises`**: Prepojovacia tabuľka pre cviky zaradené do konkrétneho plánu. Obsahuje parametre:
    *   `sets` (série), `reps` (opakovania).
    *   `tempo` (napr. "3-0-1-0" tempo vykonávania cviku).
    *   `rpe` (relatívne úsilie, stupnica 1-10).
    *   `rest_between_exercises` (pauza po dokončení cviku).
    *   `order_index` (poradie v pláne).

### F. Dokumenty (`public.documents`)
Evidencia a ukladanie PDF dokumentov (GDPR dohody, zmluvy o zapožičaní, exportované diagnostické správy).
*   `client_id` (uuid): Komu dokument patrí.
*   `name` (text): Názov dokumentu (napr. "GDPR_Zmluva.pdf").
*   `file_path` (text): Relatívna cesta k súboru v buckete.
*   `created_by` (uuid): Kto dokument vytvoril/vygeneroval.
*   **Storage Bucket `client_documents`**: Súkromný bucket, kde sú fyzicky uložené PDF súbory rozdelené do priečinkov podľa UUID klienta (`client_documents/<client_id>/<file_name>`).

### G. Audit Logs (`public.audit_logs`)
Automatizované zaznamenávanie zmien (mutácií) v kritických tabuľkách (`profiles`, `role_permissions`, `training_plans`, `client_records`) pomocou databázových triggerov `AFTER INSERT OR UPDATE OR DELETE`.
*   Zaznamenáva tabuľku, ID záznamu, typ akcie (`INSERT`/`UPDATE`/`DELETE`), staré dáta (`old_data`), nové dáta (`new_data`), používateľa (`changed_by`) a čas.

---

## 4. BEZPEČNOSŤ & RLS POLITIKY (ROW LEVEL SECURITY)

Aplikácia implementuje striktný **Multi-Tenancy** a izoláciu dát na úrovni databázových politík (RLS). Každý dopyt do Supabase prechádza kontrolou používateľa (`auth.uid()`).

### A. RBAC (Role-Based Access Control) Matica Oprávnení
Prístup k modulom je riadený dynamickou maticou zapísanou v tabuľkách `public.modules` a `public.role_permissions`.
*   Funkcia `public.has_permission(p_module_id text, p_action text)` v PostgreSQL vyhodnocuje oprávnenia pre aktuálne prihláseného používateľa:
    *   Používatelia s rolou `'admin'` alebo `'majitel'` majú **globálny prístup** (Super User pattern - obchádzajú maticu).
    *   Ostatní používatelia sú overovaní na základe zapísaných stĺpcov `can_read`, `can_write`, `can_delete` pre daný modul.
*   V databázových politikách (RLS) je táto funkcia využívaná na obmedzenie čítania a zápisu.

### B. Izolácia Dát pre Špecialistov (Multi-Tenancy)
1.  **Prístup ku klientom (`profiles`)**: 
    *   Špecialista (napr. tréner alebo fyzioterapeut) vidí v systéme **iba tých klientov**, ktorí sú mu priradení cez tabuľku `client_specialist_assignments`.
    *   Klient vidí **iba svoj vlastný profil**.
    *   Admin, recepcia a majiteľ vidia všetkých klientov (pomocou SQL funkcie `public.has_global_client_access`).
2.  **Prístup k cvikom (`exercises`)**:
    *   Globálne cviky (`is_custom = false`) sú viditeľné pre všetkých.
    *   Vlastné cviky (`is_custom = true`) vidí len tréner, ktorý ich vytvoril (`created_by`), alebo klient, ktorý ich má priradené v pláne.
3.  **Prístup k tréningovým plánom (`training_plans`)**:
    *   Špecialista vidí a edituje plány, ktoré sám vytvoril, alebo ktoré patria jeho priradenému klientovi.
    *   Klient vidí iba plány, ktoré boli priradené jemu.

---

## 5. KĽÚČOVÉ APLIKAČNÉ TOKY & MECHANIZMY

### A. Passwordless OTP Login
Prihlasovanie prebieha bez zadávania hesiel cez jednorazové 6-miestne OTP kódy odoslané na e-mail:
1.  Používateľ zadá e-mail. Aplikácia zavolá `supabase.auth.signInWithOtp({ email })`.
2.  Supabase odošle kód na e-mail. Používateľ zadá kód do formulára.
3.  Aplikácia zavolá `supabase.auth.verifyOtp({ email, token, type: 'email' })`.
4.  `AuthProvider.tsx` zachytí zmenu stavu relácie (session), načíta profil z `profiles` a nastaví lokálny stav a oprávnenia.
5.  Ak prihlásenie zlyhá alebo je kód nesprávny, UI okamžite zobrazí chybovú správu prostrednívom stavu `authError` v AuthProvider.

### B. GDPR Onboarding Flow
Keď sa nový alebo predregistrovaný klient prvýkrát prihlási a jeho profil nemá nastavený dátum podpisu GDPR (`gdpr_signed_at IS NULL`), Route Guard ho uzamkne na stránke `/gdpr`:
1.  **Predvyplnenie dát:** Stránka načíta záznam z `client_invitations` pre daný e-mail. Ak existuje, predvyplní meno, priezvisko, telefón a adresu.
2.  **Podpis a súhlasy:** Klient potvrdí súhlasy (Marketing, Meta, Diagnostika) a odošle formulár.
3.  **Server-Side PDF Generovanie:** 
    *   Klientsky formulár zavolá Server Action v `/gdpr/actions.ts`.
    *   Server Action zavolá funkciu `generateGdprPdf(...)` zo súboru `src/utils/pdf/generateGdprPdf.ts`.
    *   Knižnica `pdfmake` vygeneruje PDF dokument priamo v pamäti servera.
4.  **Uloženie a aktivácia:**
    *   PDF sa nahrá do úložiska `client_documents` pod cestu `<client_id>/GDPR_Dohoda.pdf`.
    *   Vytvorí sa záznam v tabuľke `documents`.
    *   Profil používateľa sa zaktualizuje pomocou `upsert` do `profiles` (uložia sa zadané osobné údaje, súhlasy do `metadata` a nastaví sa aktuálny čas do `gdpr_signed_at`).
    *   Záznam z čakárne (`client_invitations`) sa vymaže.
5.  **Presmerovanie:** Klient je úspešne prepustený do aplikácie na `/dashboard`.

### C. Ochrana GDPR súhlasov v profile klienta
*   Pre rolu `klient` sú prepínače GDPR súhlasov (Marketing, Meta, Diagnostika) v sekcii *Môj Profil* **odomknuté**.
*   Pri akejkoľvek zmene súhlasov zo strany klienta (alebo personálu) Server Action `updateProfileAction` **automaticky vygeneruje novú PDF zmluvu** so zachovanými identifikačnými údajmi a aktuálnymi súhlasmi.
*   Toto chráni systém pred nesúladom medzi zmluvou a databázou, pretože databáza a PDF zmluva sú synchronizované priamo pri uložení profilu. Nové PDF sa priradí klientovi v module Dokumenty.

### D. PDF Generovanie na Serveri
Všetky exporty (GDPR dohody, diagnostické správy) sa generujú výlučne na serveri prostrednívom `pdfmake`:
*   *Prečo:* Rieši to problémy s výkonom, zamŕzaním Next.js pri spracovaní veľkých obrázkov (napr. InBody skeny) a chráni citlivé lekárske dáta pred únikom do klientskeho prehliadača.
*   *Formát:* Výstupom je raw buffer, ktorý sa následne priamo nahráva do Supabase Storage alebo posiela klientovi ako stream na stiahnutie.

### E. File Upload Flow (Client-to-Storage)
Nahrávanie súborov (napr. obrázky cvikov v `<ExerciseFormModal>` alebo prílohy k diagnostikám v `<VyplnitDiagnostikuForm>`) obchádza pamäť Next.js servera:
1.  Používateľ vyberie súbor v prehliadači (cez `react-dropzone`).
2.  Klientsky komponent nahrá súbor priamo do Supabase Storage bucketu (`exercise_images` alebo `client_records_files`) pomocou klientskeho SDK.
3.  Získa sa verejná/súkromná cesta k súboru.
4.  Cesta (URL) sa odošle do Server Action ako textové pole v rámci uloženia formulára.

### F. Jednotný Vizuál PDF Súborov (PdfBuilder)
Všetky PDF exporty v systéme používajú zjednotený dizajn (čierna hlavička, logo SportWell, IČO, rovnaké písma a formátovanie tabuliek). Týmto sa zabezpečila maximálna vizuálna zhoda:
*   Generovanie vizuálu obstaráva **jedna šablóna** `src/utils/pdf/PdfBuilder.ts`.
*   Akékoľvek zmeny firemného vizuálu (napr. výmena loga, zmena farby pozadia hlavičky) rob výhradne v tomto súbore.
*   Jednotlivé moduly ako `generateDiagnosticPdf` alebo `generateGdprPdf` už generujú iba samotný text a odrážky daného dokumentu a túto prácu odovzdávajú builderu.

### G. Rozdelená Adresa (Street, City, Zip) a Fallback Logika
Z dôvodu požiadaviek na detailnejšie ukladanie klienta je pole pre adresu natívne **rozdelené na 3 časti**: `street`, `city` a `zip`. Tieto atribúty žijú v `metadata` profile používateľa.
*   **Spätná kompatibilita:** Keďže staré účty disponujú iba spojeným atribútom `address`, ukladáme doň v akciách (`actions.ts`) pre istotu celú spojenú adresu ako textový string (`Hlavná 1, 81101 Bratislava`).
*   **Zobrazovanie v UI a PDF:** Pri zobrazovaní adresy v rozhraní (Napr. Detail klienta alebo diagnostiky) systém použije nasledujúci fallback pattern: `client.metadata?.street ? \`\${client.metadata.street}, \${client.metadata.zip} \${client.metadata.city}\` : (client.metadata?.address || "Nezadané")`. Toto bráni zobrazeniu prázdneho miesta u starých klientov.

---

## 6. ŠTRUKTÚRA ADRESÁROV A SÚBOROV

Aplikácia striktne dodržiava princíp **Colocation** (umiestnenie súvisiacich súborov k sebe). Každý funkčný modul v dashboarde má vlastný priečinok obsahujúci server componenty, server actions a dedikované klientske podkomponenty:

```text
/src
  /app                  
    /(auth)/login       # Verejná cesta (OTP Login)
    /(dashboard)        # Chránené cesty (Route Guard v layout.tsx)
      /dashboard        # Hlavný prehľad (Dashboard)
        /components/DashboardOverview.tsx  # Klientsky panel
        page.tsx        # Server Component
      /diagnostika      # Vypĺňanie a história diagnostík
        /components/DiagnosticsOverview.tsx
        /components/VyplnitDiagnostikuForm.tsx
        /vyplnit/[id]/page.tsx  # Stránka pre vyplnenie konkrétnej diagnostiky
        actions.ts      # Server Actions pre zápis diagnostík
        page.tsx        # Server Component (Zoznam klientov na diagnostiku)
      /dokumenty        # Správa zmlúv a PDF dokumentov
        /components/DocumentList.tsx
        actions.ts      # Server Actions pre dokumenty
        page.tsx        # Server Component
      /gdpr             # GDPR Onboarding pre nových klientov
        actions.ts      # Server Actions (Generovanie zmluvy, registrácia)
        page.tsx        # Server Component (Onboarding Wrapper)
        GdprOnboardingWrapper.tsx
      /klienti          # Zoznam klientov, čakáreň a detaily klientov
        /components/ClientCard.tsx
        /components/ClientList.tsx
        /components/InviteClientModal.tsx
        /components/AssignmentModal.tsx
        /hooks/useClients.ts
        actions.ts      # Server Actions (Pozvanie, Priradenie špecialistu)
        page.tsx        # Server Component
      /nastavenia       # Nastavenia oprávnení a RBAC matice
        /components/SettingsOverview.tsx
        actions.ts      # Server Actions (Uloženie matice)
        page.tsx        # Server Component
      /plan             # Tréningové plány klientov
        /components/PlanList.tsx
        /components/PlanDetails.tsx
        /create/page.tsx  # Vytvorenie plánu
        /edit/[id]/page.tsx  # Editácia plánu
        actions.ts      # Server Actions pre plány
        page.tsx        # Server Component
        [id]/page.tsx   # Server Component (Detail plánu)
      /profil           # Profil prihláseného používateľa
        /components/ProfileOverview.tsx
        actions.ts      # Server Actions (Aktualizácia profilu)
        page.tsx        # Server Component
      /sablony          # Správa šablón pre diagnostiky
        /components/TemplatesList.tsx
        /components/FormBuilder.tsx
        actions.ts      # Server Actions pre šablóny
        page.tsx        # Server Component
        [id]/page.tsx   # Server Component (Editor šablóny)
      /zamestnanci      # Správa zamestnancov a pozvánok
        /components/EmployeeCard.tsx
        /components/EmployeeList.tsx
        /components/InviteEmployeeModal.tsx
        actions.ts      # Server Actions pre zamestnancov
        page.tsx        # Server Component
      /cviky            # Databáza cvikov a inštruktážnych videí
        /components/ExerciseCard.tsx
        /components/ExerciseFormModal.tsx
        /components/ExerciseList.tsx
        actions.ts      # Server Actions pre cviky
        page.tsx        # Server Component
      globals.css       # Globálne štýly (Tailwind premenné a UI farby)
      layout.tsx        # Hlavný layout (Sidebar / BottomNav, Route Guard)
  
  /components           
    /providers/AuthProvider.tsx  # Zdieľaný stav prihlásenia a relácie
    /forms              # Všeobecné formulárové prvky
    /layout             # Globálne rozloženie
  
  /utils                
    /pdf                # Generátory PDF na serveri
      generateGdprPdf.ts
      generateDiagnosticPdf.ts
    /supabase           # SSR / Browser klienti pre Supabase
      client.ts         # Client-side Supabase client
      server.ts         # Server-side Supabase client (cookies)
      middleware.ts     # Middleware session refresh
    validation.ts       # Validačné a pomocné funkcie
```

---

## 7. ŠTANDARDY KÓDOVANIA & VÝVOJOVÉ KONVENCIE

Pre zachovanie čistoty kódu a škálovateľnosti systému sa musia bez výnimky dodržiavať nasledujúce pravidlá:

### A. Separation of Concerns (Dátový Tok)
*   **Čítanie dát:** Vždy primárne cez **Server Components** (napr. `page.tsx`). Načítajte dáta priamo zo Supabase pomocou `createClient()` zo `src/utils/supabase/server.ts` a odovzdajte ich klientskemu komponentu ako props (napr. `<ClientList initialClients={data} />`).
*   **Zápis dát:** Všetky zmeny v databáze (INSERT, UPDATE, DELETE) robte výhradne cez **Server Actions** (`"use server"` v dedikovanom súbore `actions.ts`). Nepoužívajte inline volania Supabase na klientovi pre zápis.
*   **Validácia:** Každá Server Action musí vstupné dáta validovať pomocou schémy **Zod** (`schema.safeParse(data)`).
*   **Revalidácia:** Po úspešnom zápise v Server Action zavolajte `revalidatePath` pre dotknuté cesty, aby sa Server Components automaticky pregenerovali s novými dátami.

### B. Colocation a Veľkosť Súborov
*   **God Components sú zakázané:** Žiadny súbor by nemal presiahnuť **250-300 riadkov**. Ak má súbor viac, rozdeľte ho na menšie subkomponenty a umiestnite ich do lokálneho priečinka `/components` daného modulu.
*   **Lokálna príslušnosť:** Utility a hooky, ktoré slúžia len jednému modulu (napr. `useClients.ts` pre modul *Klienti*), musia žiť v priečinku daného modulu, nie v globálnom `/src/hooks` alebo `/src/utils`.

### C. UX, Responzivita a PWA
*   **Touch Targets:** Každý klikateľný prvok musí mať veľkosť aspoň $44 \times 44$px.
*   **Spätná väzba (Feedback):** Každá mutácia spúšťaná z klientskeho rozhrania musí byť obalená v `useTransition` a zobrazovať vizuálny loading stav (napr. zakázané tlačidlo, spinner), aby mal používateľ okamžitú odozvu.
*   **Offline Support:** Diagnostické formuláre by mali priebežne ukladať rozpracovaný stav do `localStorage` alebo `IndexedDB` a po obnove internetového pripojenia (udalosť `online`) ponúknuť používateľovi odoslanie dát.

### D. Definition of Done (Checklist pred Merge-om)
1.  Kód prechádza ESLint a TypeScript kontrolou bez chýb (`npm run lint`, `npx tsc --noEmit`).
2.  Zápis dát je chránený serverovou validáciou (Zod) a overením oprávnení v databáze.
3.  Všetky RLS politiky pre nové tabuľky alebo bucket-y sú zavedené a otestované v prostredí Supabase.
4.  Rozhranie je plne responzívne a neprekrýva sa so spodnou navigáciou pre klientov.
5.  Aplikácia sa úspešne skompiluje do produkčného buildu (`npm run build`).

---

## 8. MANUÁL PRE PRIDÁVANIE NOVÝCH MODULOV (PLAYBOOK)

Ak je potrebné do aplikácie pridať úplne nový modul (napr. **Rezervácie** alebo **Platby**), postupujte podľa tohto 7-krokového plánu.

### Krok 1: Príprava databázovej schémy a RLS (Supabase)
Vytvorte novú migráciu v priečinku `/supabase/migrations/<timestamp>_create_<module_name>.sql`.

```sql
-- 1. Vytvorenie tabuľky
CREATE TABLE IF NOT EXISTS public.reservations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    specialist_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    reservation_date timestamp with time zone NOT NULL,
    notes text,
    status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Zapnutie RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- 3. Definícia RLS Politík (Multi-Tenancy & Ochrana dát)
-- Klient vidí len svoje rezervácie
CREATE POLICY "Clients view own reservations" ON public.reservations
FOR SELECT TO authenticated
USING (client_id = auth.uid());

-- Špecialista vidí len rezervácie svojich priradených klientov
CREATE POLICY "Specialists view assigned reservations" ON public.reservations
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.client_specialist_assignments csa
        WHERE csa.specialist_id = auth.uid() AND csa.client_id = reservations.client_id
    ) OR public.has_global_client_access(auth.uid())
);

-- Zápis (Insert/Update) chránený kontrolou špecialistu
CREATE POLICY "Specialists manage reservations" ON public.reservations
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role != 'klient'
    )
);
```

### Krok 2: Zaevidovanie modulu do matice oprávnení (RBAC)
Pridajte SQL príkaz na registráciu modulu v systéme (v rovnakej migrácii):

```sql
-- Registrácia nového modulu
INSERT INTO public.modules (id, name, description) 
VALUES ('reservations', 'Rezervácie', 'Správa termínov a objednávok klientov')
ON CONFLICT (id) DO NOTHING;

-- Nastavenie predvolených práv pre existujúce roly
INSERT INTO public.role_permissions (role, module_id, can_read, can_write, can_delete) VALUES
('admin', 'reservations', true, true, true),
('majitel', 'reservations', true, true, true),
('trener', 'reservations', true, true, false),
('fyzioterapeut', 'reservations', true, true, false),
('klient', 'reservations', true, false, false)
ON CONFLICT (role, module_id) DO NOTHING;
```

### Krok 3: Implementácia Smerovania (Next.js Server Component)
Vytvorte súbor `src/app/(dashboard)/reservations/page.tsx`:

```typescript
import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ReservationsList from "./components/ReservationsList";

export default async function ReservationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Načítanie profilu a oprávnení aktuálneho používateľa
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, permissions")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Kontrola RBAC z databázy
  const userPermissions = (profile.permissions as any) || {};
  const hasAccess = userPermissions.reservations?.read === true || ["admin", "majitel"].includes(profile.role);

  if (!hasAccess) {
    redirect("/dashboard");
  }

  // Načítanie dát na serveri
  const { data: reservations } = await supabase
    .from("reservations")
    .select("*, profiles!client_id(full_name)")
    .order("reservation_date", { ascending: true });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-brand-navy mb-8">Rezervácie a Termíny</h1>
      <ReservationsList 
        initialReservations={reservations || []} 
        userRole={profile.role}
      />
    </div>
  );
}
```

### Krok 4: Implementácia Server Actions (`actions.ts`)
Vytvorte súbor `src/app/(dashboard)/reservations/actions.ts`:

```typescript
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createReservationSchema = z.object({
  clientId: z.string().uuid("Neplatné ID klienta"),
  reservationDate: z.string().datetime("Neplatný dátum a čas"),
  notes: z.string().max(500).optional(),
});

export async function createReservationAction(data: {
  clientId: string;
  reservationDate: string;
  notes?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Neautorizovaný prístup");

  // Overenie Zod schémy
  const validation = createReservationSchema.safeParse(data);
  if (!validation.success) {
    throw new Error("Validačná chyba: " + validation.error.issues.map(i => i.message).join(", "));
  }

  // Overenie oprávnenia pre zápis
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role === "klient") {
    throw new Error("Nemáte oprávnenie na vytváranie rezervácií");
  }

  const { error } = await supabase.from("reservations").insert({
    client_id: validation.data.clientId,
    specialist_id: user.id,
    reservation_date: validation.data.reservationDate,
    notes: validation.data.notes,
  });

  if (error) {
    console.error("Error creating reservation:", error);
    throw new Error("Nepodarilo sa vytvoriť rezerváciu: " + error.message);
  }

  revalidatePath("/reservations");
}
```

### Krok 5: Tvorba Klientskych Subkomponentov (`components/`)
Vytvorte priečinok `src/app/(dashboard)/reservations/components` a doň napríklad klientsky zoznam `ReservationsList.tsx`:

```typescript
"use client";

import React, { startTransition, useTransition } from "react";
import { createReservationAction } from "../actions";

interface Reservation {
  id: string;
  reservation_date: string;
  notes: string | null;
  status: string;
  profiles: { full_name: string } | null;
}

export default function ReservationsList({ 
  initialReservations, 
  userRole 
}: { 
  initialReservations: Reservation[];
  userRole: string;
}) {
  const [isPending, startTransitionHook] = useTransition();

  const handleCreateDummy = async () => {
    startTransitionHook(async () => {
      try {
        await createReservationAction({
          clientId: "nejake-uuid-klienta",
          reservationDate: new Date(Date.now() + 86400000).toISOString(),
          notes: "Automaticky testovací termín",
        });
        alert("Rezervácia úspešne vytvorená!");
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur-md border border-brand-light-cyan/30 rounded-2xl p-6 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-brand-navy">Plánované termíny</h2>
        {userRole !== "klient" && (
          <button
            onClick={handleCreateDummy}
            disabled={isPending}
            className="min-h-[44px] px-6 py-2 bg-brand-cyan text-brand-dark-navy font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isPending ? "Ukladám..." : "Nový termín"}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {initialReservations.map((res) => (
          <div key={res.id} className="p-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <p className="font-medium text-brand-navy">{res.profiles?.full_name || "Neznámy klient"}</p>
              <p className="text-sm text-gray-500">{new Date(res.reservation_date).toLocaleString("sk-SK")}</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
              {res.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Krok 6: Registrácia do Sidebar / Bottom Nav navigácie
1.  Otvorte súbor `src/app/(dashboard)/layout.tsx`.
2.  Nájdite sekciu, kde sa definujú položky navigácie (`navigationItems`).
3.  Zadefinujte nový objekt a pridajte kontrolu oprávnení:
    ```typescript
    const hasReservationsAccess = userPermissions.reservations?.read === true || ["admin", "majitel"].includes(currentUserProfile.role);
    
    if (hasReservationsAccess) {
      navigationItems.push({
        id: "reservations",
        label: "Rezervácie",
        href: "/reservations",
      });
    }
    ```
4.  Pridajte novú ikonu pre kľúč `"reservations"` do pomocnej funkcie `getIconForId`.

### Krok 7: Statická a Produkčná Kontrola
Spustite v termináli overenie bezchybnosti kódu a zostavenia:
```bash
# Kontrola chýb v TypeScript typoch
npx tsc --noEmit

# Spustenie lintera
npm run lint

# Overenie, že produkčný build Next.js úspešne prebehne
npm run build
```
