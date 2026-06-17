# Prevádzková a Vývojárska Príručka

Tento dokument je určený pre vývojárov, ktorí preberajú, udržiavajú alebo rozširujú kód aplikácie SportWell.

## 1. Štruktúra Projektu (Next.js App Router)
Kód sa nachádza v priečinku `src/app/` a používa logické rozdelenie do skupín (Route Groups):

- `(auth)/login`: Verejná zóna pre prihlasovanie (OTP).
- `(dashboard)/`: Uzavretá zóna, chránená pomocou `layout.tsx`, ktorý plní funkciu **Route Guardu**. Neprihlásení sú okamžite presmerovaní na login. Klienti bez GDPR sú okamžite presmerovaní na `/(dashboard)/gdpr`.
- **Komponenty (`src/components/`)**: Sú organizované podľa modulov (napr. `/diagnostics`, `/forms`, `/training`, `/gdpr`).

## 2. Spúšťanie projektu

### Inštalácia
```bash
npm install
```

### Lokálny Vývoj (Development)
```bash
npm run dev
```
Prihlásenie lokálne je možné, ale aplikácia musí byť napojená na fungujúci projekt Supabase (`NEXT_PUBLIC_SUPABASE_URL` a `NEXT_PUBLIC_SUPABASE_ANON_KEY` v súbore `.env.local`).

### Produkčný Build (Production)
```bash
npm run build
npm start
```
V produkcii Next.js aplikáciu predkompiluje, čím sa dosiahne extrémne rýchle načítanie a vygeneruje sa Service Worker pre funkciu PWA (Progressive Web App).

## 3. Práca s Databázou (Supabase)
Všetky zmeny v schéme databázy sa **musia** vykonávať cez SQL Migrácie v zložke `supabase/migrations/`. Zabezpečí sa tým prenosnosť a história.

Ak pridáte novú tabuľku alebo stĺpec v Supabase cez webové rozhranie, nesmiete ju zabudnúť zapísať do migračného súboru v kóde.

## 4. Ochrana osobných údajov a Client/Server Components
Aplikácia kombinuje Server Components (pre rýchle generovanie statických obalov a SEO/PWA meta tagov) a Client Components (`"use client"`).
- Osobné údaje sa do aplikácie ťahajú cez `createClient()` a sú načítavané asynchrónne z databázy.
- Vždy overte, že RLS (Row Level Security) politiky pokrývajú všetky operácie `SELECT`, `INSERT`, `UPDATE` aj `DELETE` pre danú entitu.

## 5. Odstraňovanie Závad a Debugging
- Ak klient hlási pomalé načítavanie obrázkov, skontrolujte, či sú uložené v Supabase Storage a či nemajú veľkosť 10+ MB.
- Ak sa niekomu nezobrazuje klient v zozname, skontrolujte tabuľku `client_specialist_assignments`, či ho má priradeného, alebo či RLS politiky pre danú rolu nezlyhávajú.
