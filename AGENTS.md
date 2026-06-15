<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Technická dokumentácia & Vývojárska príručka (SportWell v3.0 - Fáza 1 MVP)

Tento dokument slúži ako kompletný návod a špecifikácia pre vývojárov a agentov pracujúcich na aplikácii pre rehabilitačné a športové centrum **SportWell**. Popisuje stav systému po migrácii na verziu 3.0 (Fáza 1 Core MVP).

---

## 1. ARCHITEKTÚRA & TECHNOLOGICKÝ STACK
Aplikácia SportWell funguje ako Progressive Web App (PWA) s prioritou pre mobilné zobrazenie.

- **Frontend:** React 19, Next.js 16.2.7 spustený vo Webpack režime (s prepínačom `--webpack`) kvôli zachovaniu spätnej kompatibility s PWA pluginmi.
- **Styling:** Tailwind CSS v4 s lokálne upraveným písmom *Noto Sans* a pevne definovanými farbami podľa Brand Manualu.
- **Backend & Databáza:** Supabase (PostgreSQL) pre ukladanie dát, správu používateľov (Auth) a dokumentov (Storage).

---

## 2. VIZUÁLNA IDENTITA & BRAND MANUAL
Všetky rozhrania striktne dodržiavajú farebnú schému a typografické pravidlá zadefinované v `SportWell_Brand_Manual.md`.

### HSL & HEX CSS Premenné (v `src/app/globals.css`):
- `--font-sans`: *Noto Sans* (subsets latin, latin-ext).
- **Základné farby:**
  - `brand-navy` (`#0A192F`): Tmavomodrá, základná farba pre texty a hlavné tlačidlá.
  - `brand-dark-navy` (`#020C1B`): Veľmi tmavá modrá pre pozadia panelov a tmavý režim prihlásenia.
  - `brand-cyan` (`#00F0FF`): Tyrkysová/azúrová farba pre akcenty, aktívne stavy a interaktívne body.
  - `brand-light-cyan` (`#D3FAFF`): Svetlá tyrkysová pre pozadia tlačidiel a jemné highlighty.
  - `brand-off-white` (`#F7FAFC`): Neutrálne svetlé pozadie pre klientske rozhranie.

