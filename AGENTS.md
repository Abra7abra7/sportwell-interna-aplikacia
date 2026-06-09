<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Technická dokumentácia & Vývojárska príručka (SportWell)

Tento dokument slúži ako kompletný návod a špecifikácia pre vývojárov a agentov pracujúcich na aplikácii pre rehabilitačné a športové centrum **SportWell**. Umožňuje plynulé pokračovanie vo vývoji.

---

## 1. PREHĽAD PROJEKTU A CIELE
Aplikácia SportWell je integrovaný informačný systém a klientsky portál navrhnutý ako **Progressive Web App (PWA)** s prioritou pre mobilné zobrazenie (Mobile-First).

### Hlavné technologické jadro:
- **Frontend:** React 19, Next.js 16.2.7 (spustený vo Webpack režime kvôli kompatibilite s PWA pluginmi).
- **Styling:** Tailwind CSS v4, custom font *Noto Sans* s lokálnou konfiguráciou premenných.
- **Backend & Databáza:** Supabase (PostgreSQL) pre ukladanie dát, správu používateľov (Auth) a bezpečné ukladanie súborov (Storage).
- **Hosting:** Vercel / Cloudflare Pages.

---

## 2. VIZUÁLNA IDENTITA & BRAND MANUAL
Aplikácia využíva špecifickú farebnú schému a typografické pravidlá zadefinované v `SportWell_Brand_Manual.md`. 

### CSS Premenné (v `src/app/globals.css`):
- `--font-sans`: *Noto Sans* (subsets latin, latin-ext).
- **Primárne farby:**
  - `brand-navy` (`#0A192F`): Tmavomodrá, základná farba pre texty, hlavičky a hlavné tlačidlá.
  - `brand-dark-navy` (`#020C1B`): Veľmi tmavá modrá používaná na pozadia panelov a tmavý režim prihlásenia.
  - `brand-cyan` (`#00F0FF`): Tyrkysová/azúrová farba pre akcenty, aktívne stavy, rámčeky a interaktívne body.
  - `brand-light-cyan` (`#D3FAFF`): Svetlá tyrkysová pre pozadia tlačidiel a jemné highlighty.
  - `brand-off-white` (`#F7FAFC`): Neutrálne svetlé pozadie pre klientske rozhranie.

### UX Pravidlá:
- **Hit Targets:** Všetky klikateľné elementy (tlačidlá, odkazy, checkbox) majú minimálny dotykový rozmer **44x44px** pre bezproblémové ovládanie na mobilných zariadeniach.
- **Micro-animations:** SVG mapa bolesti má aktívnu hover odozvu, videá v knižnici zobrazujú pulzujúci a vlniaci sa indikátor simulujúci prehrávanie, a prechody medzi kartami využívajú animáciu postupného zobrazenia (`animate-fade-in`).

---

## 3. INFRASŠTRUKTÚRA & PREPOJENIE SO SUPABASE
Konfigurácia prostredia a autentifikačných klientov je rozdelená nasledovne:

- **`.env.local`:** Obsahuje URL adresu projektu a publishable anon key.
- **`src/utils/supabase/`**:
  - `client.ts`: Inicializuje browser-based klienta pre client-side komponenty (`"use client"`).
  - `server.ts`: Inicializuje server-based klienta pre Server Components.
  - `middleware.ts`: Aktualizuje auth session v cookies (nutné pre Next.js 16 routing).
- **`src/proxy.ts`**:
  - Implementuje proxy smerovanie požiadaviek (Next.js 16 nahrádza starý `middleware.ts` týmto proxy súborom, ktorý exportuje funkciu `proxy`).
- **Autentifikácia:** Registrácie a prihlásenia bežia na Supabase Auth. Lokálne testovanie funguje s **vypnutým potvrdzovaním e-mailov (Confirm email)** v Supabase kvôli obmedzeniam SMTP limitov na bezplatnom serveri. V produkcii sa po prepojení na vlastné SMTP (napr. Websupport) toto potvrdzovanie znova zapne.

