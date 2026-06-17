# Prevádzka, Bezpečnosť a Rozvoj Aplikácie SportWell (Fáza 2+)

Tento dokument slúži ako strategický plán pre majiteľa a vývojový tím na zabezpečenie dlhodobej stability, bezpečnosti a možností škálovania aplikácie SportWell.

---

## 1. Architektúra a Budúce Škálovanie (Pridávanie Modulov)

**Odpoveď na tvoju otázku:** *Dá sa na tom ďalej stavať? Viem neskôr pridávať nové moduly typu platby, rezervácie na tréningy?*

**Áno, absolútne.** Architektúra, ktorú sme nastavili (Next.js 16 + Supabase + Tailwind CSS v4 s izoláciou RLS a Maticou oprávnení), je **enterprise-grade štandard**. Nie je to "zlepenec" na kolene, ale robustný základ pripravený rásť.

*   **Rezervácie a Kalendár:** Dáta klientov už máme. Modul kalendára bude len nová tabuľka v Supabase (`bookings` alebo `appointments`) prepojená na existujúce tabuľky `profiles` (Kto) a `profiles` s rolou tréner (S kým). 
*   **Platby a Predplatné (Stripe/GoPay):** Next.js App Router (na ktorom aplikácia beží) má vstavané bezpečné backendové funkcie (Server Actions a API routes). To znamená, že integrácia Stripe webhooks pre automatické platenie tréningov je priamočiara a vysoko bezpečná. Údaje o kartách nikdy nepôjdu cez tvoju databázu, ale spáruje sa to cez Supabase Auth.
*   **Vyťaženosť a Dashboardy pre majiteľa:** Vďaka tomu, že máš všetky dáta v PostgreSQL databáze, vieš si kedykoľvek pridať obrazovku `/dashboard/reporty`, ktorá z databázy vytiahne grafy vyťaženosti, finančné metriky a aktivitu trénerov.

> [!TIP]
> Modulárna štruktúra znamená, že ak pridáme platby, nepokazí to diagnostiku. Kód je striktne oddelený.

---

## 2. Zálohovanie Databázy (Supabase Pro Plan)

Keďže používaš **Supabase Pro Plan (25 € / mesiac)**, máš k dispozícii fantastické nástroje na ochranu dát, ktoré bežia automaticky:

### Automatické zálohy (Point-in-Time Recovery - PITR)
V Pro plane máš od Supabase garantované **denné automatické zálohy s retenciou 7 dní** (až 30 dní, ak si to priplatíš, tzv. PITR). 
*   Ak by niekto omylom vymazal dáta, Supabase ti umožňuje vrátiť databázu presne do bodu v čase (napr. včera o 14:23).
*   *Čo musíš urobiť ty:* V podstate nič, stačí si v Supabase Dashboarde v sekcii **Database -> Backups** overiť, že máš zálohovanie aktívne.

### Manuálne a Off-site Zálohovanie (Pre absolútnu istotu)
Aj napriek cloudu je dobrým zvykom mať "hard copy" dát:
*   Môžeš si nastaviť automatizovaný skript (napríklad pomocou Github Actions a príkazu `pg_dump`), ktorý ti raz týždenne stiahne celú databázu ako `.sql` súbor a šifrovane ho uloží na tvoj vlastný Google Drive alebo AWS S3. 
*   Toto ťa ochráni aj v hypotetickom scenári, že by Supabase úplne vypadlo.

---

## 3. Bezpečnosť a Zamedzenie Únikov Dát

Klienti ti zverujú citlivé údaje o svojom zdraví (diagnostiky, zmluvy). Systém sme od začiatku navrhli tak, aby to chránil:

1.  **Row Level Security (RLS) v Supabase:** Aplikácia neverí frontendu. Aj keby niekto šikovný skúsil zmeniť kód vo svojom prehliadači, samotná databáza mu dáta nevydá, kým si neoverí, že daný tréner má k danému klientovi povolený prístup.
2.  **Bezheslové prihlasovanie (OTP):** Keďže posielame kódy na email, nemôže dôjsť k tomu, že ti "heker" ukradne databázu so slabými heslami používateľov (napríklad "heslo123"). 

> [!IMPORTANT]
> **Kritické odporúčanie:** Ako majiteľ si pravidelne kontroluj, komu dávaš rolu `admin`. Admin vidí všetko. Ak odíde tréner, musíš mu okamžite zrušiť prístup alebo zmeniť jeho rolu.

---

## 4. Testovanie a Stabilita: Ako si byť istý, že sa nič nepokazí?

Aby ťa klient o mesiac nenaháňal, že niečo nefunguje, aplikácia musí prejsť z "vývojového" do "produkčného" cyklu kontroly kvality.

### A. Manuálne QA (Quality Assurance) a "Staging"
Zatiaľ aplikáciu spúšťame cez `localhost` a `npm run dev`. Pri nasadení je dôležité:
*   Mať **Dve prostredia**: 
    1. `staging.sportwell.sk` (kde sa testujú nové funkcie, napr. tie nové platby) - prepojené na testovaciu Supabase databázu.
    2. `app.sportwell.sk` (produkcia pre reálnych klientov).
*   Všetko nové ide najskôr na Staging, kde si to ako majiteľ a zopár trénerov "vyklikáte". Až keď to schváliš, presunie sa to na Produkciu.

