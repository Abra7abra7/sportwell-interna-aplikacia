# Používateľská príručka SportWell
**Kompletný sprievodca systémom pre majiteľov, manažment a špecialistov kliniky**

Tento dokument slúži ako komplexný sprievodca, ktorý vám a vášmu tímu pomôže pochopiť, ako aplikácia **SportWell** funguje v praxi, aké procesy pokrýva a ako si ich môžete krok za krokom sami otestovať. Príručka je napísaná zrozumiteľným jazykom a odráža aktuálny stav implementovaných modulov.

---

## 1. Ako funguje prihlasovanie (Bez hesiel)
Systém SportWell **nepoužíva klasické heslá**, ktoré sa často zabúdajú a sú z hľadiska ochrany zdravotných údajov rizikové.

Namiesto toho aplikácia využíva **Jednorazové prihlasovacie kódy (OTP)** odosielané na e-mail:
1. Používateľ (zamestnanec alebo klient) zadá svoju e-mailovú adresu na prihlasovacej stránke.
2. Systém vygeneruje a odošle 6-miestny (resp. 8-miestny) číselný kód na daný e-mail.
3. Používateľ opíše kód do aplikácie a je bezpečne prihlásený.
4. **Chybové stavy:** Ak používateľ zadá nesprávny alebo expirovaný kód, systém okamžite zobrazí chybovú hlášku (`authError`) a nepustí ho ďalej.

---

## 2. Roly v systéme a Matica oprávnení
Systém striktne oddeľuje prístup k citlivým dátam na základe rolí. Prístupové práva jednotlivých rolí k modulom (čítanie, zápis, mazanie) riadi dynamická **Matica oprávnení (RBAC)**, ktorú spravuje administrátor v sekcii `/nastavenia`.

### 👑 Majiteľ / Administrátor
*   **Prístup:** Úplný prístup do všetkých sekcií aplikácie (Super User pattern).
*   **Správa zamestnancov a klientov:** Môže pridávať špecialistov, meniť ich práva a prideľovať trénerov ku konkrétnym klientom.
*   **Globálny prístup:** Vidí všetkých klientov v databáze a má k dispozícii kompletné štatistiky prevádzky.

### 🩺 Špecialista (Tréner / Fyzioterapeut / Lekár)
*   **Izolácia dát (Multi-Tenancy):** Z dôvodu ochrany osobných údajov a GDPR vidí špecialista **výhradne iba svojich priradených klientov** (tých, ktorých mu priradil administrátor alebo recepcia).
*   **Vlastná databáza cvikov:** Cviky označené ako vlastné (`is_custom = true`) vidí len ten tréner, ktorý ich do systému nahral (`created_by`), a klienti, ktorí ich majú priradené v pláne.
*   **Činnosť:** Vytvára tréningové plány, vypĺňa diagnostiky a eviduje záznamy o klientoch.

### 👤 Klient
*   **Prístup:** Vidí výhradne iba svoje vlastné informácie (tréningové plány, diagnostické PDF a dokumenty). Nemá prístup do žiadnych administrátorských sekcií.
*   **Mobilné rozhranie:** Na mobilných zariadeniach má klient zjednodušené rozhranie s **Dolným navigačným barom** (Home, Moje Cviky, Dokumenty, Profil).
*   **Uzamknutie súhlasov:** Súhlasy s GDPR (marketing, reklama, diagnostika) sú v profile klienta **uzamknuté (iba na čítanie)**. Klient ich nemôže sám meniť, aby nevznikol rozpor s vygenerovaným a podpísaným PDF. Zmena sa robí na recepcii vygenerovaním novej zmluvy.

---

## 3. Hlavné procesy a moduly v aplikácii

### A. GDPR Registrácia & Onboarding klienta
Proces registrácie nového klienta prebieha cez onboardingový formulár (sprievodcu `/gdpr`):
1.  **Pred-registrácia (Čakáreň):** Recepcia v sekcii `/klienti` (Záložka *Čakáreň / Pozvanie*) vytvorí záznam s e-mailom a menom klienta. Systém automaticky zašle uvítací e-mail.
2.  **Registračný sprievodca (3 kroky):**
    *   **Krok 1 (Osobné údaje):** Klient zadá meno, priezvisko, telefónne číslo (systém automaticky kontroluje a formátuje tvar predvoľby), dátum narodenia a adresu.
    *   **Krok 2 (Výber služby):** Klient zvolí svoju primárnu oblasť záujmu (napr. *Fyzioterapia a diagnostika*).
    *   **Krok 3 (Súhlasy):** Klient musí povinne zaškrtnúť súhlas s podmienkami a ochranou osobných údajov (GDPR). Voliteľne zaškrtne marketingové a diagnostické súhlasy.
