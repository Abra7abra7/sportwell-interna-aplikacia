# Glossary

## Tréningový plán a Databáza Cvičení (Training Plan & Exercises)
Zoznam cvičení predpísaný klientovi. V rámci MVP prechádzame z pôvodného JSONB ukladania na plne relačný model, ktorý obsahuje:
1. Globálnu knižnicu cvičení (`exercises`) s podporou custom cvikov.
2. Hlavičku tréningového plánu (`training_plans`).
3. Spojovaciu tabuľku predpísaných cvikov (`plan_exercises`).
4. Tabuľky pre trackovanie reálne odovzdaného výkonu klienta (`client_workout_logs` a `client_workout_log_sets`) pre potreby štatistík a merania progresu.

## Nástroj na synchronizáciu (Database Sync)
Na správu schémy a udržanie synchronizácie medzi databázou a kódom sa používa **Supabase CLI**. Nechceným anomáliám sa vyhneme generovaním TypeScript typov priamo z databázy, čím sa zachová plná kompatibilita s RLS (Row Level Security) politikami.

## Architektúra aplikácie (Frontend & PWA)
Aplikácia využíva **Next.js App Router** s rozdelením na samostatné moduly (dashboard, klienti, diagnostika, verejný GDPR formulár) a Server Components na odstránenie globálneho klientskeho stavu.
Pre podporu **PWA (Progressive Web App)** sa využíva knižnica **Serwist**, ktorá natívne podporuje Next.js **Turbopack** kompilátor. Staršie pluginy vyžadujúce `--webpack` flag sú z dôvodu výkonu (DX) zakázané.

## Priradenie klienta (Client Assignment)
Klient nie je globálne viditeľný pre všetkých zamestnancov. Klient je explicitne priradený k jednému alebo viacerým špecialistom (vzťah M:N). Iba takto priradení špecialisti (a Administrátor) majú prístup k jeho profilu a zdravotným záznamom.

## Roly Zamestnancov a Ochrana Dát (Employee Roles & Privacy)
Z technického a databázového hľadiska sa pôvodná jednotná rola rozdeľuje na špecifické roly s ohľadom na GDPR a lekárske tajomstvo. 
Zavedené sú granulárne roly: `fitness_trener`, `fyzioterapeut`, `maser`, `nutricny_poradca`, `lekar`, `recepcia`, `majitel` a `admin`. 
Každá rola má striktne oddelené oprávnenia cez RLS (napríklad fitness tréner nemá prístup k zdravotným záznamom od lekára). V používateľskom rozhraní sa táto skupina naďalej môže označovať súhrnným názvom **Zamestnanec**, no prístup k dátam klienta je segregovaný na základe odbornej spôsobilosti.

## Prihlasovanie klienta a zamestnancov (Authentication)
Pre elimináciu technických problémov s krížovým otváraním odkazov v in-app prehliadačoch (zlyhania PKCE) aplikácia využíva **OTP (One-Time Password) kódy**. 
Používateľ si na e-mail vyžiada 6-miestny kód, ktorý následne priamo zadá do aplikácie. Tento prístup zaisťuje plynulé UX bez prerušenia procesu prihlasovania, keďže používateľ nikdy neopúšťa okno prehliadača, z ktorého požiadavku inicioval.

## Zástupný GDPR súhlas (Proxy Consent)
Kým nie je udelený súhlas s GDPR, klient je v stave "Onboarding" a nemal by s ním byť vykonávaný štandardný proces. Avšak Zamestnanec **má oprávnenie** udeliť zástupný GDPR súhlas v mene klienta (napr. na základe papierového podpisu na klinike), čím klienta manuálne "Aktivuje" a získa možnosť vytvoriť pre neho diagnostiku.
