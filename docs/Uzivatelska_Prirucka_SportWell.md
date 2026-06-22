# Používateľská príručka SportWell
**Kompletný sprievodca systémom pre majiteľov a manažment kliniky**

Tento dokument je napísaný "ľudskou rečou" bez zložitých IT pojmov. Slúži na to, aby ste vy a váš manažment pochopili, ako systém SportWell funguje v praxi, aké má funkcie, kto má k čomu prístup a ako si môžete celú aplikáciu sami otestovať.

---

## 1. Ako funguje prihlasovanie (Bez hesiel)
Systém SportWell **nepoužíva klasické heslá**. Heslá si ľudia často zabúdajú, alebo používajú príliš jednoduché, čo je pri zdravotných údajoch nebezpečné. 

Namiesto toho aplikácia využíva **"Jednorazové kódy" (OTP)**, podobne ako to robia moderné banky:
1. Zamestnanec alebo klient zadá svoj e-mail.
2. Do schránky mu do pár sekúnd príde e-mail so 8-miestnym číselným kódom.
3. Kód opíše do aplikácie a je bezpečne prihlásený. 

Tento prístup je nielen bezpečnejší, ale aj extrémne jednoduchý pre starších klientov.

---

## 2. Roly v systéme (Kto čo môže robiť?)
Systém inteligentne oddeľuje to, čo vidí bežný klient a čo vidí tréner alebo majiteľ. Stará sa o to tzv. "Matica oprávnení", ktorú máte plne pod kontrolou.

### 👑 Majiteľ / Administrátor (Vy)
- **Prístup:** Máte prístup úplne všade. Plná kontrola nad chodom prevádzky.
- **Manažment zamestnancov a klientov:** Vidíte všetkých klientov v databáze, všetkých zamestnancov, môžete kohokoľvek pridať, zablokovať alebo mu zmeniť práva (napr. povýšiť trénera na manažéra).
- **Priradenie:** Máte právo prideľovať, ktorý tréner (špecialista) sa stará o ktorého klienta. Tým pádom máte prehľad o tom, ako je prerozdelená práca.
- **Štatistiky a Prehľad (Pridaná hodnota pre Vás):** Ako majiteľ máte ako jediný "helikoptérový pohľad" na celý biznis. Vidíte, koľko máte aktívnych klientov, komu chýbajú zmluvy, koľko tréningových plánov bolo vytvorených. Digitalizácia Vám šetrí hodiny administratívnej práce – žiadne hľadanie papierových zložiek v skrinkách. Všetko, vrátane digitálne podpísaných GDPR súhlasov, nájdete na 2 kliknutia.

### 🩺 Špecialista (Tréner / Lekár / Fyzioterapeut)
- **Prístup:** Vidí aplikáciu ako zamestnanec, ale **z dôvodu ochrany súkromia a GDPR vidí výlučne iba svojich vlastných klientov** (tých, ktorých mu priradíte vy alebo recepcia).
- **Ochrana súkromia:** Špecialista "Jozef" nikdy neuvidí zdravotné záznamy, anamnézu alebo zoznam pacientov špecialistky "Anny".
- **Hlavná náplň práce:** 
  - **Tréningové plány:** Môže svojim klientom tvoriť interaktívne tréningové plány (vrátane poznámok k rozcvičke, určenia tempa, páuz a RPE). 
  - **Diagnostika:** Vypĺňa a eviduje diagnostické formuláre (napríklad záznamy z InBody, stavbu tela, odchýlky v držaní tela), ku ktorým môže priamo z mobilu nahrávať fotky pacienta.
  - **Vlastná databáza cvikov:** Tréneri si môžu do systému nahrávať vlastné špecifické cviky s vlastnými fotkami alebo videami. Tieto ich "tajné" cviky uvidia iba oni a ich klienti.
- **Pridaná hodnota pre trénera:** Ušetrí množstvo času. Nemusí písať plány do Excelu ani posielať inštruktážne videá cez WhatsApp. Tréner má všetky zdravotné a výkonnostné dáta o svojom klientovi na jednom mieste v prehľadnej aplikácii. Klienti ho zároveň vnímajú oveľa profesionálnejšie.