---

## 4. DÁTOVÝ MODEL & POSTGRESQL SCHÉMA

Databáza v Supabase pozostáva z piatich hlavných tabuliek schémy `public`:

### A. Profiles (`public.profiles`)
Uchováva osobné údaje a roly používateľov. Je prepojená s `auth.users`.
- `id` (uuid, primary key, references `auth.users`)
- `role` (enum `user_role`: 'admin', 'ortoped', 'fyzioterapeut', 'maser', 'trener', 'nutricny', 'klient')
- `first_name` (text)
- `last_name` (text)
- `email` (text, synchronizovaný e-mail)
- `phone` (text)
- `gdpr_accepted_at` (timestamp)
- `gdpr_version` (text)
- `created_at` (timestamp)

### B. Medical Cards (`public.medical_cards`)
Zdravotná dokumentácia pacienta.
- `id` (uuid, primary key)
- `client_id` (uuid, references `profiles.id`)
- `created_by` (uuid, references `profiles.id`)
- `type` (enum `medical_card_type`: 'ortoped', 'fyzio', 'masaz', 'trening', 'nutricia')
- `pain_map_data` (jsonb, pole kliknutých bodov bolesti a intenzity)
- `form_data` (jsonb, polia lekárskeho nálezu)
- `created_at` (timestamp)

### C. Reservations (`public.reservations`)
Rezervačný kalendár.
- `id` (uuid, primary key)
- `client_id` (uuid, references `profiles.id`)
- `staff_id` (uuid, references `profiles.id`)
- `start_time` (timestamp)
- `end_time` (timestamp)
- `status` (enum `reservation_status`: 'pending', 'confirmed', 'cancelled_by_client', 'cancelled_by_staff', 'no_show')
- `cancelled_at` (timestamp)
- `created_at` (timestamp)

### D. Audit Logs (`public.audit_logs`)
Nezmeniteľný zápis všetkých zmien v zdravotnej dokumentácii (vyžadované GDPR).
- `id` (uuid, primary key)
- `user_id` (uuid)
- `table_name` (text)
- `action` (text - 'INSERT', 'UPDATE', 'DELETE')
- `record_id` (uuid)
- `old_data` (jsonb)
- `new_data` (jsonb)
- `created_at` (timestamp)

---

## 5. BEZPEČNOSŤ & RLS POLITIKY (ROW LEVEL SECURITY)

Všetky tabuľky majú striktne zapnuté **RLS**. Na zabránenie chyby nekonečného zacyklenia dopytov (`infinite recursion`) pri kontrole rolí je v databáze zavedená pomocná bezpečnostná funkcia `is_specialist` typu **`security definer`**.

### Kľúčové RLS politiky:
1. **Profiles (`public.profiles`):**
   - Používatelia môžu čítať, vytvárať (`insert`) a upravovať (`update`) výhradne svoj vlastný profil (`auth.uid() = id`).
   - Zamestnanci (s rolou admin, fyzio, ortoped, atď.) môžu čítať všetky profily pre účely terapie a administrácie (kontrolované cez `is_specialist(auth.uid())`).
2. **Medical Cards (`public.medical_cards`):**
   - Klient má právo na čítanie iba svojich vlastných kariet (`client_id = auth.uid()`).
   - Právo na zápis a čítanie majú iba lekári/fyzioterapeuti (admin, ortoped, fyzioterapeut).
3. **Audit logovanie:**
   - Každá zmena (INSERT, UPDATE, DELETE) v tabuľke `medical_cards` automaticky spúšťa trigger `audit_medical_cards_trigger`, ktorý zapíše pôvodný a nový stav záznamu do `audit_logs`.

---

## 6. ROLE-BASED ACCESS CONTROL (RBAC) & OBRAZOVKY