3.  **Dokončenie:** Tlačidlo na dokončenie sa odomkne až po zaškrtnutí povinných polí. Po kliknutí systém vygeneruje PDF zmluvu, nahrá ju do úložiska, priradí do dokumentov klienta, vytvorí reálny profil v databáze a vymaže pred-registráciu z čakárne.

### B. Dynamická Diagnostika & Tvorba šablón
Systém neobsahuje pevne hardkódované diagnostické formuláre. Namiesto toho disponuje **generátorom dynamických šablón**, vďaka čomu si klinika môže sama vytvárať vyšetrenia na mieru.
*   **Tvorba šablón (`/sablony`):** Manažment alebo admin môže definovať vlastné typy diagnostík. Každá šablóna môže obsahovať ľubovoľné polia (textové vstupy, checkbox, výbery a pod.) rozdelené do jednotlivých krokov.
*   **Spustenie diagnostiky (`/diagnostika`):** Špecialista si zvolí požadovanú šablónu a následne vyhľadá pacienta, pre ktorého chce formulár vyplniť.
*   **GDPR bypass (Zástupný súhlas):** Ak špecialista vyberie klienta, ktorý ešte neprešiel online onboardingom, aplikácia ho nepustí k formuláru. Špecialista však môže kliknúť na tlačidlo **"Udeliť zástupný súhlas (Podpísal na klinike)"** (ak klient podpísal papierovú formu fyzicky na prevádzke). Tým sa diagnostika pre klienta okamžite odomkne.
*   **Generovanie PDF reportov:** Po úspešnom odoslaní a uložení diagnostiky systém na pozadí automaticky vygeneruje prehľadný PDF report (obsahujúci hlavičku SportWell s adresou a IČO a prehľadne usporiadané odpovede). PDF sa uloží do zložky dokumentov klienta, kde je kedykoľvek k dispozícii.

### C. Zmluva o nájme prístroja (Lease Agreement)
Slúži na zapožičanie rehabilitačných pomôcok (napr. PowerDot) klientovi na domáce použitie.
*   **5-krokový sprievodca:**
    1.  *Identita nájomcu:* Vyplnenie osobných údajov + **čísla občianskeho preukazu (OP)**.
    2.  *Výber prístroja:* Voľba zariadenia (napr. PowerDot).
    3.  *Doba a cena:* Určenie dátumu Od - Do, výšky nájomného a sumy slovom.
    4.  *Znenie zmluvy:* Právne podmienky a ustanovenia nájmu.
    5.  *Podpis a súhlas:* Zadanie e-mailu na podpis, kliknutie na **"Overiť email"** (spustí 1-sekundovú simuláciu overenia kódu, po ktorej sa zobrazí zelené *Overené ✓*), zaškrtnutie súhlasu so zmluvou a odoslanie.
*   Výsledkom je vygenerované PDF s podpisom v dokumentoch klienta.

### D. Tvorba a predpisovanie tréningových plánov
Tréner môže svojim klientom zostaviť interaktívny plán:
1.  **Zadanie detailov plánu:** Názov, popis, stav aktivity a priradenie klientovi.
2.  **Poznámky k rozcvičke (`warmup_notes`):** Možnosť pridať špecifické pokyny pred cvičením.
3.  **Katalóg cvikov (Vyhľadávanie a filtre):** Tréner môže vyhľadávať cviky a filtrovať ich podľa zaťažených svalov alebo kategórií.
4.  **Pridanie a nastavenie parametrov cviku:** Pre každý cvik v pláne tréner určuje:
    *   Počet sérií a opakovania.
    *   Tempo vykonávania (napr. `2-0-2-0`).
    *   RPE (intenzita v percentách alebo na škále únavy, napr. `80%`).
    *   Pauzu po cviku (napr. `60s`).
    *   Extra pauzu medzi cvikmi (`rest_between_exercises`).
    *   Individuálne poznámky k cviku.
