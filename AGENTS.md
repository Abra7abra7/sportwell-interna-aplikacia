<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
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
- `gdpr_signed_at` (timestamp, čas podpísania GDPR)
- `metadata` (jsonb, uchováva narodeniny, adresu, primárny záujem a voliteľné marketingové súhlasy)
- `created_at` (timestamp)

### B. Form Templates (`public.form_templates`)
Šablóny pre dynamické formuláre špecialistov (diagnostiky, konzultácie, atď.).
- `id` (uuid, primary key)
- `title` (text)
- `category` (text)
- `schema` (jsonb, pole polí s definovaným typom, štítkom, placeholderom a validáciami)
- `is_active` (boolean)
- `created_at` (timestamp)

### C. Client Records (`public.client_records`)
Záznamy o zdravotnom stave a diagnostike vyplnené na základe dynamických šablón.
- `id` (uuid, primary key)
- `client_id` (uuid, references `profiles.id`)
- `created_by` (uuid, references `profiles.id`)
- `template_id` (uuid, references `form_templates.id`)
- `form_data` (jsonb, ukladá hodnoty dynamic formulárov vrátane popisu a VAS stupnice bolesti)
- `created_at` (timestamp)

### D. Exercises (`public.exercises`)
Zoznam rehabilitačných cvičení s inštruktážnymi detailmi a URL na videá.
- `id` (uuid, primary key)
- `title` (text)
- `category` (text)
- `target` (text)
- `difficulty` (text)
- `equipment` (text)
- `description` (text)
- `contraindications` (text)
- `video_url` (text)
- `created_at` (timestamp)

### E. Training Plans (`public.training_plans`)
Tréningové a domáce plány cvičení predpísané trénermi pre klientov.
- `id` (uuid, primary key)
- `client_id` (uuid, references `profiles.id`)
- `created_by` (uuid, references `profiles.id`)
- `plan_data` (jsonb, pole cvičení s parametrami: sets, reps, tempo, pause, notes, completed, rpe, pain_level)
- `created_at` (timestamp)

### F. Documents (`public.documents`)
Evidencia právnych zmlúv a PDF súborov (napr. podpísaných GDPR doložiek).
- `id` (uuid, primary key)
- `client_id` (uuid, references `profiles.id`)
- `file_name` (text)
- `storage_path` (text)
- `created_at` (timestamp)

---

## 4. BEZPEČNOSŤ & RLS POLITIKY (ROW LEVEL SECURITY)

Všetky tabuľky majú zapnuté **RLS**. Na zabránenie chybe nekonečného zacyklenia dopytov (`infinite recursion`) pri kontrole rolí je v databáze zavedená pomocná bezpečnostná funkcia `is_specialist` typu **`security definer`**.

### Riešenie nekonečnej slučky v politikách:
Funkcia `is_specialist` obchádza RLS priamo nad tabuľkou `profiles` (keďže beží pod právami tvorcu funkcie - superuser):
```sql
CREATE OR REPLACE FUNCTION is_specialist(user_id uuid)
RETURNS boolean AS $$
begin
  return exists (
    select 1 from public.profiles
    where id = user_id and role in ('admin', 'trener')
  );
end;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Kľúčové politiky:
1. **Profiles:**
   - `profiles_select_own`: Používateľ vidí svoj vlastný profil (`auth.uid() = id`).
   - `profiles_select_specialist`: Špecialisti (admin, trener) vidia všetky profily (`is_specialist(auth.uid())`).
   - `profiles_update_own`: Klient môže aktualizovať iba svoj vlastný profil.
2. **Training Plans & Client Records:**
   - Klient môže čítať iba záznamy, kde `client_id = auth.uid()`.
   - Admin a Tréner majú plné práva (čítanie, zápis, aktualizácia).
3. **Documents:**
   - Klient môže čítať svoje dokumenty (`client_id = auth.uid()`).
   - Klient môže **vložiť** svoj dokument (pri GDPR onboardingu): `WITH CHECK (client_id = auth.uid())`.
   - Admin a Tréner majú prístup ku všetkým dokumentom.

---

## 5. DÔLEŽITÉ MODULY A MECHANIZMY V KÓDE (`src/app/page.tsx`)

### A. Dynamický Form Renderer
Formulár v záložke **Diagnostika** pre trénerov sa generuje na základe schémy z vybranej šablóny (`form_templates`):
- Prechádza JSON pole `schema`.
- Podporuje typy: `text`, `number`, `textarea`, `select`, `checkbox` a špeciálnu `vas_scale` (interaktívny slider 0-10 pre zaznamenanie bolesti s vizuálnym indikátorom).
- Po odoslaní ukladá celé dáta do `client_records` v JSONB formáte.

### B. 3-stupňový GDPR Wizard
Blokuje prístup do klientskej zóny, kým klient nepodpíše súhlasy:
1. **Osobné údaje (Krok 1):** Meno, priezvisko, dátum narodenia, adresa, záujem o služby.
2. **Povinné súhlasi (Krok 2):** VOP a zmluvné doložky spracovania citlivých údajov s rozbaľovacími akordónmi pre detailné informácie.
3. **Dobrovoľné súhlasi (Krok 3):** Marketing (Ecomail), Lookalike audiencie (Meta), prepojenie InBody.
Po dokončení ukladá GDPR timestamp do profilu a simuluje vytvorenie podpísaného PDF doložky v tabuľke `documents`.

### C. Tréningový Pláner (Prescription Builder)
Umožňuje trénerom v záložke **Domáce plány** spravovať a predpisovať cvičenia pre klientov:
- Reaktívne načítava tréningový plán po výbere klienta z dropdown zoznamu.
- Umožňuje zvoliť cvičenie zo zoznamu `exercises` z DB, nastaviť série, opakovania, tempo a poznámky, a následne ho vložiť do databázy.
- Tréneri môžu jednotlivé cvičenia z plánu vymazať (funkcia `deleteClientExercise`), pričom sa reaktívne aktualizuje DB.
