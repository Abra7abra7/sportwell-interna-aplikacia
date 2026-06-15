"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { createClient } from "@/utils/supabase/client";

export default function GdprPage() {
  const router = useRouter();
  const { currentUserProfile, sessionUser, fetchUserProfile } = useAuthContext();
  const supabase = createClient();

  // Redirect away if already signed
  useEffect(() => {
    if (currentUserProfile?.gdpr_signed_at) {
      router.push("/dashboard");
    }
  }, [currentUserProfile, router]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    address: "",
    phone: "",
    service: "Masáž"
  });

  const [consents, setConsents] = useState({
    rules: false,
    booking: false,
    marketing: false,
    meta: false,
    diagnostics: false
  });

  const [expanded, setExpanded] = useState({
    rules: false,
    booking: false,
    marketing: false,
    meta: false,
    diagnostics: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  if (!currentUserProfile || currentUserProfile.gdpr_signed_at) {
    return <div className="p-8 text-center">Načítavam...</div>;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleConsentChange = (name: keyof typeof consents) => {
    setConsents({ ...consents, [name]: !consents[name] });
  };

  const toggleExpand = (name: keyof typeof expanded) => {
    setExpanded({ ...expanded, [name]: !expanded[name] });
  };

  const acceptAll = () => {
    setConsents({
      rules: true,
      booking: true,
      marketing: true,
      meta: true,
      diagnostics: true
    });
  };

  const generateConsentHtml = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>GDPR Súhlas - ${formData.firstName} ${formData.lastName}</title></head>
      <body style="font-family: sans-serif; padding: 40px; max-width: 800px; margin: auto;">
        <h1>GDPR Súhlas a Registrácia - SportWell</h1>
        <p><strong>Dátum podpisu:</strong> ${new Date().toLocaleString('sk-SK')}</p>
        <hr/>
        <h3>Osobné údaje:</h3>
        <ul>
          <li><strong>Meno a priezvisko:</strong> ${formData.firstName} ${formData.lastName}</li>
          <li><strong>E-mail:</strong> ${currentUserProfile.email}</li>
          <li><strong>Telefón:</strong> ${formData.phone}</li>
          <li><strong>Dátum narodenia:</strong> ${formData.birthDate}</li>
          <li><strong>Trvalý pobyt:</strong> ${formData.address}</li>
          <li><strong>Záujem o službu:</strong> ${formData.service}</li>
        </ul>
        <h3>Udelené súhlasy:</h3>
        <ul>
          <li>Oboznámenie sa s pravidlami ochrany osobných údajov: <strong>ÁNO</strong></li>
          <li>Súhlas s podmienkami používania rezervačného systému: <strong>ÁNO</strong></li>
          <li>Súhlas so spracovaním na marketingové účely: <strong>${consents.marketing ? 'ÁNO' : 'NIE'}</strong></li>
          <li>Súhlas s poskytnutím údajov tretej osobe (Meta): <strong>${consents.meta ? 'ÁNO' : 'NIE'}</strong></li>
          <li>Súhlas so spracovaním údajov z diagnostiky: <strong>${consents.diagnostics ? 'ÁNO' : 'NIE'}</strong></li>
        </ul>
        <br/>
        <p><em>Tento dokument bol vygenerovaný a elektronicky potvrdený používateľom po úspešnej autentifikácii e-mailom.</em></p>
      </body>
      </html>
    `;
  };

  const handleSubmit = async () => {
    setShowValidation(true);
    
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.address || !formData.birthDate) {
      setError("Vyplňte prosím všetky povinné osobné údaje.");
      return;
    }
    if (!consents.rules || !consents.booking) {
      setError("Pre pokračovanie musíte zaškrtnúť povinné súhlasy (Označené hviezdičkou *).");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const signedAt = new Date().toISOString();
      const htmlContent = generateConsentHtml();
      const fileName = `gdpr_${currentUserProfile.id}_${Date.now()}.html`;

      // 1. Upload file to Supabase Storage
      const fileBlob = new Blob([htmlContent], { type: 'text/html' });
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client_documents')
        .upload(fileName, fileBlob);

      if (uploadError) {
        console.error("Storage upload failed:", uploadError);
      }

      // 2. Upsert profile FIRST to satisfy foreign key constraint for documents
      const newMetadata = {
        ...currentUserProfile.metadata,
        address: formData.address,
        birthDate: formData.birthDate,
        serviceInterest: formData.service,
        marketingConsent: consents.marketing,
        metaConsent: consents.meta,
        diagnosticsConsent: consents.diagnostics
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: currentUserProfile.id,
          role: 'klient',
          email: currentUserProfile.email,
          full_name: `${formData.firstName} ${formData.lastName}`.trim(),
          phone: formData.phone,
          gdpr_signed_at: signedAt,
          metadata: newMetadata
        });

      if (profileError) {
        console.error("Profile update failed:", profileError);
        throw profileError;
      }

      // 3. Add record to documents table (if bucket upload succeeded)
      if (uploadData) {
        const { error: docError } = await supabase.from('documents').insert({
          client_id: currentUserProfile.id,
          file_name: `GDPR_Suhlas_${formData.lastName}.html`,
          storage_path: uploadData.path
        });
        
        if (docError) {
          console.error("Document insert failed:", docError);
        }
      }

      // Refresh auth context
      if (sessionUser) {
        await fetchUserProfile(sessionUser);
      }
      
      // Redirect to dashboard is handled by useEffect when gdpr_signed_at changes
    } catch (err: any) {
      setError(err.message || "Nastala chyba pri ukladaní údajov.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-white rounded-xl shadow-sm border border-gray-100 my-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-brand-navy mb-2">Registračný formulár</h1>
        <h2 className="text-lg font-medium text-brand-navy">ŠPORTOVO-REHABILITAČNÉ CENTRUM SportWell (ďalej len „Centrum“)</h2>
        <p className="text-gray-500 text-sm">sídlo prevádzky: Černyševského 30, 851 01 Bratislava</p>
      </div>

      <div className="bg-brand-off-white p-6 rounded-xl border border-gray-200 mb-8 text-sm text-gray-700">
        <p className="mb-4">
          <strong>SPOLOČNÍ PREVÁDZKOVATELIA (ďalej ako „spoloční prevádzkovatelia“):</strong><br />
          SportWell s.r.o., Černyševského 30, 851 01 Bratislava, IČO: 52 124 118, DIČ: 21 20 899 429<br /><br />
          SportWell rehab s.r.o., Černyševského 30, 851 01 Bratislava, IČO: 53 416 864, DIČ: 21 21 369 173
        </p>
        <p className="mb-4 text-justify">
          Vyplnenie údajov tohto registračného formuláru je zmluvnou požiadavkou, t.j. údaje sú potrebné na uzatvorenie zmluvy a poskytnutie služieb, plnenie si zmluvných a zákonných povinností spoločných prevádzkovateľov v súvislosti s poskytovaním služieb a na zabezpečenie oprávneného záujmu spoločných prevádzkovateľov podľa bodov (iii) a (iv) nasledujúceho odseku.
        </p>
        <p className="text-xs text-gray-500 text-justify">
          Právnym základom spracúvania poskytnutých údajov podľa GDPR (Nariadenie Európskeho parlamentu a rady (EÚ) 2016/679 o ochrane fyzických osôb pri spracovaní osobných údajov a o voľnom pohybe takýchto údajov) je (i) plnenie zmluvy vrátane predzmluvných vzťahov (čl. 6 ods. 1 písm. b) GDPR), (ii) plnenie zákonných povinností (čl. 6 ods. 1 písm. c) GDPR), (iii) oprávnený záujem spoločných prevádzkovateľov na efektívnej prevádzke športovo-rehabilitačného centra zahŕňajúci efektívnu obsluhu klientov, prehľadnú evidenciu plnení poskytnutých si navzájom klientom a prevádzkovateľom, zamedzenie podvodom, zefektívnenie procesu objednávok a rezervácií služieb, prehľadnú a efektívnu komunikáciu s klientom a informovanie klientov o prevádzkových podmienkach a zmenách (čl. 6 ods. 1 písm. f) GDPR) a (iv) oprávnený záujem spoločných prevádzkovateľov na preukazovaní, uplatňovaní a obhajovaní právnych nárokov (čl. 6 ods. 1 písm. f) GDPR).
        </p>
      </div>

      <h3 className="text-xl font-bold text-brand-navy mb-6">Vyplňte údaje nižšie</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-brand-navy mb-1">Meno</label>
          <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className={`w-full border rounded-md p-2 ${showValidation && !formData.firstName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-navy mb-1">Priezvisko</label>
          <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className={`w-full border rounded-md p-2 ${showValidation && !formData.lastName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-navy mb-1">Dátum narodenia</label>
          <input type="date" name="birthDate" value={formData.birthDate} onChange={handleInputChange} className={`w-full border rounded-md p-2 ${showValidation && !formData.birthDate ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-navy mb-1">Trvalý pobyt (Adresa)</label>
          <input type="text" name="address" value={formData.address} onChange={handleInputChange} className={`w-full border rounded-md p-2 ${showValidation && !formData.address ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-navy mb-1">E-mail</label>
          <input type="email" value={currentUserProfile.email} disabled className="w-full border border-gray-200 bg-gray-50 text-gray-500 rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-navy mb-1">Telefónne číslo</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className={`w-full border rounded-md p-2 ${showValidation && !formData.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} required />
        </div>
      </div>

      <div className="mb-10">
        <h4 className="text-lg font-medium text-brand-navy mb-3">O akú službu máte záujem?</h4>
        <div className="space-y-2">
          {["Masáž", "Funkčný tréning a diagnostika", "Fyzioterapia a diagnostika"].map(srv => (
            <label key={srv} className="flex items-center space-x-3 cursor-pointer">
              <input type="radio" name="service" value={srv} checked={formData.service === srv} onChange={handleInputChange} className="h-4 w-4 text-brand-cyan" />
              <span className="text-gray-700">{srv}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-6 flex justify-center">
        <button type="button" onClick={acceptAll} className="border border-brand-cyan text-brand-cyan hover:bg-brand-light-cyan px-6 py-2 rounded-md font-medium transition-colors">
          Zaškrtnúť a prijať všetko nasledujúce
        </button>
      </div>

      <div className="space-y-6 mb-10">
        {/* Consent 1 */}
        <div className={`bg-gray-50 p-4 rounded-lg border ${showValidation && !consents.rules ? 'border-red-500' : 'border-gray-200'}`}>
          <label className="flex items-start space-x-3 cursor-pointer">
            <input type="checkbox" checked={consents.rules} onChange={() => handleConsentChange('rules')} className="mt-1 h-5 w-5 text-brand-cyan rounded border-gray-300" />
            <span className="font-medium text-brand-navy">Oboznámenie sa s pravidlami ochrany osobných údajov a základnými časťami dohody spoločných prevádzkovateľov uzatvorenej podľa čl. 26 GDPR *</span>
          </label>
          <div className="ml-8 mt-2">
            {expanded.rules ? (
              <div>
                <p className="text-sm text-gray-600 mb-2">Zaškrtnutím políčka potvrdzujem, že som sa oboznámil/oboznámila s vyššie zverejnenými pravidlami ochrany osobných údajov spoločných prevádzkovateľov, a to vrátane informácií o účeloch spracúvania osobných údajov, o právnych základoch spracúvania, o príjemcoch osobných údajov, o dobe uchovávania osobných údajov, o práve požiadať o prístup k osobným údajom, o práve odvolať súhlas so spracúvaním osobných údajov (ak je spracúvanie založené na článku 6 ods. 1 písm. a) GDPR), o práve podať sťažnosť, o práve na obmedzenie spracúvania osobných údajov a práve na prenosnosť údajov. Zaškrtnutím políčka zároveň potvrdzujem, že mi boli poskytnuté základné časti dohody spoločných prevádzkovateľov uzatvorenej podľa čl. 26 GDPR.</p>
                <button type="button" onClick={() => toggleExpand('rules')} className="text-brand-cyan text-sm font-medium">Zobraziť menej ∧</button>
              </div>
            ) : (
              <button type="button" onClick={() => toggleExpand('rules')} className="text-brand-cyan text-sm font-medium">Zobraziť viac ∨</button>
            )}
          </div>
        </div>

        {/* Consent 2 */}
        <div className={`bg-gray-50 p-4 rounded-lg border ${showValidation && !consents.booking ? 'border-red-500' : 'border-gray-200'}`}>
          <label className="flex items-start space-x-3 cursor-pointer">
            <input type="checkbox" checked={consents.booking} onChange={() => handleConsentChange('booking')} className="mt-1 h-5 w-5 text-brand-cyan rounded border-gray-300" />
            <span className="font-medium text-brand-navy">Súhlas s podmienkami používania rezervačného systému *</span>
          </label>
          <div className="ml-8 mt-2">
            {expanded.booking ? (
              <div>
                <p className="text-sm text-gray-600 mb-2">Zaškrtnutím políčka potvrdzujem, že som sa oboznámil/oboznámila a že súhlasím s vyššie zverejnenými podmienkami používania rezervačného systému spoločných prevádzkovateľov, a pre prípad používania systému rezervácií spoločných prevádzkovateľov sa vyššie uvedené podmienky zaväzujem dodržiavať.</p>
                <button type="button" onClick={() => toggleExpand('booking')} className="text-brand-cyan text-sm font-medium">Zobraziť menej ∧</button>
              </div>
            ) : (
              <button type="button" onClick={() => toggleExpand('booking')} className="text-brand-cyan text-sm font-medium">Zobraziť viac ∨</button>
            )}
          </div>
        </div>

        {/* Consent 3 */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input type="checkbox" checked={consents.marketing} onChange={() => handleConsentChange('marketing')} className="mt-1 h-5 w-5 text-brand-cyan rounded border-gray-300" />
            <span className="font-medium text-brand-navy">Súhlas so spracovaním e-mailovej adresy na marketingové účely</span>
          </label>
          <div className="ml-8 mt-2">
            {expanded.marketing ? (
              <div>
                <p className="text-sm text-gray-600 mb-2">Zaškrtnutím políčka súhlasím so spracovaním uvedenej e-mailovej adresy spoločnými prevádzkovateľmi, a to na účel zasielania informácií o novinkách a ponukách v oblasti prevádzkovateľmi poskytovaných služieb a celého ich produktového portfólia, ako aj o podujatiach, ktoré organizuje aspoň jeden zo spoločných prevádzkovateľov, alebo na nich partnersky spolupracuje.</p>
                <p className="text-sm text-gray-600 mb-2">Udelenie tohto súhlasu so spracúvaním údaju o e-mailovej adrese na marketingové účely je dobrovoľné. Ako dotknutá osoba máte právo poskytnutý súhlas kedykoľvek odvolať, písomne na poštovú adresu ktoréhokoľvek zo spoločných prevádzkovateľov alebo emailom na adresu info@sportwell.sk. Súhlas je udelený na dobu do zániku účelu spracúvania osobných údajov alebo do doručenia odvolania súhlasu, a to podľa toho, ktorá z týchto skutočností nastane skôr.</p>
                <button type="button" onClick={() => toggleExpand('marketing')} className="text-brand-cyan text-sm font-medium">Zobraziť menej ∧</button>
              </div>
            ) : (
              <button type="button" onClick={() => toggleExpand('marketing')} className="text-brand-cyan text-sm font-medium">Zobraziť viac ∨</button>
            )}
          </div>
        </div>

        {/* Consent 4 */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input type="checkbox" checked={consents.meta} onChange={() => handleConsentChange('meta')} className="mt-1 h-5 w-5 text-brand-cyan rounded border-gray-300" />
            <span className="font-medium text-brand-navy">Súhlas s poskytnutím e-mailovej adresy tretej osobe na marketingové účely</span>
          </label>
          <div className="ml-8 mt-2">
            {expanded.meta ? (
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Zaškrtnutím políčka súhlasím s tým, aby ktorýkoľvek zo spoločných prevádzkovateľov poskytol moju vyššie uvedenú e-mailovú adresu spoločnosti Meta Platforms, Inc., so sídlom: 1601 Willow Road, Menlo Park, California, Spojené štáty americké (ďalej len „Meta Platforms“), a to za účelom použitia týchto údajov v rámci produktu platformy Facebook „Lookalike Audiences“ (viac o službe Lookalike Audiences viď na <a href="https://www.facebook.com/business/help/164749007013531?id=401668390442328" target="_blank" rel="noopener noreferrer" className="text-brand-cyan underline">https://www.facebook.com/business/help/...</a>), pričom som oboznámený/oboznámená so skutočnosťou, že spoločnosť Meta Platforms v súlade s vlastnými zásadami ochrany osobných údajov (viac o Privacy Policy viď na <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer" className="text-brand-cyan underline">https://www.facebook.com/privacy/policy</a>) využije jej dostupné osobné údaje o mojej osobe na vytvorenie profilu štandardného zákazníka spoločných prevádzkovateľov a následne na zlepšenie zacielenia marketingových aktivít spoločných prevádzkovateľov. Zároveň potvrdzujem, že som bol/bola oboznámená so skutočnosťou, že poskytnutie údajov spoločnosti Meta Platforms môže mať za následok prenos poskytnutých údajov do krajín so sídlom mimo krajín Európskej únie (a to vrátane Spojených štátov amerických), vo vzťahu ku ktorým neexistuje rozhodnutie Európskej komisie o primeranej úrovni ochrany osobných údajov (podľa čl. 45 ods. 3 GDPR), a neexistujú ani primerané záruky (podľa článku 46 GDPR) a som si vedomý/vedomá rizík, ktoré takýto prenos môže predstavovať, a to vrátane nemožnosti spoločných prevádzkovateľov zabezpečiť ochranu poskytnutých osobných údajov po ich poskytnutí spoločnosti Meta Platforms, nemožnosti spoločných prevádzkovateľov zamedziť ďalšiemu prenosu údajov, či nemožnosti spoločných prevádzkovateľov poskytnúť mi účinné správne a súdne prostriedky nápravy pre prípad porušenia mojich práv.
                </p>
                <button type="button" onClick={() => toggleExpand('meta')} className="text-brand-cyan text-sm font-medium">Zobraziť menej ∧</button>
              </div>
            ) : (
              <button type="button" onClick={() => toggleExpand('meta')} className="text-brand-cyan text-sm font-medium">Zobraziť viac ∨</button>
            )}
          </div>
        </div>

        {/* Consent 5 */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input type="checkbox" checked={consents.diagnostics} onChange={() => handleConsentChange('diagnostics')} className="mt-1 h-5 w-5 text-brand-cyan rounded border-gray-300" />
            <span className="font-medium text-brand-navy">Súhlas so spracovaním údajov získaných počas vstupnej diagnostiky</span>
          </label>
          <div className="ml-8 mt-2">
            {expanded.diagnostics ? (
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Zaškrtnutím políčka súhlasím so spracovaním mojich osobných údajov, ktoré boli poverenou osobou ktoréhokoľvek zo spoločných prevádzkovateľov získané počas mojej vstupnej diagnostiky, a to vrátane mojej zdravotnej anamnézy, informácií týkajúcich sa výživových návykov a životného štýlu, údajov získaných diagnostikou vnútorného prostredia (InBody analýza telesných parametrov) a pohybového aparátu (FMS diagnostika) (ďalej spolu len „údaje z diagnostiky“), a to ich:
                </p>
                <ul className="list-disc pl-5 mb-4 text-sm text-gray-600 space-y-1">
                  <li>získaním, zaznamenaním a uchovávaním v elektronickej podobe na záznamovom zariadení umiestnenom v prevádzke Centra a na záznamovom zariadení spravovanom poskytovateľom webhostingu webovej stránky Centra;</li>
                  <li>odoslaním na moju e-mailovú adresu uvedenú v tomto formulári;</li>
                  <li>sprístupňovaním povereným pracovníkom spoločných prevádzkovateľov, za účelom poskytovania služieb spoločnými prevádzkovateľmi.</li>
                </ul>
                <button type="button" onClick={() => toggleExpand('diagnostics')} className="text-brand-cyan text-sm font-medium">Zobraziť menej ∧</button>
              </div>
            ) : (
              <button type="button" onClick={() => toggleExpand('diagnostics')} className="text-brand-cyan text-sm font-medium">Zobraziť viac ∨</button>
            )}
          </div>
        </div>

      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm font-medium border border-red-200">
          {error}
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-brand-cyan hover:bg-brand-navy text-brand-navy hover:text-white font-bold py-3 px-8 rounded-lg shadow-md transition-all disabled:opacity-50 text-lg w-full md:w-auto"
        >
          {isSubmitting ? "Spracovávam..." : "Dokončiť registráciu"}
        </button>
      </div>

    </div>
  );
}
