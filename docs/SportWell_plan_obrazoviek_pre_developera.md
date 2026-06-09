# SportWell — Detailný plán obrazoviek a štruktúry (pre AI developera)

> **Dátum:** jún 2026
> **Platforma:** responzívna webová aplikácia (prioritne tablet a mobil)
> **Stack:** (doplňte podľa dohody — odporúčame Next.js + Tailwind + TypeScript)
> **Autori špecifikácie:** (doplňte)

---

## 1. Prehľad rolí a prístupov

| Rola | Rozsah | Hlavné moduly |
|---|---|---|
| **Klient** | Iba svoje údaje | Profil, súhlasy, rezervácie, domáci plán, videá, spätná väzba |
| **Tréner** | Svojich klientov | Tréningová diagnostika, záťaž, domáce cvičenia |
| **Fyzioterapeut** | Svojich klientov | Fyzio vyšetrenie, terapia, cvičenia, kontrolné merania |
| **Ortopéd** | Svojich klientov | Ortopedické nálezy, odporúčania, kontraindikácie |
| **Nutričný poradca** | Svojich klientov | Výživa, anamnéza, jedálniček, ciele |
| **Admin** | Celá organizácia | Správa klientov, služieb, zamestnancov, platieb, štatistík |

**Zásada:** Jedna karta klienta prepája súhlas → vyšetrenie → tréning → rezerváciu → platbu → komunikáciu. Rozhranie sa mení podľa roly — každý vidí len relevantné údaje a funkcie.

---

## 2. Kompletný strom obrazoviek