### 👤 Klient
- **Prístup:** Vidí len sám seba. Vôbec sa nedostane k "pracovným" tabuľkám alebo nastaveniam.
- **Funkcie:** Na mobile má prehľadnú aplikáciu s "Dolným menu". Vidí tam svoje tréningové plány, inštruktážne obrázky k cvikom, svoje diagnostické reporty a digitálne podpísané GDPR zmluvy. Svoje osobné údaje (telefón a adresu) si môže upraviť sám.

---

## 3. Príbeh klienta (Ako to funguje v praxi)

Predstavte si, že do vášho centra príde nový klient – pán Kováč. Toto je proces, akým prejde:

1. **Recepcia (Pred-registrácia):** Váš zamestnanec za počítačom klikne na tlačidlo "Pozvať klienta". Zadá jeho meno, priezvisko a e-mail.
2. **Pozvánka (Automatika):** Pánovi Kováčovi okamžite cinkne na mobile profesionálny uvítací e-mail od SportWell s odkazom na prihlásenie.
3. **Onboarding (Mobil):** Pán Kováč klikne na odkaz. Aplikácia mu nedovolí ísť ďalej, kým si nedoplní adresu, telefón a nezaškrtne potrebné súhlasy (Marketing, Meta reklamy, Diagnostika).
4. **Digitálna Zmluva:** Keď klient klikne na "Súhlasím", systém na pozadí automaticky vygeneruje krásne PDF s vašim logom, jeho údajmi a dnešným dátumom, a uloží ho do trezoru dokumentov.
5. **Aplikácia:** Následne sa mu odomkne jeho aplikácia, kde už čaká na svoj prvý tréningový plán od trénera.

---

## 4. Ako si systém môžete otestovať vy osobne?

Odporúčam vám vytvoriť si "fiktívneho klienta" a prejsť si procesom presne tak, ako ho uvidia vaši zákazníci.

**Návod na test:**
1. Prihláste sa do aplikácie s vašim bežným administrátorským (manažérskym) účtom.
2. Choďte do sekcie **Správa Klientov**.
3. Kliknite na veľké modré tlačidlo **Pozvať klienta**.
4. Ako e-mailovú adresu zadajte nejakú vašu súkromnú schránku, ktorú systém ešte nepozná (napr. váš Gmail alebo osobný e-mail). Meno dajte napríklad "Testovací Klient".
5. Odošlite pozvánku a odhláste sa zo svojho administrátorského účtu.
6. Choďte do svojej súkromnej e-mailovej schránky. Nájdete tam pozvánku.
7. Postupujte presne podľa e-mailu – prihláste sa (príde vám jednorazový 8-miestny kód) a systém vás hodí rovno na **GDPR Registračný formulár**.
8. Skúste si formulár vyplniť (všimnete si, že telefónne čísla a adresy sa už krásne samé formátujú). Zaškrtnite súhlasy a odošlite.
9. Hotovo! Ocitnete sa v klientskej zóne aplikácie.

*(Ak si potom otvoríte aplikáciu znova ako Administrátor, môžete vojsť do profilu "Testovacieho Klienta" a pozrieť si vygenerované PDF s jeho podpismi, priradiť mu trénera alebo mu vytvoriť tréningový plán).*

---

## 5. Zhrnutie najväčších výhod pre Vás
- **Bezpečnosť a GDPR:** Žiadne papierové zmluvy na recepcii. Všetko sa tvorí digitálne, bezpečne sa to ukladá a súhlasy sú prepojené priamo s databázou.
- **Súkromie (Multi-Tenancy):** Tréneri vidia len to, čo majú. Klienti vidia len svoje veci.
- **Mobilita:** Klient nemusí sťahovať aplikáciu z App Store alebo Google Play. Systém beží cez webový prehliadač, ale je navrhnutý ako moderná mobilná aplikácia (krásne farby, veľké tlačidlá prispôsobené pre palec na mobile).
- **Zjednotené dáta:** Aplikácia už automaticky kontroluje telefónne čísla (všetko ukladá v správnom predvoľbovom tvare) a adresy. Nemôže sa stať, že klient zadá nezmysly.
