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
Všetky rozhrania striktne dodržiavajú farebnú schému a typografické pravidlá. Aplikácia využíva moderný "glassmorphism", zaoblené hrany a jemné blur efekty pre prémiový dojem.

### HSL & HEX CSS Premenné (v `src/app/globals.css`):
- `--font-sans`: *Noto Sans* (subsets latin, latin-ext).
- **Základné farby:**
  - `brand-navy` (`#0A192F`): Tmavomodrá, základná farba pre texty a hlavné tlačidlá.
  - `brand-dark-navy` (`#020C1B`): Veľmi tmavá modrá pre pozadia panelov a tmavý režim prihlásenia.
  - `brand-cyan` (`#00F0FF`): Tyrkysová/azúrová farba pre akcenty, aktívne stavy a interaktívne body.
  - `brand-light-cyan` (`#D3FAFF`): Svetlá tyrkysová pre pozadia tlačidiel a jemné highlighty.
  - `brand-off-white` (`#F7FAFC`): Neutrálne svetlé pozadie pre klientske rozhranie.

### UX & Mobilné pravidlá (Mobile-First):
- **Zamedzenie zoomu na iOS:** Hlavička HTML obsahuje meta tag s `user-scalable=no` pre elimináciu zoomovania vstupných polí na iPhonoch.
- **Hit Targets:** Všetky klikateľné elementy majú minimálny dotykový rozmer **44x44px**.
- **Žiadne Hover-only interakcie:** Kvôli mobilným zariadeniam nesmú byť dôležité akcie skryté za hoverom.
- **Bottom Navigation Bar:** Pre rolu `klient` na mobilných zariadeniach je bočné menu nahradené dolným navigačným barom (Home, Moje Cviky, Dokumenty, Profil). Kvôli tomu je nutné udržiavať dostatočný spodný `padding-bottom` (napr. `pb-32` v `layout.tsx`), aby navigácia neprekrývala dôležitý obsah.

---

## 3. DÁTOVÝ MODEL & POSTGRESQL SCHÉMA

Databáza v Supabase pozostáva z nasledujúcich kľúčových entít v schéme `public`:

### A. Profiles (`public.profiles`)
Uchováva osobné údaje a roly prepojené s `auth.users`.
- `role` (enum `user_role`: `'admin'`, `'trener'`, `'klient'`). Špecialisti sú zjednotení pod rolou `'trener'`.
- `gdpr_signed_at` (timestamp). Ak je NULL, používateľ nemá prístup k aplikácii a musí prejsť Onboardingom.
- `metadata` (jsonb) pre ďalšie informácie (narodeniny, adresa, záujmy).

### B. Invitations a Čakáreň
- **`public.employee_invitations`**: Pozvánky pre nových zamestnancov odosielané administrátorom.
- **`public.client_invitations`**: Zoznam predregistrovaných klientov (čakáreň). Admin/Recepcia tu vytvorí záznam pri fyzickom príchode klienta, aby si klient neskôr nemusel ručne vypĺňať všetky údaje.

### C. Mapovanie Klient-Tréner (`public.client_specialist_assignments`)
Mapuje klientov na konkrétnych špecialistov (trénerov/adminov), aby tréneri videli iba svojich klientov.

### D. Diagnostika a Formuláre
- **`public.form_templates`**: Dynamické šablóny pre formuláre (jsonb schema).
- **`public.client_records`**: Záznamy o zdravotnom stave klienta na základe šablón.
- **Storage Bucket `client_records_files`**: Používa sa na ukladanie obrázkov a súborov z dynamických formulárov (napr. InBody sken, fotka držania tela).

### E. Tréningové Plány a Cviky
- **`public.exercises`**: Databáza cvikov. Novinkou je podpora priraďovania inštruktážnych obrázkov/videa cez Storage Bucket **`exercise_images`**.
- **`public.training_plans`**: Tréningové plány pre klientov. Plány po novom obsahujú aj pole `warmup_notes` pre zápis k rozcvičke.
- **`public.plan_exercises`**: Cviky priradené do plánu. Okrem základných parametrov (série, opakovania) uchovávajú aj `tempo`, `rpe` a `rest_between_exercises` (extra pauzu). Dáta plánu sú normalizované a bezpečne uložené v databáze.