```
SPORTWELL APP
│
├── [A] PRIHLASOVACIA OBRAZOVKA
│   ├── Login (email + heslo)
│   ├── Registrácia klienta (vstupný formulár)
│   └── Obnovenie hesla
│
├── [B] DASHBOARD (role-based)
│   ├── B1. Admin dashboard
│   │   ├── Mesacný prehľad (tržby, obsadenosť, výkon služieb/tímu)
│   │   ├── Porovnanie období
│   │   └── Rýchle štatistiky (noví klienti, no-show, storno)
│   │
│   ├── B2. Odborník dashboard (tréner/fyzio/ortopéd/nutričný)
│   │   ├── Dnešný harmonogram (nadchádzajúce rezervácie)
│   │   ├── Klienti čakajúci na kontrolu
│   │   └── Rýchle akcie (nové vyšetrenie, predpis cvičenia)
│   │
│   └── B3. Klient dashboard
│       ├── Najbližšia rezervácia
│       ├── Domáci plán na dnes (checklist)
│       ├── Odporúčané videá
│       └── Notifikácie
│
├── [C] KLIENTI (iba Admin a Odborníci)
│   ├── C1. Zoznam klientov
│   │   ├── Rýchle vyhľadávanie (meno, email, telefón)
│   │   ├── Filtre:
│   │   │   ├── Aktívny / Neaktívny
│   │   │   ├── Diagnóza
│   │   │   ├── Typ služby
│   │   │   ├── Priradený odborník
│   │   │   ├── Dátum poslednej návštevy
│   │   │   ├── Klienti bez platného GDPR
│   │   │   ├── Klienti s otvoreným domácim plánom
│   │   │   └── Klienti čakajúci na kontrolu
│   │   └── Zoznamový riadok: meno, status, posledná návšteva, najbližšia rezervácia, priradený odborník
│   │
│   └── C2. Karta klienta (podrobnosti)
│       ├── C2a. Osobné údaje
│       │   ├── Meno, priezvisko, adresa, dátum narodenia
│       │   ├── Email, telefón, kontaktná osoba
│       │   ├── Poisťovňa, poznámky
│       │   └── Tlačidlo "Upraviť"
│       │
│       ├── C2b. Súhlasy (GDPR)
│       │   ├── Prehľad všetkých súhlasov (checkboxy):
│       │   │   ├── Spracovanie osobných a zdravotných údajov
│       │   │   ├── Interná komunikácia (aplikácia / email / SMS)
│       │   │   ├── Posielanie domácich cvičení a odporúčaní
│       │   │   └── Marketingový súhlas (oddelený od zdravotných)
│       │   ├── Každý súhlas: verzia textu, dátum, čas, identita kto získal
│       │   ├── PDF potvrdenie (generované pri podpise)
│       │   ├── Pri zmene textu -> tlačidlo "Vyžiadať nový súhlas"
│       │   └── Informácia o právach klienta (prístup, oprava, výmaz, obmedzenie, prenositeľnosť)
│       │
│       ├── C2c. Zdravotná anamnéza
│       │   ├── Diagnózy
│       │   ├── Kontraindikácie
│       │   ├── Lieky
│       │   ├── Bolesti (aktuálne)
│       │   └── Prepojenie na diagnostické formuláre
│       │
│       ├── C2d. História spolupráce (časová os)
│       │   ├── Vyšetrenia
│       │   ├── Terapie
│       │   ├── Tréningy
│       │   ├── Poznámky
│       │   └── Filter podľa typu udalosti a dátumu
│       │
│       ├── C2e. Dokumenty
│       │   ├── GDPR PDF súhlasy
│       │   ├── Nálezy (PDF exporty)
│       │   ├── Exporty (anonymizované štatistiky)
│       │   └── Faktúry
│       │
│       └── C2f. Rezervácie klienta
│           ├── História rezervácií
│           └── Najbližšie rezervácie
│
├── [D] DIAGNOSTIKA (role-based formuláre)
│   ├── D1. Prehľad diagnostík klienta
│   │   ├── Zoznam všetkých vyšetrení (časová os)
│   │   ├── Porovnanie vstupnej a kontrolnej diagnostiky
│   │   └── Tlačidlo "Nové vyšetrenie"
│   │
│   ├── D2. Ortopéd — formulár
│   │   ├── Anamnéza
│   │   ├── Objektívny nález
│   │   ├── Diagnóza
│   │   ├── Indikácie
│   │   ├── Kontraindikácie
│   │   └── Odporúčanie
│   │
│   ├── D3. Fyzioterapeut — formulár
│   │   ├── Bolesť (lokalizácia, intenzita, charakter)
│   │   ├── Rozsahy pohybu (ROM)
│   │   ├── Špeciálne testy
│   │   ├── Svalová sila
│   │   ├── Terapia (vykonaná)
│   │   └── Progres
│   │
│   ├── D4. Tréner — formulár
│   │   ├── Výkonnostné testy
│   │   ├── Pohybové vzory
│   │   ├── Tréningové ciele
│   │   └── Záťažové limity
│   │
│   ├── D5. Nutričný poradca — formulár
│   │   ├── Stravovacie návyky
│   │   ├── Antropometria
│   │   ├── Ciele (hmotnosť, zloženie tela)
│   │   ├── Odporúčania
│   │   └── Kontrolné body
│   │
│   └── D6. Spoločné prvky formulárov
│       ├── Prednastavené šablóny
│       ├── Škály bolesti (vizuálne — číselná / tvárová škála)
│       ├── Fotodokumentácia (upload + anotácia)
│       ├── Prílohy a poznámky
│       └── Export do PDF (pre klienta / internú dokumentáciu)
│
├── [E] TRÉNINGOVÉ ZAŤAŽENIE A DOMÁCE PLÁNY
│   ├── E1. Predpis cvičenia (odborník → klientovi)
│   │   ├── Výber cvičenia z videoknižnice
│   │   ├── Dávkovanie: série, opakovania, tempo, pauza, frekvencia
│   │   ├── Poznámka ku cvičeniu
│   │   └── Tlačidlo "Odoslať klientovi"
│   │
│   ├── E2. Evidencia tréningového zaťaženia (komponenty)
│   │
│   │   | Komponent | Čo evidovať | Príklad | Výstup |
│   │   |---|---|---|---|
│   │   | Objem | počet sérií, opakovaní, minúty | 3 × 12 / 45 min | celková práca |
│   │   | Intenzita | RPE, % maxima, tep, tempo | RPE 7/10 | náročnosť |
│   │   | Frekvencia | počet jednotiek za týždeň | 3× týždenne | konzistencia |
│   │   | Hustota | pauzy, pomer práca/odpočinok | 60 s pauza | tolerancia záťaže |
│   │   | Progresia | zmena objemu/intenzity | +5 % za týždeň | riziko preťaženia |
│   │   | Subjektívna odpoveď | bolesť, únava, spánok | bolesť 2/10 | úprava plánu |
│   │
│   ├── E3. Klientsky pohľad — Domáci plán
│   │   ├── Zoznam cvičení na dnes
│   │   ├── Prehranie videa
│   │   ├── Checklist splnenia (označiť hotovo)
│   │   ├── Záznam bolesti/únavy po cvičení (1-10)
│   │   └── História splnenia
│   │
│   ├── E4. Kontrola odborníkom
│   │   ├── Prehľad splnenia (klient odcvičil / necvičil)
│   │   ├── Spätná väzba od klienta (bolesť, únava)
│   │   └── Úprava dávkovania
│   │
│   └── E5. Grafy progresu
│       ├── Pre klienta (jednoduché, motivačné)
│       └── Pre tím SportWell (podrobné, analytické)
│
├── [F] VIDEOKNIZNICA
│   ├── F1. Zoznam videí
│   │   ├── Každá položka: názov, kategória, cieľ, pomôcky, náročnosť, kontraindikácie, video, varianty
│   │   └── Filtre: časť tela, diagnóza, cieľ, náročnosť, pomôcky
│   │
│   ├── F2. Detail videa
│   │   ├── Prehrávač videa
│   │   ├── Popis cvičenia
│   │   ├── Varianty (ľahšia / ťažšia verzia)
│   │   ├── Odporúčané dávkovanie
│   │   └── Tlačidlo "Predpísať klientovi"
│   │
│   └── F3. Správa knižnice (Admin)
│       ├── Nahrať nové video
│       ├── Upraviť existujúce
│       └── Kategorizácia
│
├── [G] REZERVACNÝ SYSTÉM
│   ├── G1. Kalendár
│   │   ├── Zobrazenie: deň / týždeň / mesiac
│   │   ├── Služby, zamestnanci, miestnosti
│   │   ├── Kapacity a obsadenosť
│   │   └── Opakovanie rezervácií
│   │
│   ├── G2. Rezervácia (vytvorenie / úprava)
│   │   ├── Výber klienta (alebo nový klient)
│   │   ├── Výber služby
│   │   ├── Výber odborníka
│   │   ├── Výber termínu a času
│   │   ├── Potvrdenie
│   │   └── Zmena termínu / storno
│   │
│   ├── G3. Prevádzkové pravidlá
│   │   ├── Storno podmienky
│   │   ├── Blokácia času (dovolenky, prestávky)
│   │   ├── Čakacia listina
│   │   └── Notifikácie: email/SMS pripomienka, zrušenie, čakacia listina
│   │
│   └── G4. Rezervácie klienta (súčasť karty klienta)
│
├── [H] eKASA, PLATBY A REPORTING
│   ├── H1. Platby
│   │   ├── Pokladničné doklady
│   │   ├── Faktúry
│   │   ├── Platba kartou / hotovosťou
│   │   ├── Storno, refundácia
│   │   └── Každá platba viazaná na: rezerváciu, službu, klienta, odborníka
│   │
│   ├── H2. Prevádzkové reporty
│   │   ├── Tržby (deň / týždeň / mesiac / rok)
│   │   ├── Vyťaženosť (zamestnanci, miestnosti, typy služieb)
│   │   ├── Storno a nevyužité kapacity
│   │   └── No-show a neskoré zrušenia
│   │
│   ├── H3. Odborné reporty
│   │   ├── Typy diagnóz (distribúcia)
│   │   ├── Progres klientov
│   │   ├── Návratnosť klientov
│   │   └── Plánované kontroly
│   │
│   ├── H4. Manažérsky dashboard
│   │   ├── Mesačný prehľad
│   │   ├── Porovnanie období
│   │   └── Výkonnosť služieb / tímu
│   │
│   └── H5. Exporty
│       ├── Účtovníctvo
│       ├── GDPR export (kompletný export dát klienta)
│       ├── Anonymizované štatistiky
│       └── Reporting (pre internú potrebu — bez zbytočných citlivých dát)
│
└── [I] NASTAVENIA (Admin)
    ├── I1. Správa používateľov a rolí
    ├── I2. Správa služieb (typy, ceny, trvanie)
    ├── I3. Šablóny formulárov
    ├── I4. Nastavenia rezervačného systému (kapacity, pravidlá, notifikácie)
    ├── I5. Audit log (všetky zmeny v citlivých údajoch)
    └── I6. Zálohovanie a bezpečnosť
```

