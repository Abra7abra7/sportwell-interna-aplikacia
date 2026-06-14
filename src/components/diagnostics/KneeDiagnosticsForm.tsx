import React, { useState, useEffect } from 'react';

interface ClientListItem {
  id: string;
  full_name: string;
  role: string;
  email?: string;
  phone?: string;
  metadata?: any;
}

interface KneeDiagnosticsFormProps {
  selectedClientId: string;
  creatorId: string;
  clients: ClientListItem[];
  onSubmit: (formData: Record<string, any>) => Promise<boolean>;
  onCancel: () => void;
}

export default function KneeDiagnosticsForm({
  selectedClientId,
  creatorId,
  clients,
  onSubmit,
  onCancel,
}: KneeDiagnosticsFormProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // --- Step 1: GDPR & Identity ---
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneBirthDate, setPhoneBirthDate] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [verifiedClient, setVerifiedClient] = useState<ClientListItem | null>(null);

  // Auto-prefill if selectedClientId is provided on mount
  useEffect(() => {
    if (selectedClientId) {
      const client = clients.find((c) => c.id === selectedClientId);
      if (client) {
        setVerifiedClient(client);
        setEmail(client.email || '');
        const nameParts = client.full_name.split(' ');
        setFirstName(nameParts[0] || '');
        setLastName(nameParts.slice(1).join(' ') || '');
        const bdate = client.metadata?.birth_date || client.metadata?.birthDate || '';
        const ph = client.phone || '';
        setPhoneBirthDate(ph && bdate ? `${ph} / ${bdate}` : ph || bdate);
      }
    }
  }, [selectedClientId, clients]);

  const handleVerifyClient = () => {
    setErrorMsg('');
    const client = clients.find((c) => c.email?.toLowerCase() === email.toLowerCase());
    if (client) {
      setVerifiedClient(client);
      const nameParts = client.full_name.split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      const bdate = client.metadata?.birth_date || client.metadata?.birthDate || '';
      const ph = client.phone || '';
      setPhoneBirthDate(ph && bdate ? `${ph} / ${bdate}` : ph || bdate);
    } else {
      setErrorMsg('Klient s týmto e-mailom nebol nájdený. Vyplňte údaje ručne.');
      setVerifiedClient(null);
    }
  };

  // --- Step 2: Vstupná anamnéza ---
  const [gender, setGender] = useState('Muž');
  const [activeSport, setActiveSport] = useState('');
  const [finding, setFinding] = useState('');
  const [surgeryType, setSurgeryType] = useState('');
  const [surgeryDate, setSurgeryDate] = useState('');
  const [injuryDate, setInjuryDate] = useState('');

  // --- Step 3: Funkčné svalové testy ---
  const [leftAnkleFlexion, setLeftAnkleFlexion] = useState('norma');
  const [rightAnkleFlexion, setRightAnkleFlexion] = useState('norma');
  const [leftKneeFlexion, setLeftKneeFlexion] = useState('norma');
  const [rightKneeFlexion, setRightKneeFlexion] = useState('norma');
  const [leftKneeExtension, setLeftKneeExtension] = useState('norma');
  const [rightKneeExtension, setRightKneeExtension] = useState('norma');
  const [leftHipFlexion, setLeftHipFlexion] = useState('norma');
  const [rightHipFlexion, setRightHipFlexion] = useState('norma');
  const [leftHipExtension, setLeftHipExtension] = useState('norma');
  const [rightHipExtension, setRightHipExtension] = useState('norma');
  const [leftHipExtRotation, setLeftHipExtRotation] = useState('norma');
  const [rightHipExtRotation, setRightHipExtRotation] = useState('norma');
  const [leftHipIntRotation, setLeftHipIntRotation] = useState('norma');
  const [rightHipIntRotation, setRightHipIntRotation] = useState('norma');
  const [mobilityNotes, setMobilityNotes] = useState('');

  // --- Step 4: Mobilty files ---
  const [uploadedMobilityFiles, setUploadedMobilityFiles] = useState<string[]>([]);
  const [mobilityFilesNotes, setMobilityFilesNotes] = useState('');

  // --- Step 5: Strength files ---
  const [uploadedStrengthFiles, setUploadedStrengthFiles] = useState<string[]>([]);
  const [strengthFilesNotes, setStrengthFilesNotes] = useState('');

  // --- Step 6: Záver ---
  const [conclusionNotes, setConclusionNotes] = useState('');

  const handleFileUpload = (type: 'mobility' | 'strength', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'mobility') setUploadedMobilityFiles((prev) => [...prev, file.name]);
      if (type === 'strength') setUploadedStrengthFiles((prev) => [...prev, file.name]);
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!firstName || !lastName || !email || !phoneBirthDate) {
        setErrorMsg('Meno, Priezvisko, E-mail a Tel. kontakt / Dátum narodenia sú povinné.');
        return;
      }
      if (!gdprConsent) {
        setErrorMsg('Pre pokračovanie musíte udelili súhlas s podmienkami (GDPR).');
        return;
      }
    }
    setErrorMsg('');
    setStep((s) => s + 1);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conclusionNotes.trim()) {
      setErrorMsg('Krok 6: Záverečné zhodnotenie je povinné.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const finalPayload = {
      // Step 1
      clientEmail: email,
      clientFirstName: firstName,
      clientLastName: lastName,
      clientPhoneBirthDate: phoneBirthDate,
      gdprConsent,
      // Step 2
      gender,
      activeSport,
      finding,
      surgeryType,
      surgeryDate,
      injuryDate,
      // Step 3
      leftAnkleFlexion,
      rightAnkleFlexion,
      leftKneeFlexion,
      rightKneeFlexion,
      leftKneeExtension,
      rightKneeExtension,
      leftHipFlexion,
      rightHipFlexion,
      leftHipExtension,
      rightHipExtension,
      leftHipExtRotation,
      rightHipExtRotation,
      leftHipIntRotation,
      rightHipIntRotation,
      mobilityNotes,
      // Step 4
      uploadedMobilityFiles,
      mobilityFilesNotes,
      // Step 5
      uploadedStrengthFiles,
      strengthFilesNotes,
      // Step 6
      conclusionNotes,
    };

    try {
      const success = await onSubmit(finalPayload);
      if (success) {
        onCancel();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Chyba pri odosielaní.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-6 text-xs text-brand-navy">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy">Výstupná diagnostika po OP kolena</h2>
          <p className="text-xs text-gray-400 mt-1">Sledovanie rozsahu kolenného kĺbu a dynamometrických testov po operácii.</p>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-colors"
        >
          Zrušiť
        </button>
      </div>

      {/* Progress indicators */}
      <div className="flex flex-wrap gap-2 justify-between items-center bg-brand-off-white p-3 rounded-xl border border-gray-100">
        {[1, 2, 3, 4, 5, 6].map((s) => (
          <button
            key={s}
            onClick={() => {
              if (s < step) setStep(s);
            }}
            disabled={s > step}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              step === s
                ? 'bg-brand-navy text-white scale-105'
                : s < step
                ? 'bg-brand-light-cyan text-brand-navy border border-brand-cyan/30 cursor-pointer'
                : 'bg-white text-gray-300 border border-gray-100 cursor-not-allowed'
            }`}
          >
            Krok {s}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl font-semibold">
          {errorMsg}
        </div>
      )}

      {/* STEP 1: GDPR & IDENTITY */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold border-b pb-1">Krok 1: Súhlas so spracovaním údajov</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="verify-email" className="block font-bold">E-mail <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <input
                  id="verify-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                  placeholder="klient@email.sk"
                />
                <button
                  type="button"
                  onClick={handleVerifyClient}
                  className="px-4 py-2 bg-brand-navy text-white font-bold rounded-lg hover:bg-brand-navy/90 transition-colors"
                >
                  Overiť klienta
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="phone-birth" className="block font-bold">Tel. kontakt / Dátum narodenia <span className="text-red-500">*</span></label>
              <input
                id="phone-birth"
                type="text"
                value={phoneBirthDate}
                onChange={(e) => setPhoneBirthDate(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                placeholder="+4219... / DD.MM.RRRR"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="firstname" className="block font-bold">Meno <span className="text-red-500">*</span></label>
              <input
                id="firstname"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="lastname" className="block font-bold">Priezvisko <span className="text-red-500">*</span></label>
              <input
                id="lastname"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
              />
            </div>
          </div>

          <div className="border p-3 rounded-xl bg-brand-off-white/40">
            <label htmlFor="gdpr-check" className="flex items-center gap-3 cursor-pointer">
              <input
                id="gdpr-check"
                type="checkbox"
                checked={gdprConsent}
                onChange={(e) => setGdprConsent(e.target.checked)}
                className="w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
              />
              <span className="font-semibold text-gray-700">Súhlasím so spracovaním osobných údajov a zaznamenaním rehabilitácie kolena (GDPR) <span className="text-red-500 font-bold">*</span></span>
            </label>
          </div>
        </div>
      )}

      {/* STEP 2: VSTUPNÁ ANAMNÉZA */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold border-b pb-1">Krok 2: Vstupná anamnéza</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 border p-3 rounded-xl">
              <label className="block font-bold">1. Pohlavie</label>
              <div className="flex gap-4">
                {['Muž', 'Žena'].map((g) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={gender === g}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-4 h-4 text-brand-cyan"
                    />
                    <span>{g}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="sport" className="block font-bold">2. Venujete sa aktívne nejakému športu?</label>
              <input
                id="sport"
                type="text"
                value={activeSport}
                onChange={(e) => setActiveSport(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                placeholder="Napr. beh, hokej, žiadny"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="finding" className="block font-bold">3. Nález</label>
            <textarea
              id="finding"
              value={finding}
              onChange={(e) => setFinding(e.target.value)}
              className="w-full bg-brand-off-white border p-2 rounded-lg outline-none h-20 focus:border-brand-navy"
              placeholder="Popis aktuálneho nálezu..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label htmlFor="surgery" className="block font-bold">4. Operačný výkon</label>
              <input
                id="surgery"
                type="text"
                value={surgeryType}
                onChange={(e) => setSurgeryType(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                placeholder="Napr. plastika ACL, sutura menisku"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="surgery-date" className="block font-bold">5. Dátum operácie</label>
              <input
                id="surgery-date"
                type="date"
                value={surgeryDate}
                onChange={(e) => setSurgeryDate(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="injury-date" className="block font-bold">6. Dátum úrazu</label>
              <input
                id="injury-date"
                type="date"
                value={injuryDate}
                onChange={(e) => setInjuryDate(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: MOBILITA A FLEXIBILITA */}
      {step === 3 && (
        <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
          <h3 className="text-sm font-bold border-b pb-1">Krok 3: Funkčné svalové testy – mobilita a flexibilita</h3>

          {/* Vizuálna pomôcka (ilustračný obrázok) */}
          <div className="bg-brand-light-cyan/30 border border-brand-cyan/20 p-3 rounded-xl flex items-center gap-3">
            <span className="text-xl">📐</span>
            <div>
              <strong className="block">Ilustračné ukážky testov (image_878b17.jpg)</strong>
              <span className="text-[10px] text-gray-500">Dorzálna flexia členka, flexia/extenzia kolena a bedra.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {[
              { label: '1. Dorzálna flexia v členkovom kĺbe (Ľavý členok)', val: leftAnkleFlexion, set: setLeftAnkleFlexion },
              { label: '1. Dorzálna flexia v členkovom kĺbe (Pravý členok)', val: rightAnkleFlexion, set: setRightAnkleFlexion },
              { label: '2. Kolenný kĺb – flexia (Ľavý kĺb)', val: leftKneeFlexion, set: setLeftKneeFlexion },
              { label: '2. Kolenný kĺb – flexia (Pravý kĺb)', val: rightKneeFlexion, set: setRightKneeFlexion },
              { label: '3. Kolenný kĺb – extenzia (Ľavý kĺb)', val: leftKneeExtension, set: setLeftKneeExtension },
              { label: '3. Kolenný kĺb – extenzia (Pravý kĺb)', val: rightKneeExtension, set: setRightKneeExtension },
              { label: '4. Bedrový kĺb – flexia (Ľavý kĺb)', val: leftHipFlexion, set: setLeftHipFlexion },
              { label: '4. Bedrový kĺb – flexia (Pravý kĺb)', val: rightHipFlexion, set: setRightHipFlexion },
              { label: '5. Bedrový kĺb – Extenzia (Ľavý kĺb)', val: leftHipExtension, set: setLeftHipExtension },
              { label: '5. Bedrový kĺb – Extenzia (Pravý kĺb)', val: rightHipExtension, set: setRightHipExtension },
              { label: '6. Bedrový kĺb – vonkajšia rotácia (Ľavý kĺb)', val: leftHipExtRotation, set: setLeftHipExtRotation },
              { label: '6. Bedrový kĺb – vonkajšia rotácia (Pravý kĺb)', val: rightHipExtRotation, set: setRightHipExtRotation },
              { label: '7. Bedrový kĺb – vnútorná rotácia (Ľavý kĺb)', val: leftHipIntRotation, set: setLeftHipIntRotation },
              { label: '7. Bedrový kĺb – vnútorná rotácia (Pravý kĺb)', val: rightHipIntRotation, set: setRightHipIntRotation },
            ].map((field, idx) => (
              <div key={idx} className="flex flex-col gap-1 p-2 border rounded-lg bg-brand-off-white/40">
                <span className="font-bold text-[10px]">{field.label}</span>
                <select
                  value={field.val}
                  onChange={(e) => field.set(e.target.value)}
                  className="w-full bg-white border p-2 rounded outline-none"
                >
                  <option value="norma">norma</option>
                  <option value="mierne obmedzený rozsah">mierne obmedzený rozsah</option>
                  <option value="výrazne obmedzený rozsah">výrazne obmedzený rozsah</option>
                </select>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <label htmlFor="mob-notes" className="block font-bold">Poznámka</label>
            <textarea
              id="mob-notes"
              value={mobilityNotes}
              onChange={(e) => setMobilityNotes(e.target.value)}
              className="w-full bg-brand-off-white border p-2 rounded-lg outline-none h-20 focus:border-brand-navy"
              placeholder="Doplňujúce poznámky k mobilite kolenného kĺbu..."
            />
          </div>
        </div>
      )}

      {/* STEP 4: MOBILITY FILES */}
      {step === 4 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold border-b pb-1">Krok 4: Funkčné svalové testy – nahrávanie súborov</h3>

          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center bg-brand-off-white hover:bg-brand-light-cyan/30 hover:border-brand-cyan/40 transition-colors">
            <span className="font-bold text-gray-400 block mb-2">Pretiahnite fotografie/výsledky mobility sem</span>
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              id="mob-file-upload"
              onChange={(e) => handleFileUpload('mobility', e)}
            />
            <label
              htmlFor="mob-file-upload"
              className="inline-block py-2 px-5 bg-brand-navy text-white font-bold rounded-xl cursor-pointer hover:bg-brand-navy/90 transition-colors"
            >
              Vybrať súbor
            </label>
          </div>

          {uploadedMobilityFiles.length > 0 && (
            <div className="p-3 bg-brand-light-cyan/40 border border-brand-cyan/20 rounded-xl space-y-1">
              <strong className="block text-[10px] uppercase text-gray-500">Nahrané súbory:</strong>
              {uploadedMobilityFiles.map((fn, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white border p-2 rounded-lg font-semibold">
                  <span>📐 {fn}</span>
                  <button type="button" onClick={() => setUploadedMobilityFiles(uploadedMobilityFiles.filter((_, i) => i !== idx))} className="text-red-500 font-bold hover:underline">Zmazať</button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="mob-files-notes" className="block font-bold">Doplňujúce informácie</label>
            <textarea
              id="mob-files-notes"
              value={mobilityFilesNotes}
              onChange={(e) => setMobilityFilesNotes(e.target.value)}
              className="w-full bg-brand-off-white border p-2 rounded-lg outline-none h-24 focus:border-brand-navy"
              placeholder="Poznámky k vykonaným testom flexibility..."
            />
          </div>
        </div>
      )}

      {/* STEP 5: STRENGTH FILES */}
      {step === 5 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold border-b pb-1">Krok 5: Silové testy koleno – zoznam</h3>

          {/* Vizuálna pomôcka (ilustračný obrázok) */}
          <div className="bg-brand-light-cyan/30 border border-brand-cyan/20 p-3 rounded-xl flex items-center gap-3">
            <span className="text-xl">⚡</span>
            <div>
              <strong className="block">Ilustračné ukážky silového testovania (image_878819.jpg)</strong>
              <span className="text-[10px] text-gray-500">Dynamo flexia/extenzia, Sit to stand, Squat, Countermovement jump.</span>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center bg-brand-off-white hover:bg-brand-light-cyan/30 hover:border-brand-cyan/40 transition-colors pt-4">
            <span className="font-bold text-gray-400 block mb-2">Pretiahnite výsledky z meraní sily kolena sem</span>
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              id="str-file-upload"
              onChange={(e) => handleFileUpload('strength', e)}
            />
            <label
              htmlFor="str-file-upload"
              className="inline-block py-2 px-5 bg-brand-navy text-white font-bold rounded-xl cursor-pointer hover:bg-brand-navy/90 transition-colors"
            >
              Vybrať súbor
            </label>
          </div>

          {uploadedStrengthFiles.length > 0 && (
            <div className="p-3 bg-brand-light-cyan/40 border border-brand-cyan/20 rounded-xl space-y-1">
              <strong className="block text-[10px] uppercase text-gray-500">Nahrané súbory:</strong>
              {uploadedStrengthFiles.map((fn, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white border p-2 rounded-lg font-semibold">
                  <span>💪 {fn}</span>
                  <button type="button" onClick={() => setUploadedStrengthFiles(uploadedStrengthFiles.filter((_, i) => i !== idx))} className="text-red-500 font-bold hover:underline">Zmazať</button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="str-files-notes" className="block font-bold">Doplňujúce informácie</label>
            <textarea
              id="str-files-notes"
              value={strengthFilesNotes}
              onChange={(e) => setStrengthFilesNotes(e.target.value)}
              className="w-full bg-brand-off-white border p-2 rounded-lg outline-none h-24 focus:border-brand-navy"
              placeholder="Poznámky k výsledkom silových testov, asymetriám kolena atď..."
            />
          </div>
        </div>
      )}

      {/* STEP 6: ZÁVER */}
      {step === 6 && (
        <form onSubmit={handleFinalSubmit} className="space-y-4">
          <h3 className="text-sm font-bold border-b pb-1">Krok 6: Záver</h3>

          <div className="space-y-1">
            <label htmlFor="conclusion" className="block font-bold">
              Na základe zistených svalových dysbalancií sa budeme venovať nasledujúcim kľúčovým segmentom: <span className="text-red-500">*</span>
            </label>
            <textarea
              id="conclusion"
              required
              value={conclusionNotes}
              onChange={(e) => setConclusionNotes(e.target.value)}
              className="w-full bg-brand-off-white border p-3 rounded-lg outline-none h-32 focus:border-brand-navy"
              placeholder="Zadajte finálne zhodnotenie svalových dysbalancií a zameranie rehab plánu..."
            />
          </div>

          <div className="bg-brand-light-cyan/40 border border-brand-cyan/20 p-3 rounded-xl">
            <p className="font-semibold text-brand-navy">Odoslaním formulára vytvoríte výstupný diagnostický záznam po operácii kolena pre klienta {firstName} {lastName}.</p>
          </div>
        </form>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-100">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="w-1/3 py-2.5 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            Späť
          </button>
        )}
        {step < 6 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className={`py-2.5 font-bold rounded-xl transition-all min-h-[44px] ${
              step === 1 ? 'w-full' : 'flex-1'
            } bg-brand-navy text-white hover:bg-brand-navy/90`}
          >
            Pokračovať
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinalSubmit}
            disabled={isSubmitting || !conclusionNotes.trim()}
            className="flex-1 py-2.5 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl hover:bg-brand-hover-cyan transition-colors disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? 'Odosielam...' : 'Odoslať'}
          </button>
        )}
      </div>
    </div>
  );
}