### B. Automatizované Testovanie (E2E & Unit Testy)
Ak chceš skutočnú istotu, do projektu pridáme automatické testy. Slúžia ako "robotický používateľ", ktorý v zlomku sekundy otestuje celú aplikáciu po každej tvojej zmene kódu:
1.  **Playwright (E2E Testy):** Napíšeme test, ktorý automaticky otvorí prehliadač, "klikne" na prihlásenie, vyplní kód, otvorí klienta, klikne na diagnostiku a skúsi stiahnuť PDF. Ak by niečo v budúcnosti prestalo fungovať, test ihneď vyhodí chybu do terminálu, *ešte pred tým, ako to vôbec zverejníš na web*.
2.  **Unit Testy (Vitest/Jest):** Otestujú komplexnú matematiku (napr. výpočty BMI v InBody formulári), aby sme mali istotu, že sa čísla nezbláznili.

### C. Monitoring a Logovanie Chybných Stavov
*   Nasadenie nástroja ako **Sentry** (sentry.io).
*   Ak klientovi v prehliadači vyskočí chyba (napr. že sa nedá nahrať fotka), Sentry ti o tom okamžite pošle notifikáciu do e-mailu spolu so záznamom, o akého klienta išlo a kde v kóde to spadlo. Budeš o probléme vedieť skôr, než ti vôbec stihne klient zavolať, a vieš to hneď opraviť.

---

## 5. Zhrnutie: Tvoje najbližšie kroky (Go-To-Market)

1.  **Nasadenie (Deployment):** Nasadiť súčasný kód na Vercel (ideálny cloud pre Next.js) a prepojiť to na tvoju reálnu doménu (napr. `app.sportwell.sk`).
2.  **Založenie Produkčnej Databázy:** Oddeliť "hracie" (vývojové) prostredie v Supabase od ostrej produkcie, aby sa testovacie dáta nemiešali s reálnymi klientmi.
3.  **Beta Test s personálom:** Pustiť do toho najskôr 2-3 tvojich trénerov a pár "známych" klientov na 2 týždne, aby to aktívne používali a hľadali nezrovnalosti.
4.  **Integrácia Sentry:** Zapojiť Error Tracking (Sentry), aby si videl tiché chyby.
7.  **Spustenie "Ostrého" režimu** a prechod celej prevádzky na nový systém.

---

## 6. Potenciálne funkcie a vylepšenia (Backlog)
*   **GDPR Soft Delete (Ochranná lehota 30 dní):** Namiesto okamžitého zmazania klienta (Právo na zabudnutie) zavedieme 30-dňovú lehotu. Počas nej bude účet len skrytý (deaktivovaný z pohľadu trénerov a systému) s možnosťou obnovenia administrátorom v prípade prekliku.
*   **Hromadný e-mailový marketing:** Automatické prepojenie zoznamu GDPR súhlasov (newsletter) na systémy ako Mailchimp cez API.

---

## 7. Analytika a Vyťažovanie dát (Data Mining & AI)
Správne podotýkate, že sedíte na zlatej bani dát o zdraví, kondícii a správaní Vašich klientov. Keďže sú teraz dáta uložené štruktúrovane v PostgreSQL (a nie v starom WordPresse), možnosti sú obrovské. Tu je zoznam, ako z toho môže majiteľ vytlačiť maximum:

### A. Biznis inteligencia pre Majiteľa
1.  **Dashboard Vyťaženosti a Retencie:** 
    *   Sledovanie toho, ktorý tréner má najvyššiu retenciu (t.j. koľko z jeho priradených klientov u neho zostáva cvičiť dlhšie ako 3 mesiace).
    *   Aké časy počas dňa sú najviac a najmenej vyťažené (tzv. "Heatmap" prevádzky).
2.  **Churn Prediction (Predikcia odchodov cez AI):** 
    *   Algoritmus dokáže zistiť vzorec správania, keď klient začína "poľavovať" (predlžujú sa rozostupy medzi tréningami, klesá počet zadaných sérií v appke). Systém automaticky upozorní recepciu alebo manažéra: *"Pozor, klient Ján Novák stráca motiváciu, pošlite mu motivačnú zľavu na masáž."*
3.  **Cross-selling a Upselling:** 
    *   Ak klient dlhodobo navštevuje "Funkčný tréning", ale podľa záznamov nikdy nebol na Masáži alebo odbornej diagnostike, systém Vám po 10. tréningu navrhne ponúknuť mu doplnkovú službu so zľavou.

### B. Pridaná hodnota pre Klienta a Trénera
1.  **AI Asistent pre Tréningové Plány:** 
    *   Keď bude mať databáza stovky odjazdených tréningových plánov a diagnostík, vieme na ňu napojiť LLM (AI). Tréner si otvorí klienta a povie: *"Vygeneruj tréningový plán na chrbát, pričom vezmi do úvahy, že klient má podľa FMS diagnostiky zhoršenú mobilitu ramena."* AI z Vašej databázy cvikov vyberie tie najbezpečnejšie a navrhne plán, ktorý tréner už len skontroluje.
2.  **Klientsky Zdravotný Semafor:** 
    *   Z dát z inBody formulárov a pravidelných meraní vieme do klientskeho mobilného rozhrania nakresliť nádherné, interaktívne grafy progresu (napr. úbytok tuku vs. nárast svalovej hmoty). Tým klientovi vizuálne dokazujete, že investícia do Vašich trénerov sa mu reálne vracia na zdraví.

Všetky tieto "nadstavby" sa dajú do Supabase dorobiť v budúcnosti bez toho, aby to akokoľvek narušilo alebo spomalilo aktuálny základ aplikácie. Dáta sa z databázy budú len "čítať" na pozadí.
