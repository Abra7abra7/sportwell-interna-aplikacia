Nasledujúci dokument slúži ako kompletná, profesionálna technická špecifikácia (Software Requirements Specification - SRS) pripravená priamo pre vývojárov. Je navrhnutá tak, aby na jej základe vedel developer okamžite začať s návrhom databázy, API a frontendu.

---

# TECHNICKÁ ŠPECIFIKÁCIA A ZADANIE PRE VÝVOJ (SRS)

**Projekt:** Aplikácia pre rehabilitačné a športové centrum SportWell  
**Verzia dokumentu:** 2.0 (Rozšírená a optimalizovaná podľa najlepších postupov)  
**Formát aplikácie:** Mobile-First Responsive Web Application / Progressive Web App (PWA)  
**Cieľový technologický stack:** React/Next.js (App Router) alebo Vue.js/Nuxt.js, Supabase (PostgreSQL), Vercel hosting.

---

## 1. PREHĽAD SYSTÉMU A ARCHITEKTÚRY

Systém je navrhnutý ako modulárna webová aplikácia s dôrazom na mobilné zobrazenie. Jadrom celého systému je **Karta klienta**, ktorá prepája medicínske, tréningové, rezervačné a finančné dáta.

### Hlavná architektonická zásada:
Aplikácia využíva prístup **RBAC (Role-Based Access Control)**. Používateľské rozhranie sa dynamicky mení na základe roly prihláseného používateľa. Z dôvodu ochrany citlivých údajov (GDPR / zdravotná dokumentácia) má každá rola striktne definované oprávnenia.

### Infraštruktúra:
* **Doména a DNS:** Spravované cez Websupport (hlavný web `sportwell.sk` zostáva nezmenený).
* **Aplikácia (Frontend):** Subdoména `app.sportwell.sk` nasmerovaná na Vercel.
* **Backend & Databáza (BaaS):** Supabase Cloud, región **EU (Frankfurt – AWS)** pre plný súlad s legislatívou EÚ a GDPR.

---

## 2. POUŽÍVATEĽSKÉ ROLE A OPRÁVNENIA (RBAC MATRIX)

| Modul / Funkcia | Admin | Ortopéd | Fyzioterapeut | Masér | Tréner | Výživový poradca | Klient |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Správa používateľov & Nastavenia | **W** | - | - | - | - | - | - |
| Finančný reporting & eKasa | **W** | - | - | - | - | - | - |
| Podpísanie GDPR / Onboarding | - | - | - | - | - | - | **W** |
| Zobrazenie karty klienta (Základ) | **R** | **R** | **R** | **R** | **R** | **R** | **R** |
| Ortopedická anamnéza & Nálezy | **R** | **W** | **R** | - | - | - | **R** |
| Fyzio diagnostika & Karta | **R** | **R** | **W** | - | **R** | - | **R** |
| Zápis z masáží | **R** | - | **R** | **W** | - | - | **R** |
| Tréningový denník & Diagnostika | **R** | - | **R** | - | **W** | - | **R** |
| Nutričný plán & Merania | **R** | - | - | - | - | **W** | **R** |
| Nahrávanie príloh (MR, RTG, PDF) | **W** | **W** | **W** | - | **W** | **W** | **R** |
| Správa kalendára (Vlastný/Tím) | **W** | **W** | **W** | **W** | **W** | **W** | - |
| Rezervácia / Storno termínu | **W** | - | - | - | - | - | **W** |

*Vysvetlivky: **W** (Write/Edit/Delete - Zápis a úprava), **R** (Read-Only - Iba čítanie), **-** (Žiadny prístup)*

---

## 3. DÁTOVÝ MODEL & SUPABASE POSTGRESQL SCHÉMA

Pre dosiahnutie maximálneho výkonu, bezpečnosti a integrity dát je v Supabase nasadená nasledujúca štruktúra. Všetky tabuľky využívajú **Row Level Security (RLS)** a indexy na cudzích kľúčoch.