---

## 3. Toky používateľa (User Flows)

### 3.1. Prvý kontakt — registrácia klienta

```
1. Admin/odborník vytvorí klienta
2. Otvorí sa vstupný formulár (osobné údaje)
3. Nasleduje GDPR formulár so súhlasmi
4. Systém vygeneruje PDF potvrdenie
5. Klient je aktívny → možnosť rezervovať / vyšetriť
```

### 3.2. Diagnostika → Tréning → Domáci plán

```
1. Odborník otvorí kartu klienta
2. Prejde na Diagnostiku → Nové vyšetrenie (D2-D5 podľa roly)
3. Vyplní formulár (šablóna, škály, foto)
4. Exportuje nález do PDF
5. Prejde na E1 — Predpis cvičenia
6. Vyberie cvičenia z knižnice + nastaví dávkovanie
7. Odošle klientovi ako domáci plán
8. Klient vidí plán na svojom dashboarde (E3)
9. Po cvičení označí splnenie + zaznamená bolesť/únavu
10. Odborník skontroluje (E4) a upraví dávkovanie
```

### 3.3. Rezervácia → Platba

```
1. Klient / Admin vyberie službu a odborníka
2. Kalendár zobrazí voľné termíny (G1)
3. Potvrdenie rezervácie → notifikácia
4. Po službe: platba (H1) naviazaná na rezerváciu
5. V prípade storna: pravidlá (G3), refundácia
```

