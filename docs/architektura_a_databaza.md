# Architektúra a Databázový Model
Verzia: SportWell v3.0 (Fáza 1 MVP)

Tento dokument opisuje technické pozadie a dátový model aplikácie.

## 1. Technologický Stack
- **Frontend:** Next.js 16.2.7 (App Router), React 19, Tailwind CSS v4
- **Backend:** Supabase (PostgreSQL 15+)
- **Hosting:** Určené pre Vercel (Frontend) a Supabase Cloud (Backend)
- **PWA (Progressive Web App):** Implementované cez knižnicu `@serwist/next` (s `webpack` kompilátorom kvôli kompatibilite pluginov).

## 2. Databázový Model (16 Aktívnych Tabuliek)
Základný relačný model sa skladá z nasledujúcich prepojených entít:

### Jadro a Používatelia
1. **`profiles`**: Centrálna tabuľka pre všetkých. Rozlišuje ľudí pomocou stĺpca `role` (admin, majitel, fyzioterapeut, trener, klient).
2. **`employee_invitations`**: Zoznam čakajúcich pozvánok pre nových zamestnancov.
3. **`client_invitations`**: Zoznam predregistrovaných klientov (čakáreň). Z tohto sa pri Onboardingu vytvára plnohodnotný `profile`.
4. **`client_specialist_assignments`**: Mapovacia (M:N) tabuľka, ktorá priraďuje klientov ku konkrétnym trénerom.

### Prístupové Práva (RBAC)
5. **`modules`**: Zoznam modulov v aplikácii (Napr. `diagnostika`, `klienti`, `cviky`).
6. **`role_permissions`**: Definuje, či má daná `role` právo na `can_read`, `can_write`, `can_delete` pre daný modul. Týmto sa dynamicky vykresľuje ľavé menu.

### Diagnostika a Súbory
7. **`form_templates`**: JSONB schémy dynamických formulárov (napr. FMS, InBody).
8. **`client_records`**: Konkrétne vyplnené záznamy podľa šablón zviazané s klientom.
9. **`documents`**: Tabuľka pre vygenerované PDF zmluvy a reporty. Naviazaná na Storage bucket `client_documents`.

### Tréningy a Cviky
10. **`exercises`**: Knižnica cvikov. Podporuje globálne cviky aj `is_custom` cviky vytvorené len konkrétnym trénerom.
11. **`training_plans`**: Hlavička tréningového plánu pridelená klientovi.
12. **`plan_exercises`**: Cviky predpísané do konkrétneho plánu.
13. **`client_workout_logs`**: Denník odcvičených tréningov.
14. **`client_workout_log_sets`**: Konkrétne zaznamenané váhy a opakovania klienta počas tréningu.

### Modul Rezervácie (Pripravené)
15. **`reservations`**: Tabuľka pripravená na prepojenie kalendára (Fáza 2).
16. **`audit_logs`**: Systémová tabuľka pre zaznamenávanie zmien na kritických záznamoch.

## 3. Row Level Security (RLS) a Izolácia
Bezpečnosť je riešená výhradne na úrovni RLS v PostgreSQL. Next.js aplikácia nikdy nekomunikuje pod "admin" kľúčom (Service Role Key), ale vždy pod používateľským kľúčom (Anon Key + JWT). 
RLS zaručuje, že SQL príkaz `SELECT * FROM profiles` vráti trénerovi **iba** jeho priradených klientov, zatiaľ čo Administrátorovi (cez `has_role_permission`) vráti všetkých.

## 4. Systém súborov a Storage
Systém používa 3 separátne Supabase Buckets:
- `client_documents`: (Súkromné) PDF zmluvy a vygenerované GDPR súhlasy. Prístup má iba zamestnanec a vlastník dokumentu (klient).
- `client_records_files`: (Súkromné) Obrázky a fotky nahraté do dynamických diagnostických formulárov.
- `exercise_videos`: (Verejné) Obrázky a videá k cvikom. Verejné čítanie pre aplikáciu, aby sa minimalizovala latencia načívania.