### F. Dokumenty a PDF (`public.documents`)
- Evidencia zmlúv a generovaných PDF dokumentov.
- Využíva Storage Bucket **`client_documents`**.
- PDF súbory sa generujú na strane klienta knižnicou **html2pdf.js** (nahradila starý pdfMake kvôli problémom so zamŕzaním v Next.js pri spracovaní veľkých base64 obrázkov).

---

## 4. BEZPEČNOSŤ & RLS POLITIKY (ROW LEVEL SECURITY)

Všetky tabuľky majú zapnuté **RLS**. Aplikácia má prísnu izoláciu dát (Multi-Tenancy) pre jednotlivých špecialistov a využíva dynamickú Maticu Oprávnení (RBAC).

### A. RBAC Matica Oprávnení (`public.role_permissions`)
- Pri prihlásení (`AuthProvider.tsx`) si aplikácia prečíta rolu zamestnanca a stiahne si mapu oprávnení z databázy (či môže daný modul `read`, `write`, `delete`).
- Na základe týchto oprávnení sa napr. dynamicky vykresľuje ľavé menu (`layout.tsx`).
- Konfiguráciu matice spravuje Admin / Majiteľ na obrazovke `/nastavenia`.

### B. Izolácia Dát pre Špecialistov (Multi-Tenancy)
Na úrovni RLS sú striktne izolované kľúčové entity:
1. **Klienti (`public.profiles`)**: Tréneri a lekári v systéme vidia **iba tých klientov**, ktorí im boli priradení cez `client_specialist_assignments`. Neuvidia cudzích pacientov. Admin a Recepcia vidia všetkých (pomocou funkcie `has_global_client_access`).
2. **Cviky (`public.exercises`)**: Globálne cviky (`is_custom = false`) vidia všetci. Vlastné cviky (`is_custom = true`) vidí iba tréner, ktorý ich nahral (`created_by`), prípadne klient, ak má cvik priradený v aktívnom pláne. Tréner A nevidí cviky Trénera B.
3. **Tréningové Plány (`public.training_plans`)**: Špecialista vidí a môže editovať výhradne plány, ktoré sám vytvoril, alebo ktoré patria jeho priradenému pacientovi.

### C. Kľúčové roly (Základné správanie)
1. **Admin / Majiteľ:** Majú plný prístup všade. Majú hardcodovaný bypass v RLS (Super User pattern). Môžu spravovať zamestnancov a priraďovať klientov ku komukoľvek.
2. **Tréner / Lekár / Špecialista:** Riadený cez RBAC maticu a Multi-Tenancy RLS (vidí len svoje).
3. **Klient:** Vidí a upravuje **iba seba**. Vidí len svoje tréningové plány a svoje dokumenty. Nechodí do administrátorských sekcií.

---

## 5. ARCHITEKTÚRA, MODULY A MECHANIZMY

### A. Smerovanie a Route Guard
- `(auth)/login` pre prihlásenie.
- `(dashboard)/layout.tsx` obsahuje **Route Guard**:
  - Neprihlásených presmeruje na `/login`.
  - Prihlásených klientov, ktorí nemajú `gdpr_signed_at`, "uväzní" na `/gdpr` (Onboarding/Registrácia) a skryje im navigáciu aplikácie.

### B. Prihlasovanie (OTP Kódy)
- Autentifikácia prebieha **bez hesiel cez jednorazové 6-miestne OTP kódy** odosielané na email (technológia Supabase OTP).
- V prípade zadania nesprávneho alebo expirovaného OTP kódu UI ihneď zobrazí chybovú hlášku (stav `authError` v `AuthProvider`).
- `AuthProvider.tsx` načíta Session. Ak používateľ neexistuje v `profiles`, systém s ním jedná ako s novým klientom.
- Ak sa email prihlasujúceho zhoduje v tabuľke `employee_invitations`, stane sa z neho automaticky `trener`.