### 3.4. Reporting — mesačný prehľad

```
1. Admin otvorí H4 Manažérsky dashboard
2. Vidí tržby, vyťaženosť, porovnanie období
3. Export do PDF/Excel pre účtovníctvo
4. Samostatne: odborné reporty (typy diagnóz, progres)
```

---

## 4. Dátová štruktúra (kľúčové entity)

```
User
├── id, email, password_hash, rola (enum), active
├── profile: meno, priezvisko, adresa, datum_narodenia, telefon, kontaktna_osoba, poistovna
├── timestamps: created_at, updated_at, last_login
└── relationships: klienti (ak je odborník)

Client (rozšírenie User s rolou 'klient')
├── user_id (1:1)
├── status: active/inactive
├── assigned_experts[] (viazané na User[id] s rolami odborníkov)
├── consents[]
│   ├── type (enum: personal_data, health_data, communication, home_exercises, marketing)
│   ├── version (text verzie)
│   ├── granted_at, granted_by (kto získal)
│   ├── pdf_path
│   └── active boolean
├── medical_history
│   ├── diagnoses[], contraindications[], medications[], pains[]
│   └── updated_at
└── documents[] (GDPR PDF, nálezy, exporty, faktúry)

Examination
├── id, client_id, expert_id (User)
├── type: ortoped/fyzio/trener/nutricny
├── form_data (JSON — flexibilný podľa šablóny)
├── template_id (voliteľný)
├── photos[], attachments[]
├── pdf_export_path
├── is_follow_up (boolean — kontrolné vyšetrenie)
└── timestamps: created_at, updated_at

ExerciseVideo
├── id, nazov, kategoria, ciel, pomocky, narocnost
├── contraindications[], varianty[]
├── video_url, popis, odporucane_davkovanie
├── created_by (User)
└── active boolean

HomePlan
├── id, client_id, expert_id
├── exercises[] (odkazy na ExerciseVideo + davkovanie: serie, opakovania, tempo, pauza, frekvencia, poznamka)
├── status: active/completed/archived
├── timestamps: assigned_at, completed_at
└── progress[]
    ├── exercise_id, date, completed (boolean)
    ├── pain_level (1-10), fatigue_level (1-10)
    └── note

Appointment (Reservation)
├── id, client_id, expert_id, service_id
├── start_time, end_time, room
├── status: confirmed/cancelled/completed/no_show
├── cancellation_policy
├── waiting_list (boolean)
├── notification_sent (boolean)
└── payment_id (voliteľný)

Payment
├── id, appointment_id, client_id, service_id, expert_id
├── amount, method: cash/card, type: regular/refund/storno
├── ekasa_doc_id, invoice_number
├── timestamps: created_at, refunded_at
└── status: paid/refunded/pending

Service
├── id, nazov, cena, duration_min, category
├── active boolean
└── assigned_experts[] (ktoré roly ju môžu vykonávať)

AuditLog
├── id, user_id, action, entity_type, entity_id
├── old_value (JSON), new_value (JSON)
├── ip_address, user_agent
└── timestamp
```