Aplikácia má jedno hlavné klientske/interné rozhranie (`src/app/page.tsx`), ktoré na základe roly prihláseného používateľa dynamicky mení bočné menu a dostupné zobrazenia.

### A. Rola: `klient` (Pacient)
Materiál a vzhľad navrhnutý pre maximálne pohodlie pacienta.
1. **Dashboard:** Zobrazuje najbližší plánovaný termín rehabilitácie a dnešný domáci tréningový plán (checklist cvičení).
2. **Môj plán:**
   - *Domáci plán cvičení:* Zoznam predpísaných rehabilitácií s parametrami (série, opakovania, tempo, pauza). Po kliknutí na „Cvičiť“ sa otvorí formulár, kde klient zaznamená náročnosť cvičenia (RPE scale 1-10), mieru bolesti (0-10) a pocity, ktoré sa uložia do denníka.
   - *Lekárska karta:* Prehľad všetkých lekárskych nálezov a diagnostík, ktoré mu terapeuti zapísali.
3. **Videá:** Interaktívna knižnica cvikov, kde si môže vyhľadať techniku a popisy pre jednotlivé svalové partie.
4. **Rezervácie:** Kalendár na objednanie sa na vstupnú diagnostiku, fyzioterapiu alebo masáže s automatickou validáciou storna (bezplatné storno do 24 hodín pred termínom, neskôr s prepadnutím zálohy).
5. **Môj profil:** Osobné údaje s možnosťou úpravy telefónneho čísla a stavom GDPR súhlasu (vrátane presného timestampu a verzie).

### B. Roly Špecialistov: `fyzioterapeut`, `ortoped`, `trener`, `maser`, `nutricny`
Zobrazenie prispôsobené pre prácu s pacientmi.
1. **Harmonogram špecialistu:** Zoznam potvrdených rezervácií na dnešný deň pre daného terapeuta.
2. **Moji klienti:** Zoznam všetkých pacientov s detailným zobrazením ich kontaktu, histórie lekárskych záznamov a timeline diagnostík.
3. **Diagnostika:** Rozhranie pre vytvorenie nového lekárskeho záznamu (zápis diagnózy, terapeutického plánu a odporúčaní).
4. **Domáce plány:** Možnosť predpísať a upraviť tréningové plány pre konkrétnych klientov.

### C. Rola: `admin` (Administrátor / Recepcia)
Zobrazenie s prístupom k prevádzkovým a bezpečnostným dátam.
1. **Finančný dashboard:** Prehľad celkového obratu, vyťaženosti strediska a simulačný modul platobnej brány / eKasa tlače (kartou / v hotovosti).
2. **Registrácia klienta:** Formulár pre registráciu nového pacienta priamo na recepcii.
3. **GDPR Audit Logs:** Prehľad kompletného auditného logu s podrobnými JSON informáciami o zmenách v zdravotných kartách pre maximálnu legislatívnu bezpečnosť.

---

## 7. POKRAČOVANIE VO VÝVOJI (NEXT STEPS)
Pri nadviazaní na existujúci kód sa odporúča zamerať na tieto úlohy:
1. **Prepojenie statických zoznamov na DB:** Nahradiť zostávajúce mockované zoznamy (napr. zoznam služieb alebo statické pole cvičení `exercises`) reálnymi Supabase dopytmi na príslušné tabuľky.
2. **Reálne video súbory:** Prepojiť prehrávač cvičení v sekcii videí so Supabase Storage kýblom (bucketom), kde budú nahrané krátke `.mp4` / `.webm` inštruktážne slučky.
3. ** WordPress migrácia:** Dokončiť skript na hromadný import 4 000 používateľov z pôvodného WordPressu do Supabase Auth a odladiť e-mailovú šablónu pre aktivačný reset hesla.
4. **Generovanie PDF reportov:** Implementovať Supabase Edge Function, ktorá po podpísaní GDPR vygeneruje PDF potvrdenie o súhlase a uloží ho do klientskeho priečinka.
