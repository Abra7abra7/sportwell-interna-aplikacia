# Glossary

## Tréningový plán (Training Plan)
Zoznam cvičení predpísaný klientovi. Na produkcii bude táto entita normalizovaná do dvoch relačných tabuliek:
1. `training_plans` (hlavička plánu)
2. `training_plan_exercises` (jednotlivé cviky s parametrami ako série, opakovania, tempo), čím sa nahradí doterajší prístup s ukladaním do JSONB poľa.

## Nástroj na synchronizáciu (Database Sync)
Na správu schémy a udržanie synchronizácie medzi databázou a kódom sa používa **Supabase CLI**. Nechceným anomáliám sa vyhneme generovaním TypeScript typov priamo z databázy, čím sa zachová plná kompatibilita s RLS (Row Level Security) politikami.

## Architektúra aplikácie (Frontend)
Aplikácia prechádza z monolitického "God Component" (`page.tsx`) prístupu na štandardnú hierarchiu routingu cez **Next.js App Router**. To zahŕňa rozdelenie na samostatné moduly (napríklad dashboard, klienti, diagnostika, verejný GDPR formulár) s využitím Server Components na optimalizáciu výkonu a odstránenie globálneho klientskeho stavu.

## Priradenie klienta (Client Assignment)
Klient nie je globálne viditeľný pre všetkých zamestnancov. Klient je explicitne priradený k jednému alebo viacerým špecialistom (vzťah M:N). Iba takto priradení špecialisti (a Administrátor) majú prístup k jeho profilu a zdravotným záznamom.

## Zamestnanec vs Tréner (Employee Role)
Z technického a databázového hľadiska zostáva jednotná rola `trener`, ktorá pokrýva všetky odborné profesie na klinike (fyzioterapeut, masér, výživový poradca, tréner). Majú rovnaké technické oprávnenia. V používateľskom rozhraní (UI) a doménovom jazyku sa táto skupina označuje súhrnným názvom **Zamestnanec**.

## Prihlasovanie klienta (Authentication)
Pre dosiahnutie čo najlepšieho UX (najmä na mobilných zariadeniach) sa pri klientoch používa **Magic Link** (Overenie bez hesla). Používateľ si na email pošle odkaz, ktorým sa jedným klikom prihlási a zároveň overí.

## Zástupný GDPR súhlas (Proxy Consent)
Kým nie je udelený súhlas s GDPR, klient je v stave "Onboarding" a nemal by s ním byť vykonávaný štandardný proces. Avšak Zamestnanec **má oprávnenie** udeliť zástupný GDPR súhlas v mene klienta (napr. na základe papierového podpisu na klinike), čím klienta manuálne "Aktivuje" a získa možnosť vytvoriť pre neho diagnostiku.