---

## 5. GDPR a bezpečnostné požiadavky

| Požiadavka | Implementácia |
|---|---|
| **Súhlasy s verziou** | Každý súhlas ukladá verziu textu, dátum, čas a identitu kto získal |
| **PDF potvrdenie** | Pri podpise automaticky generovať PDF do karty klienta |
| **Zmena textu súhlasu** | Vyžiadať nové potvrdenie od klienta |
| **Práva klienta** | Zobraziť informáciu: prístup, oprava, výmaz, obmedzenie, prenositeľnosť |
| **Audit log** | Všetky zmeny v citlivých údajoch (osobné, zdravotné, súhlasy) |
| **Oprávnenia** | Odborník vidí len svojich klientov, Admin všetko |
| **Export** | Samostatné exporty: GDPR (kompletné dáta klienta) vs. anonymizované štatistiky |
| **Oddelenie dát** | Finančné reporty oddelené od zdravotných údajov |
| **Zálohovanie** | Pravidelné, riešiť od prvej fázy |

---

## 6. Navigačná štruktúra (bočný panel / bottom taby)

### Admin
```
Dashboard │ Klienti │ Diagnostika │ Videoknižnica │ Rezervácie │ Platby │ Reporty │ Nastavenia
```

### Odborník (tréner / fyzio / ortopéd / nutričný)
```
Dashboard │ Moji klienti │ Diagnostika │ Domáce plány │ Videoknižnica │ Rezervácie
```

### Klient
```
Dashboard │ Môj plán │ Videá │ Rezervácie │ Môj profil
```

> **Poznámka:** Na mobile použiť bottom tab bar (max 5 položiek), na tablete bočný sidebar.

---

## 7. MVP priority (odporúčané fázy)

| Fáza | Moduly | Dôvod |
|---|---|---|
| **MVP 1** | Klient + GDPR | Karta klienta, súhlasy, zoznam klientov, role — základ bez ktorého sa nedá pracovať |
| **MVP 2** | Diagnostika | Formuláre pre všetkých odborníkov — jadro odbornej práce |
| **MVP 3** | Záťaž + videá | Tréningová evidencia, videoknižnica, domáce plány — hlavný produkt pre klienta |
| **MVP 4** | Rezervácie | Kalendár, služby, kapacity, notifikácie |
| **MVP 5** | eKasa + reporting | Platby, doklady, financné a odborné dashboardy |

---

## 8. Technické odporúčania pre developera

1. **Responzívna webová appka** — najskôr tablet a mobil, desktop neskôr
2. **Jedna karta klienta** prepája vyšetrenia, tréningy, videá, rezervácie a platby
3. **Od prvej fázy** riešiť: oprávnenia, audit log, zálohovanie, GDPR exporty
4. **Škálovateľné formuláre** — diagnostické formuláre by mali byť template-based (JSON schema → UI), nie hardcoded
5. **Offline odolnosť** — pri výpadku internetu aspoň základné operácie (checklist cvičenia)
6. **Notifikácie** — email / SMS pre rezervácie (pripomienka, zrušenie, čakacia listina)
7. **eKasa integrácia** — rozhodnúť: priame napojenie, export pre účtovníctvo, alebo integrácia s existujúcim pokladničným riešením
8. **API-first** — všetky dáta cez REST/GraphQL API, frontend je len konzument

---

## 9. UI/UX poznámky

- **Farebná schéma:** športová, energická — (doplňte farby)
- **Typografia:** čitateľná na mobile, veľké dotykové ciele
- **Komponenty:** kalendár, časová os, škály bolesti (vizuálne), upload fotiek, video prehrávač
- **Loading stavy:** skeleton screens pre každú obrazovku
- **Prázdne stavy:** "Zatiaľ žiadne vyšetrenia", "Žiadne naplánované cvičenia" s CTA tlačidlom
- **Chybové stavy:** toast notifikácie, formula errors priamo pri poliach
- **Edge cases:** klient bez súhlasov (blokovať rezervácie), odborník bez klientov (prázdny zoznam), platba bez rezervácie

---

*Tento dokument slúži ako zadanie pre AI developera. Všetky obrazovky a toky sú odvodené z oficiálnej špecifikácie SportWell (PDF z júna 2026).*