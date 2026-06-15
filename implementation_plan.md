# Fáza 3: Migrácia Dashboard Routov a Komponentov

Keďže Autentifikácia už plne beží na App Routeri s `AuthProvider`-om, môžeme presunúť jadro aplikácie (Zoznam klientov, Diagnostika, Plán). 

## User Review Required

> [!WARNING]
> Pôvodný súbor `useSportWellData.ts` sťahoval absolútne všetky dáta aplikácie hneď po prihlásení do jedného obrovského stavu v RAM (klienti, diagnózy, rezervácie, cvičenia). V Next.js (App Router) to **rozdelíme**:
> 1. Na stránke `/(dashboard)/klienti` sa načítajú len klienti.
> 2. Na stránke `/(dashboard)/diagnostika` sa načítajú len formuláre a záznamy.
> Zamedzíme tak duplicite, preťaženiu RAM a dlhému načítavaniu.

## Proposed Changes

### 1. Dashboard Layout & Navigácia
Vytvoríme centrálny obal pre prihlásených používateľov, ktorý zabezpečí, že neautorizovaný používateľ bude okamžite presmerovaný späť na `/login`.

#### [MODIFY] `src/app/(dashboard)/layout.tsx`
- Zahrnie `AuthProvider`.
- Pridá Bočný panel (Sidebar) pre administrátorov/trénerov a Spodnú navigáciu (Bottom Bar) pre klientov (z mobilného dizajnu definovaného v `page.tsx.bak`).

### 2. Rozdelenie Monolitu do Stránok

#### [NEW] `src/app/(dashboard)/klienti/page.tsx`
- Zoznam klientov s vyhľadávaním.
- Tabuľka s klientmi a prepojenie na detail (využitie existujúcich UI komponentov).

#### [NEW] `src/app/(dashboard)/diagnostika/page.tsx`
- Dynamický výber klienta.
- Renderovanie diagnostických formulárov (`ComplexDiagnosticsForm`, `KneeDiagnosticsForm` atď.).

#### [NEW] `src/app/(dashboard)/plan/page.tsx`
- Tréningové plány. Pre trénerov zoznam, kde môžu predpisovať cviky; pre klienta zoznam jeho vlastných cvikov.

### 3. Vytvorenie lokálnych dátových Hookov
Namiesto obrovského `useSportWellData.ts` vytvoríme menšie hooks, prípadne budeme dáta načítavať priamo cez Server Components:
#### [NEW] `src/hooks/useClients.ts`
#### [NEW] `src/hooks/useDiagnostics.ts`

---

# Fáza 4: Finálne vyčistenie (Cleanup)

Akonáhle Fáza 3 prebehne úspešne, projekt "vydezinfikujeme" podľa tvojej požiadavky na maximálnu čistotu.

#### [DELETE] `src/app/page.tsx.bak`
- Zmazanie masívneho pôvodného súboru so starým kódom.

#### [DELETE] `src/hooks/useSportWellData.ts`
- Zmazanie starého hooku po presunutí funkcionalít.

#### [DELETE] `src/hooks/useAuth.ts`
- Bude buď kompletne zmazaný, alebo integrovaný priamo do `AuthProvider.tsx`, aby sme nemali duplicitné súbory.

## Verification Plan

### Automated Tests
- Rozšírenie testov cez `vitest` o mockovanie Supabase volaní pri načítavaní zoznamu klientov.

### Manual Verification
- Testovanie roly `klient` vs `trener` - zobrazenie správneho menu (Bottom bar vs Sidebar).
- Overenie, že po vymazaní starého kódu nevznikol v projekte "dead code" (mŕtvy kód) a aplikácia bez chýb beží na `npm run build`.