### C. Registrácia klienta (GDPR Onboarding)
Proces registrácie klienta je postavený na `/gdpr` stránke:
1. **Predvyplnenie:** Ak má klient záznam v `client_invitations` (z čakárne od recepcie), jeho meno, priezvisko a údaje sa z neho **automaticky predvyplnia**.
2. **Súhlasy a Osobné údaje:** Klient odsúhlasí podmienky a doplní zvyšné údaje.
3. **Upsert a PDF:**
   - Vygeneruje sa PDF s GDPR zmluvou (cez pdfmake), nahrá sa do `client_documents` a vloží sa do `documents`.
   - Vytvorí sa skutočný profil klienta (`upsert` do `profiles`) a zapíše sa `gdpr_signed_at`.
   - Záznam z `client_invitations` (čakárne) sa vymaže, čím je predregistrácia dokončená.
   - Klient je vpustený do aplikácie a vidí svoje cviky.

### C.1 E-mailové Pozvánky
Pri vytvorení klienta do čakárne z Admin rozhrania sa cez backend API (`/api/invite`) pomocou `SUPABASE_SERVICE_ROLE_KEY` zavolá `admin.inviteUserByEmail()`. Týmto sa klientovi z prostredia Supabase automaticky odošle profesionálny e-mail s pozvánkou do aplikácie. Ak daný e-mail už v systéme existuje, API to bezpečne ignoruje.

### C.2 Správa GDPR v Profile
Súhlasy (Marketing, Meta, Diagnostika) v sekcii *"Môj Profil"* sú pre klientov **uzamknuté (read-only)**. Toto zabraňuje právnemu nesúladu medzi reálnym stavom a vygenerovaným podpisovým PDF. Ak chce klient zmeniť súhlas, musí osobne na recepcii požiadať o vygenerovanie novej zmluvy. Tréneri a Admini si tieto súhlasy meniť môžu.

### D. File Upload Stratégia
- **PDF vygenerované zmluvy a reporty:** `client_documents` bucket (dokumenty).
- **Fotky k diagnostikám (InBody, držanie tela):** `client_records_files` bucket (naviazané na JSON dynamických formulárov).
- **Fotografie k cvikom a GIFy:** `exercise_images` bucket (určené pre vizuálne vysvetlenie cvikov).

### E. Vizuál a UX pre klientov
- Klientska sekcia (`/klienti` a `/klienti/[id]`) bola kompletne prerobená do moderného dizajnu využívajúceho Glassmorphism.
- Obsahuje vlastné UI komponenty pre Taby a Akordeóny bez použitia externých ťažkých UI knižníc.
- Na generovaných PDF dokumentoch (napríklad reporty z diagnostiky) sa štandardne zobrazuje logo a text **SportWell** spolu s adresou prevádzky pre profesionálny výstup.

---

## 6. ŠTRUKTÚRA ADRESÁROV A SÚBOROV

```text
/src
  /app                  
    /(auth)/login       # Verejná cesta (OTP Login)
    /(dashboard)        # Chránené cesty (Route Guard v layout.tsx)
      /dashboard        # Hlavný prehľad
      /diagnostika      # Dynamické formuláre špecialistov
      /dokumenty        # Zmluvy a PDF reporty
      /gdpr             # Onboarding pre nových/predregistrovaných klientov
      /klienti          # Zoznam klientov, čakáreň a ich profily (Tabbed view)
      /nastavenia       # Správa prístupových práv a modulov (Admin)
      /plan             # Tréningové plány
      /sablony          # Správa dynamických šablón pre diagnostiku
      /zamestnanci      # Správa zamestnancov a pozvánok (Admin)
      /cviky            # Správa databázy rehabilitačných cvikov
    globals.css         # Globálne štýly (Tailwind premenné a UI farby)
    layout.tsx          # Root layout
  
  /components           
    /providers/AuthProvider.tsx
    /forms              # Dynamické formuláre s podporou react-dropzone
    /layout             # Sidebar, Header, Mobile BottomNav
  
  /hooks                # Custom React hooky (napr. useClients pre čakáreň)
  /utils/supabase       # SSR / Browser klienti pre Supabase
  
/supabase
  /migrations           # PostgreSQL RLS politiky a definície tabuliek
```
