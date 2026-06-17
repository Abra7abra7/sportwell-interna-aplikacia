# Disaster Recovery a Migračný Plán

Tento dokument je kľúčový pre **majiteľa firmy**. Definuje presné postupy, čo robiť v prípade pádu systému alebo potreby preniesť aplikáciu z cloudu na vlastný slovenský server (napr. z dôvodu právnych alebo firemných zmien).

## SCENÁR A: Totálny výpadok (Pád Supabase alebo Vercel)

Architektúra je postavená na gigantoch (Amazon Web Services a Edge Node), takže šanca na totálny výpadok je nízka, no ak nastane:

### 1. Ak padne aplikácia (Vercel)
Aplikácia ukazuje error (napr. 500) alebo sa vôbec nenačíta, ale viete sa prihlásiť do databázy Supabase.
**Riešenie:**
1. Next.js kód aplikácie nie je vázaný na Vercel. 
2. Stiahnite kód z repozitára (Github).
3. Prenajmite si akýkoľvek slovenský hosting podporujúci Node.js (napr. WebSupport VPS, Websigla).
4. Nahrajte kód na server a spustite príkazy `npm install`, `npm run build`, `npm start`. Aplikácia do 10 minút opäť beží.

### 2. Ak padne databáza a používatelia sú vymazaní (Hack alebo chyba zamestnanca)
Vaše dáta sú chránené cez PITR (Point-in-Time Recovery) v Supabase.
**Riešenie:**
1. Otvorte administráciu Supabase (supabase.com).
2. Choďte do `Database` -> `Backups`.
3. Ak používate Pro Plan, máte tam denné zálohy za posledných 7 dní.
4. Kliknite na včerajšiu zálohu a zvoľte **Restore**. Databáza sa vráti presne do stavu, v akom bola, a nič nie je stratené.
5. *Preventívne opatrenie:* Raz týždenne spustite skript na stiahnutie kompletnej zálohy (tzv. `pg_dump`) vo formáte `.sql` k sebe na harddisk alebo Google Drive. Tým máte dáta fyzicky u seba bez ohľadu na cloud.

---

## SCENÁR B: Nutnosť odísť z cloudu a spustiť to na vlastnom serveri (On-Premise Migrácia)

Ak sa zmení legislatíva, alebo klient povie: *"Nechceme mať žiadne dáta v cloude, ani nemeckom. Chceme mať fyzický počítač s dátami u nás na klinike v serverovni."*

Je to plne realizovateľné. Supabase aj Next.js sú tzv. **Open-Source** technológie, za ktoré nikomu neplatíte licenčné poplatky a nepatria korporátom.

### Postup migrácie na vlastný server:
1. **Fyzický server:** Na klinike sa zapojí fyzický server so systémom Linux (Ubuntu) a pripojí sa na pevnú IP adresu a internet.
2. **Dockerizácia Supabase:** Supabase uvoľňuje svoj systém verejne. Nainštalujete na server systém Docker a pomocou jedného príkazu (`docker-compose up`) sa na Vašom fyzickom serveri rozbehne lokálna verzia Supabase (PostgreSQL databáza, Storage, Auth).
3. **Migrácia Dát:** Urobíte `pg_dump` dát z cloudu a nahráte ich (Import) do Vašej lokálnej databázy na klinike. Prekopírujete priečinky so Storage súbormi (PDFka a obrázky).
4. **Nasadenie Aplikácie (Kódu):** Pomocou príkazu `npm run build` skompilujete zdrojový kód Next.js priamo na tomto servery a spustíte ho v pozadí cez nástroj `PM2`.
5. **Zmena domény:** Vo Vašej doméne `sportwell.sk` presmerujete záznamy na IP adresu Vášho servera v klinike.

**Výsledok:** Rovnaká aplikácia, rovnaké prihlasovanie, ale všetky dáta sú fyzicky zamknuté na harddisku v budove kliniky a nikto cudzí k nim nemá prístup. Aplikácia bude po lokálnej Wi-Fi sieti dokonca fungovať aj v prípade výpadku celoslovenského internetu.