5.  **Tvorba vlastných cvikov:** Priamo v rozhraní plánu môže tréner vytvoriť rýchly vlastný cvik (názov, obrázky z úložiska), ktorý uvidí iba on a jeho priradení klienti.

### E. Záznam a logovanie tréningov (Zápis tréningu)
Tréner alebo klient môžu zaevidovať reálne odcvičený tréning:
1.  Používateľ prejde na profil klienta do záložky *Tréningy* a klikne na *Zaznamenať tréning*.
2.  **Výber plánu:** Po zvolení aktívneho plánu sa automaticky načítajú predpísané cviky a **rozbalia sa na jednotlivé série**.
3.  **Zápis hodnôt:** Používateľ vypĺňa reálne dosiahnuté opakovania a hmotnosť v kg pre každú sériu zvlášť.
4.  **Pridanie cvikov:** Do tréningu je možné manuálne vyhľadať a pridať aj cviky mimo pôvodného plánu.
5.  **Doplňujúce údaje:** Zadá sa dátum a čas tréningu, celková dĺžka (v minútach), náročnosť (stupnica 1 - 5) a spätná väzba/poznámky klienta.

---

## 4. Ako si systém môžete otestovať vy osobne? (Testovacie scenáre)

### Scenár 1: OTP Prihlásenie & Bezpečnosť
1. Zvoľte prihlásenie a zadajte svoj e-mail.
2. Skontrolujte doručenú poštu, skopírujte prihlasovací kód a vložte ho do poľa.
3. *Test chyby:* Skúste zadať úmyselne nesprávny kód. Overte, či systém zobrazil chybovú hlášku a zamedzil prístupu.

### Scenár 2: Pozvanie & GDPR Onboarding (Pohlád klienta)
1. Prihláste sa ako **Administrátor**.
2. V sekcii **Klienti** prejdite na záložku *Čakáreň / Pozvanie*, kliknite na *Pozvať klienta* a zadajte testovací e-mail, ktorý v systéme ešte neexistuje.
3. Odhláste sa z administrátora a otvorte si e-mailovú schránku testovacieho klienta.
4. Kliknite na odkaz v e-maile, prihláste sa cez doručený OTP kód.
5. Systém vás presmeruje na stránku `/gdpr` a zablokuje akúkoľvek navigáciu, kým neprejdete registráciou.
6. Vyplňte 3 kroky onboardingu (skontrolujte automatické formátovanie telefónneho čísla a adresy).
7. Po zaškrtnutí povinných súhlasov dokončite registráciu. Overte, že vás systém pustil do klientskej zóny a že v záložke *Dokumenty* máte uloženú vygenerovanú GDPR zmluvu v PDF.
8. V profile testovacieho klienta sa pokúste zmeniť GDPR súhlasy – overte si, že sú sivé a nie je možné ich prepísať (sú uzamknuté).

### Scenár 3: Vytvorenie šablóny, GDPR Bypass a Dynamická Diagnostika
1. Prihláste sa ako **Administrátor**.
2. Prejdite do sekcie **Šablóny** a kliknutím na *Pridať šablónu* vytvorte jednoduchú novú diagnostickú šablónu (napr. *"Vstupný dotazník"* s poliami ako textové pole pre ťažkosti). Uistite sa, že šablóna je označená ako aktívna.
3. Pozvite nového klienta, ale **neprihlasujte sa zaňho** (stále nemá podpísané GDPR online).
4. Prejdite do sekcie **Diagnostika** a zvoľte vašu novovytvorenú šablónu.
5. Vyhľadajte tohto nového klienta. Systém by mal zobraziť červenú hlášku *"Chýba GDPR súhlas"*.
6. Kliknite na tlačidlo **"Udeliť zástupný súhlas (Podpísal na klinike)"**.
7. Overte, že sa stav zmenil na zelený a sprístupnilo sa tlačidlo *Spustiť vyšetrenie*.
8. Vyplňte dynamický formulár, nahrajte testovacie prílohy (ak sú polia na to určené) a diagnostiku odošlite.
9. Systém vás presmeruje na profil klienta. Prejdite na záložku *Dokumenty*, otvorte vygenerované PDF a skontrolujte, či obsahuje zadané odpovede a správnu hlavičku SportWell.