```sql
-- 1. ZÁKLADNÉ ROŠÍRENIA & ENUMY
create type public.user_role as enum (
  'admin', 'ortoped', 'fyzioterapeut', 'maser', 'trener', 'nutricny', 'klient'
);

create type public.medical_card_type as enum (
  'ortoped', 'fyzio', 'masaz', 'trening', 'nutricia'
);

create type public.reservation_status as enum (
  'pending', 'confirmed', 'cancelled_by_client', 'cancelled_by_staff', 'no_show'
);

-- 2. TABUĽKA PROFILOV (public.profiles)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role public.user_role not null default 'klient',
  first_name text not null,
  last_name text not null,
  phone text,
  gdpr_accepted_at timestamp with time zone,
  gdpr_version text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. ZDRAVOTNÉ KARTY (public.medical_cards)
create table public.medical_cards (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  created_by uuid references public.profiles(id) on delete restrict not null,
  type public.medical_card_type not null,
  pain_map_data jsonb default '[]'::jsonb, -- Pole kliknutých bodov a hodnôt
  form_data jsonb default '{}'::jsonb not null,  -- Flexibilné polia formulára
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. PRÍLOHY (public.attachments)
create table public.attachments (
  id uuid default gen_random_uuid() primary key,
  medical_card_id uuid references public.medical_cards(id) on delete cascade not null,
  storage_path text not null,
  file_type text not null,
  file_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. REZERVÁCIE (public.reservations)
create table public.reservations (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  staff_id uuid references public.profiles(id) on delete restrict not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status public.reservation_status default 'pending'::public.reservation_status not null,
  cancelled_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint check_dates_order check (start_time < end_time)
);

-- 6. AUDITNÝ LOG (public.audit_logs)
create table public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid, -- ID používateľa, ktorý zmenu vykonal
  table_name text not null,
  action text not null, -- 'INSERT', 'UPDATE', 'DELETE'
  record_id uuid not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### Indexovanie (Výkonnosť)
Pre optimalizáciu dopytov sú vytvorené nasledujúce indexy:
```sql
create index idx_profiles_role on public.profiles(role);
create index idx_medical_cards_client_id on public.medical_cards(client_id);
create index idx_medical_cards_type on public.medical_cards(type);
create index idx_attachments_card_id on public.attachments(medical_card_id);
create index idx_reservations_client_id on public.reservations(client_id);
create index idx_reservations_staff_dates on public.reservations(staff_id, start_time);
create index idx_medical_cards_form_data on public.medical_cards using gin (form_data);
```

### Row Level Security (RLS) a Bezpečnosť
RLS je povolené na všetkých tabuľkách. Nižšie sú definované hlavné politiky (Policies) pre prístup k citlivým dátam:

```sql
alter table public.profiles enable row level security;
alter table public.medical_cards enable row level security;
alter table public.attachments enable row level security;
alter table public.reservations enable row level security;
alter table public.audit_logs enable row level security;

-- Politiky pre public.profiles:
-- Každý si môže čítať svoj profil. Zamestnanci môžu čítať všetky profily. Admin môže upravovať.
create policy "Používatelia môžu čítať vlastný profil" on public.profiles
  for select using (auth.uid() = id);

create policy "Zamestnanci môžu vidieť všetky profily" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role in ('admin', 'ortoped', 'fyzioterapeut', 'maser', 'trener', 'nutricny')
    )
  );

-- Politiky pre public.medical_cards:
-- Klient vidí iba svoje karty.
-- Ortopéd a fyzioterapeut vidia všetko. Maséri/tréneri/nutriční vidia iba to, na čo majú oprávnenie v RBAC matici.
create policy "Klienti vidia vlastné zdravotné záznamy" on public.medical_cards
  for select using (client_id = auth.uid());

create policy "Špecialisti s právom zápisu alebo čítania" on public.medical_cards
  for all using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role in ('admin', 'ortoped', 'fyzioterapeut')
    )
  );