### UX & Mobilné pravidlá (Mobile-First):
- **Zamedzenie zoomu na iOS:** Hlavička HTML obsahuje meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />` pre elimináciu otravného zoomovania vstupných polí na iPhonoch.
- **Hit Targets:** Všetky klikateľné elementy (tlačidlá, odkazy, checkbox) majú minimálny dotykový rozmer **44x44px** na mobilných zariadeniach.
- **Bottom Navigation Bar:** Pre rolu `klient` na mobilných zariadeniach je bočné menu nahradené dolným navigačným barom (Home, Moje Cviky, Dokumenty, Profil), čím sa odstraňuje nutnosť hamburger menu.

---

## 3. DÁTOVÝ MODEL & POSTGRESQL SCHÉMA

Databáza v Supabase pozostáva z nasledujúcich tabuliek schémy `public`:

### A. Profiles (`public.profiles`)
Uchováva osobné údaje a roly používateľov prepojené s `auth.users`.
- `id` (uuid, primary key, references `auth.users`)
- `role` (enum `user_role`: `'admin'`, `'trener'`, `'klient'`) - Roly boli v v3.0 konsolidované. Špecialisti (masér, ortopéd, atď.) sú zjednotení pod rolou `'trener'`.
- `full_name` (text, spojené meno a priezvisko)
- `email` (text, synchronizovaný e-mail)
- `phone` (text)
- `gdpr_signed_at` (timestamp, čas podpísania GDPR). Ak je NULL, používateľ nemá prístup k aplikácii.
- `metadata` (jsonb, uchováva narodeniny, adresu, primárny záujem a voliteľné marketingové súhlasy)
- `created_at` (timestamp)

### B. Employee Invitations (`public.employee_invitations`)
Uchováva aktívne pozvánky pre nových zamestnancov, odoslané administrátorom.
- `id` (uuid, primary key)
- `email` (text, unique)
- `full_name` (text)
- `role_title` (text, špecifická pozícia, napr. "Ortopéd")
- `invited_by` (uuid, references `profiles.id`)
- `created_at` (timestamp)

### C. Client Specialist Assignments (`public.client_specialist_assignments`)
Mapovacia tabuľka, ktorá priraďuje konkrétneho klienta (pacienta) konkrétnemu špecialistovi (trénerovi/adminovi).
- `id` (uuid, primary key)
- `client_id` (uuid, references `profiles.id`)
- `specialist_id` (uuid, references `profiles.id`)
- `assigned_by` (uuid, references `profiles.id`)
- `created_at` (timestamp)

### D. Form Templates (`public.form_templates`)
Šablóny pre dynamické formuláre špecialistov (diagnostiky, konzultácie, atď.).
- `id` (uuid, primary key)
- `title` (text)
- `category` (text)
- `schema` (jsonb, pole polí s definovaným typom, štítkom, placeholderom a validáciami)

### E. Client Records (`public.client_records`)
Záznamy o zdravotnom stave a diagnostike vyplnené na základe dynamických šablón.
- `id` (uuid, primary key)
- `client_id` (uuid, references `profiles.id`)
- `created_by` (uuid, references `profiles.id`)
- `template_id` (uuid, references `form_templates.id`)
- `form_data` (jsonb, ukladá hodnoty dynamic formulárov)

### F. Exercises & Training Plans (`public.exercises` a `public.training_plans`)
Zoznam rehabilitačných cvičení a plány predpísané trénermi pre klientov. Plan data je uložená v poliach formátu JSONB.

### G. Documents (`public.documents` a Supabase Storage `client_documents`)
Evidencia zmlúv a vygenerovaných HTML/PDF súborov.
- `id` (uuid, primary key)
- `client_id` (uuid, references `profiles.id`)
- `file_name` (text, napr. `GDPR_Suhlas_Mrkvicka.html`)
- `storage_path` (text, cesta v bucket-e `client_documents`)
- `created_at` (timestamp)

---

## 4. BEZPEČNOSŤ & RLS POLITIKY (ROW LEVEL SECURITY)

Všetky tabuľky majú zapnuté **RLS**. Na zabránenie chybe nekonečného zacyklenia dopytov pri kontrole rolí je v databáze zavedená pomocná bezpečnostná funkcia `is_specialist` (`security definer`), ktorá obchádza RLS priamo nad tabuľkou `profiles`.

### Kľúčové roly a ich prístupy:
1. **Admin (`role = 'admin'`):**
   - Má plný prístup ku všetkým tabuľkám.
   - Ako jediný môže spravovať zamestnancov a odosielať pozvánky cez tabuľku `employee_invitations`.
   - Má prístup ku všetkým klientom, ich dokumentom, diagnostikám a tréningovým plánom.
   - Má možnosť priraďovať klientov k akýmkoľvek trénerom.

2. **Tréner / Špecialista (`role = 'trener'`):**
   - Má prístup k prezeraniu všetkých profilov klientov (aby mohol vyhľadávať nových).
   - Môže upravovať a čítať len tých klientov, dokumenty a záznamy (client_records, training_plans), ktorí sú mu priradení, alebo záznamy, ktoré sám vytvoril.
   - Nemôže pozývať nových zamestnancov a nevidí zoznam zamestnancov s úmyslom ich úpravy.

3. **Klient (`role = 'klient'`):**
   - Vidí **iba svoj vlastný profil** (`auth.uid() = id`).
   - Môže vkladať záznamy do tabuľky `profiles` iba s jeho vlastným `id` (`profiles_insert_own`), čo sa deje pri úvodnej registrácii.
   - Vidí iba svoje vlastné dokumenty, tréningové plány a záznamy.
   - Nemá prístup do diagnostiky, správy klientov a zamestnancov.

---

## 5. ARCHITEKTÚRA, MODULY A MECHANIZMY

### A. Smerovanie a Route Guard
Kód je rozdelený do dvoch zón: `(auth)` a `(dashboard)`.
- **`layout.tsx` v `(dashboard)`:** Obsahuje silný **Route Guard**. 
  - Ak používateľ nie je prihlásený, je presmerovaný na `/login`.
  - Ak je používateľ prihlásený, ale v databáze má v profile `gdpr_signed_at: null`, systém mu **natvrdo skryje navigáciu** a presmeruje ho na stránku `/gdpr`.

### B. Prihlasovanie (Magic Links)
- Používame Supabase Auth bez hesiel. Používateľ zadá email, dostane OTP kód / Magic Link.
- `AuthProvider.tsx` načíta Session. Ak používateľ existuje v `profiles`, stiahne jeho rolu a údaje.
- Ak používateľ **neexistuje** v `profiles` (nový klient), aplikácia si ho vytvorí lokálne ako provizórneho "Nové Používateľa" a čaká, kým neprejde GDPR onboardingom, po ktorom ho skutočne vloží (`upsert`) do databázy.
- Ak sa email prihlasujúceho zhoduje so záznamom v `employee_invitations`, systém mu automaticky vytvorí profil s rolou `trener` a pozvánku zmaže.

### C. 3-stupňový GDPR Onboarding (Registrácia Klienta)
Pre nových klientov funguje stránka `/gdpr` ako digitálna vstupná brána:
1. **Osobné údaje:** Klient vyplní Meno, Priezvisko, Adresu, Telefón a Dátum narodenia.
2. **Súhlasy:** Zaškrtne povinné zmluvné dokumenty (Zásady ochrany OU, Rezervačný systém) a voliteľné marketingové súhlasy (InBody, Meta, Newsletter). Vizuálna validácia upozorní na chýbajúce polia červeným orámovaním.
3. **Uloženie do DB (Upsert & FK):**
   - Z údajov sa na klientovej strane vygeneruje právny HTML dokument, ktorý sa nahrá do úložiska (Storage Bucket `client_documents`).
   - Vykoná sa `upsert` na tabuľku `profiles`, čím sa fyzicky vytvorí používateľ v databáze a zapíše sa mu `gdpr_signed_at`.
   - Vloží sa záznam do tabuľky `documents` (s ohľadom na Foreign Key `client_id`).
   - Zmizne bariéra Route Guardu a klient je presmerovaný do štandardného Dashboardu s plnohodnotným navigačným menu (Bottom Bar).

---

## 6. ŠTRUKTÚRA ADRESÁROV A SÚBOROV

Projekt využíva štandardnú štruktúru **Next.js App Router**:

```text
/src
  /app                  
    /(auth)/login       # Verejná cesta (Magic link, OTP)
    /(dashboard)        # Chránené cesty (Route Guard v layout.tsx)
      /dashboard        # Hlavný prehľad (odlišný pre trénera a klienta)
      /diagnostika      # Dynamické formuláre pre trénerov
      /dokumenty        # Zoznam dokumentov a zmlúv
      /gdpr             # GDPR Onboarding wizard pre nových klientov
      /klienti          # Správa klientov (priraďovanie špecialistov)
      /plan             # Tréningové plány
      /zamestnanci      # Správa zamestnancov a odosielanie pozvánok (Admin len)
    globals.css         # Globálne štýly a Tailwind premenné
    layout.tsx          # Root layout s AuthProvider
  
  /components           
    /providers/AuthProvider.tsx  # Hlavný manažér stavu prihlásenia a profilov
    /forms              # Izolované komponenty (diagnostika, validácia)
    /layout             # Sidebar, Header, BottomNav
  
  /hooks                # Custom React hooky pre načítanie dát bez globálneho stavu
  /utils/supabase       # Inicializácia SSR klienta a Browser klienta
  
/supabase
  /migrations           # SQL skripty - databázová schéma a RLS politiky
```