### Scenár 4: Tvorba tréningového plánu a vlastného cviku
1. Ako **Tréner / Administrátor** prejdite do sekcie **Tréningové Plány** a kliknite na *Vytvoriť nový plán*.
2. Priraďte plán testovaciemu klientovi, vyplňte názov a poznámku k rozcvičke.
3. V ľavom paneli vyhľadajte cvik, vyskúšajte filtre svalových skupín a pridajte ho do plánu.
4. V pravom paneli nastavte cviku parametre: počet sérií, opakovania, tempo (napr. `3-1-3-0`), pauzu a RPE.
5. Kliknite na tlačidlo na vytvorenie vlastného cviku. Zadajte názov, nahrajte testovací obrázok a uložte.
6. Pridajte tento vlastný cvik do plánu a uložte celý plán.
7. Prihláste sa ako testovací klient a overte, že v sekcii *Moje Cviky* vidíte priradený plán vrátane vášho vlastného cviku s obrázkom.
8. Prihláste sa ako iný tréner (ktorému klient nebol priradený) a overte, že v zozname cvikov nevidíte tento vlastný cvik a nemáte prístup k tomuto klientovi.

### Scenár 5: Záznam tréningu
1. Ako **Tréner** alebo **Klient** prejdite do profilu klienta, záložka *Tréningy* a zvoľte *Zaznamenať tréning*.
2. Zvoľte vytvorený tréningový plán. Overte, že sa automaticky vygenerovali polia pre každú sériu cvikov z plánu.
3. Do polí sérií zapíšte reálne hodnoty (napr. 1. séria: 10 opakovaní / 20 kg, 2. séria: 8 opakovaní / 22 kg).
4. Pridajte manuálne ďalší cvik z databázy a zapíšte mu hodnoty.
5. Nastavte čas tréningu, celkové trvanie, zvoľte obtiažnosť a uložte.
6. Skontrolujte, že v záložke *Tréningy* na profile klienta pribudol nový záznam so správnym dátumom a detailným rozpisom sérií.

### Scenár 6: Zmluva o nájme prístroja
1. Ako **Tréner** alebo **Administrátor** prejdite do sekcie **Diagnostika** (resp. Nájomné zmluvy) a zvoľte *Zmluvu o nájme prístroja*.
2. Vyberte aktívneho klienta.
3. *Krok 1:* Doplňte číslo občianskeho preukazu a prejdite ďalej.
4. *Krok 2:* Zvoľte prístroj (napr. PowerDot).
5. *Krok 3:* Zadajte dátumy nájmu, sumu nájomného a sumu slovom.
6. *Krok 4:* Prečítajte si znenie zmluvy.
7. *Krok 5:* Zadajte e-mail, kliknite na *Overiť email*, počkajte na zobrazenie *Overené ✓*, zaškrtnite súhlas a kliknite na *Podpísať a Odoslať*.
8. Overte na profile klienta v záložke *Dokumenty*, že sa vytvorilo PDF nájomnej zmluvy s vyplnenými údajmi a dňom podpisu.

---

## 5. Zhrnutie najväčších výhod pre kliniku
*   **Absolútna ochrana a súlad s GDPR:** Žiadne papierové zmluvy a kartotéky na recepcii. Súhlasy a diagnostické PDF sú bezpečne digitálne uložené na jednom mieste.
*   **Prísna segregácia prístupov (Multi-Tenancy RLS):** Tréneri a fyzioterapeuti nemajú prístup k cudzím pacientom a ich anamnézam. Databázy ich vlastných cvikov sú chránené.
*   **Vlastná tvorba diagnostík na kľúč:** Možnosť vytvárať akékoľvek vlastné formuláre bez nutnosti zásahu do kódu vývojárom.
*   **Bezpapierová prevádzka a automatizácia:** Systém automaticky generuje zmluvy a diagnostické správy, čím šetrí desiatky hodín administratívy týždenne.
*   **Mobilita bez nutnosti inštalácie (PWA):** Aplikácia beží spoľahlivo priamo vo webovom prehliadači na akomkoľvek zariadení, pričom je navrhnutá s ohľadom na dotykové ovládanie na mobiloch.