```

### Audit Log Triggery
Záruka nemenného logovania každej zmeny v zdravotných kartách:
```sql
create or replace function public.process_audit_log()
returns trigger as $$
begin
  insert into public.audit_logs (user_id, table_name, action, record_id, old_data, new_data)
  values (
    auth.uid(),
    TG_TABLE_NAME,
    TG_OP,
    coalesce(new.id, old.id),
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger audit_medical_cards_trigger
after insert or update or delete on public.medical_cards
for each row execute function public.process_audit_log();
```

---

## 4. UI/UX A FRONTEND ŠPECIFIKÁCIA (VERCEL WEB INTERFACE COMPLIANCE)

Celý frontend musí striktne dodržiavať nasledujúce vizuálne a prístupnostné pravidlá.

### 4.1 Základné smernice a prístupnosť
* **Mobilné rozloženie (Mobile-First):** Všetky ovládacie prvky musia mať dotykovú plochu minimálne **44x44px** pre zamedzenie chybného kliknutia na mobile.
* **Prístupnosť (ARIA):** 
  - Všetky ikony bez textu (napr. zatvorenie modalu, tlačidlo Späť) musia obsahovať atribút `aria-label`.
  - Dekoratívne ikony musia byť označené ako `aria-hidden="true"`.
  - Dynamické hlásenia o chybách a úspechoch musia používať `aria-live="polite"`.
* **Typografia a Písmo:** Použiť systémové bezpätkové písmo s vysokou čitateľnosťou na displejoch (napr. *Inter* alebo *Outfit* z Google Fonts). Nadpisy musia využívať `text-wrap: balance` na zabránenie jednoslovným riadkom (widows). Namiesto troch bodiek `...` písať špeciálny znak výpustky `…`.

### 4.2 Špecifické klientske komponenty

#### A. GDPR Gate (Registračný Onboarding)
* **Zadanie:** Používateľ je zablokovaný na celoobrazovkovej clone, kým neudelí povinné súhlasy.
* **UX pravidlo:** Tlačidlo "Pokračovať" je zakázané (`disabled`), kým nie je zaškrtnutý povinný súhlas so spracovaním zdravotných údajov. Pri prebiehajúcej registrácii sa zobrazí spinner s textom `"Ukladám…"` a tlačidlo sa zablokuje, aby sa predišlo duplicitnému odoslaniu formulára.
* **Technický detail:** Loguje sa presný timestamp, verzia zmluvných podmienok a IP adresa používateľa. Supabase Edge Function vygeneruje na pozadí PDF o udelení súhlasu a uloží ho do úložiska klienta.

#### B. Interaktívna Mapa Bolesti (Pain Map)
* **Návrh:** Komponent s vektorovým SVG (predná a zadná silueta ľudského tela).
* **Interaktivita:** 
  1. Používateľ klikne/ťukne na anatomickú oblasť (napr. *Pravé koleno*).
  2. Zobrazí sa posuvník (VAS škála 0-10) s možnosťou rýchleho výberu a textovým poľom pre slovný popis.
  3. Pre dotykové displeje musí byť zväčšená citlivá oblasť kliknutia (hit target).
* **Klávesnica a ARIA:** Výber anatomických oblastí musí byť dosiahnuteľný pomocou klávesu Tab, pričom vybraný bod musí mať jasne viditeľný obrys (`focus-visible:ring-2 focus-visible:ring-primary`). Každý bod má `aria-label="Označenie bolesti pre Pravé koleno"`.

#### C. Prehrávač Cvičení (Video Library)
* **Zadanie:** Zobrazenie videonávodov domáceho cvičenia bez zbytočného spomaľovania siete.
* **Výkonové pravidlá:**
  - Videa musia byť optimalizované vo formáte `.mp4` / `.webm` s nízkym dátovým tokom.
  - Všetky `<video>` tagy musia obsahovať atribúty `muted loop playsinline autoplay` pre tiché slučkové prehrávanie bez zásahu používateľa.
  - Musia byť nastavené explicitné atribúty `width` a `height` pre zamedzenie nežiaducich posunov obsahu (CLS - Cumulative Layout Shift).
  - Použiť lazy loading (prehrávač sa načíta až vo chvíli, keď sa dostane do zorného poľa používateľa pomocou `IntersectionObserver`).

---

## 5. STRATÉGIA TESTOVANIA (TDD / TEST-DRIVEN DEVELOPMENT)

Každý vývojár píše testy pred samotnou implementáciou kódu podľa nasledovnej štruktúry:

### 5.1 Testovanie GDPR Onboardingu (Frontend & API)
* **Test Case 1:** Overenie, že bez zaškrtnutia povinného GDPR checkboxu nie je možné odoslať registráciu a tlačidlo má stav `disabled`.
* **Test Case 2:** Overenie úspešného zápisu hodnôt `gdpr_accepted_at` a `gdpr_version` do profilu klienta pri úspešnom odoslaní.
* **Test Case 3:** Test vyvolania Supabase Edge Function pre generovanie PDF a jeho prítomnosti v Storage.

### 5.2 Testovanie RLS Bezpečnosti (Backend / DB)
* **Test Case 1 (Izolácia dát):** Prihlásený používateľ s rolou `klient` sa pokúsi prečítať kartu iného klienta. Dotaz musí vrátiť prázdny výsledok alebo chybu `403 Forbidden`.
* **Test Case 2 (RBAC Zápis):** Používateľ s rolou `maser` sa pokúsi zapísať nález do modulu `ortoped`. Systém musí zápis zamietnuť. Zápis do modulu `masaz` musí prejsť.
* **Test Case 3 (Audit Stopa):** Overenie, že po úprave záznamu v `medical_cards` sa v tabuľke `audit_logs` vytvoril nový riadok s presným detailom starých a nových dát.

### 5.3 Testovanie Rezervačnej Logiky (Business Rules)
* **Test Case 1 (Pravidlo 24 hodín):** Rezervácia začína o 25 hodín. Klient ju zruší. Rezervácia sa úspešne označí ako `cancelled_by_client` a neúčtuje sa storno poplatok.
* **Test Case 2 (Neskoré storno):** Rezervácia začína o 10 hodín. Klient sa ju pokúsi zrušiť. API vráti chybu `400 Bad Request` s odkazom na porušenie storno podmienok.
* **Test Case 3 (Zrážka kreditu):** Overenie, že po neskorom storne rezervácie administrátorom sa vygeneruje interný finančný záznam o prepadnutí zálohy.