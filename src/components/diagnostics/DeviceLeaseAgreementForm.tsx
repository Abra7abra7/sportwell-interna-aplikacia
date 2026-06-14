import React, { useState, useEffect } from 'react';

interface ClientListItem {
  id: string;
  full_name: string;
  role: string;
  email?: string;
  phone?: string;
  metadata?: any;
}

interface DeviceLeaseAgreementFormProps {
  selectedClientId: string;
  creatorId: string;
  clients: ClientListItem[];
  onSubmit: (formData: Record<string, any>) => Promise<boolean>;
  onCancel: () => void;
}

export default function DeviceLeaseAgreementForm({
  selectedClientId,
  creatorId,
  clients,
  onSubmit,
  onCancel,
}: DeviceLeaseAgreementFormProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // --- Step 1: Nájomca Details ---
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [passportId, setPassportId] = useState('');

  // Auto-prefill based on selectedClientId
  useEffect(() => {
    if (selectedClientId) {
      const client = clients.find((c) => c.id === selectedClientId);
      if (client) {
        setFullName(client.full_name || '');
        setBirthDate(client.metadata?.birth_date || client.metadata?.birthDate || '');
        setAddress(client.metadata?.address || '');
      }
    }
  }, [selectedClientId, clients]);

  // --- Step 2: Predmet Zmluvy ---
  const [device, setDevice] = useState('elektrický svalový stimulátor PowerDot PD-01M');

  // --- Step 3: Doba nájmu a nájomné ---
  const [leaseFrom, setLeaseFrom] = useState('');
  const [leaseTo, setLeaseTo] = useState('');
  const [leaseAmount, setLeaseAmount] = useState('');
  const [leaseAmountWords, setLeaseAmountWords] = useState('');

  // --- Step 5: Záver a Podpis ---
  const [signDate, setSignDate] = useState('');
  const [signEmail, setSignEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [agreementConsent, setAgreementConsent] = useState(false);

  const handleVerifyEmail = () => {
    if (!signEmail.trim()) {
      setErrorMsg('Pre overenie zadajte platný e-mail.');
      return;
    }
    setIsVerifying(true);
    setErrorMsg('');
    setTimeout(() => {
      setEmailVerified(true);
      setIsVerifying(false);
    }, 1000);
  };

  const handleNextStep = () => {
    setErrorMsg('');
    if (step === 1) {
      if (!fullName.trim() || !birthDate.trim() || !address.trim() || !passportId.trim()) {
        setErrorMsg('Meno a priezvisko, Dátum narodenia, Trvalý pobyt a Číslo občianskeho preukazu sú povinné.');
        return;
      }
    }
    if (step === 3) {
      if (!leaseFrom || !leaseTo || !leaseAmount || !leaseAmountWords.trim()) {
        setErrorMsg('Doba nájmu (Od/Do), Suma a Suma slovom sú povinné.');
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!signDate) {
      setErrorMsg('Dátum podpisu je povinný.');
      return;
    }
    if (!signEmail.trim()) {
      setErrorMsg('Email podpis je povinný.');
      return;
    }
    if (!emailVerified) {
      setErrorMsg('Pre dokončenie overte svoj e-mail stlačením tlačidla "Overiť email".');
      return;
    }
    if (!agreementConsent) {
      setErrorMsg('Pred odoslaním musíte súhlasiť so znením zmluvy.');
      return;
    }

    setIsSubmitting(true);

    const finalPayload = {
      // Step 1
      fullName,
      birthDate,
      address,
      passportId,
      // Step 2
      device,
      // Step 3
      leaseFrom,
      leaseTo,
      leaseAmount: Number(leaseAmount),
      leaseAmountWords,
      // Step 5
      signDate,
      signEmail,
      emailVerified,
      agreementConsent,
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
          <h2 className="text-xl font-bold text-brand-navy">Zmluva o nájme zdravotníckeho prístroja</h2>
          <p className="text-xs text-gray-400 mt-1">Právna zmluva o prenájme rehabilitačných pomôcok a prístrojov.</p>
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
        {[1, 2, 3, 4, 5].map((s) => (
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

      {/* STEP 1: NÁJOMCA DETAILS */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold border-b pb-1">Hlavička zmluvy (Zmluvné strany)</h3>
          
          <div className="p-3 bg-brand-off-white rounded-xl space-y-1">
            <strong>Prenajímateľ:</strong>
            <p>SportWell s.r.o., Mlynská dolina 8, Bratislava, IČO: 12345678, DIČ: 20202020</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="fullname" className="block font-bold">Meno a priezvisko nájomcu <span className="text-red-500">*</span></label>
              <input
                id="fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                placeholder="Jozef Novák"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="birthdate" className="block font-bold">Dátum narodenia <span className="text-red-500">*</span></label>
              <input
                id="birthdate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="address" className="block font-bold">Trvalý pobyt <span className="text-red-500">*</span></label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                placeholder="Hlavná 12, Bratislava"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="passport" className="block font-bold">Číslo občianskeho preukazu <span className="text-red-500">*</span></label>
              <input
                id="passport"
                type="text"
                value={passportId}
                onChange={(e) => setPassportId(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                placeholder="AA123456"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: PREDMET ZMLUVY */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold border-b pb-1">Článok I. Predmet Zmluvy</h3>
          <p className="text-gray-500 mb-2">Vyberte prístroj, ktorý si klient prenajíma:</p>

          <div className="space-y-2 border p-4 rounded-2xl bg-brand-off-white/40">
            {[
              'elektrický svalový stimulátor PowerDot PD-01M',
              'kompresné lymfodrenážne návleky NormaTec PULSE 2.0',
              'prístroj na stimuláciu prietoku krvi v rukách a nohách KAATSU',
              'kompresná ľadová terapia Game Ready Pro 2.1',
            ].map((opt) => (
              <label key={opt} className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors">
                <input
                  type="radio"
                  name="device"
                  value={opt}
                  checked={device === opt}
                  onChange={(e) => setDevice(e.target.value)}
                  className="w-4 h-4 text-brand-cyan mt-0.5"
                />
                <span className="font-semibold text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: DOBA NÁJMU A NÁJOMNÉ */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold border-b pb-1">Článok II. Doba nájmu a nájomné</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="lease-from" className="block font-bold">Doba nájmu Od <span className="text-red-500">*</span></label>
              <input
                id="lease-from"
                type="date"
                value={leaseFrom}
                onChange={(e) => setLeaseFrom(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="lease-to" className="block font-bold">Doba nájmu Do <span className="text-red-500">*</span></label>
              <input
                id="lease-to"
                type="date"
                value={leaseTo}
                onChange={(e) => setLeaseTo(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="amount" className="block font-bold">Suma (výška nájomného v EUR) <span className="text-red-500">*</span></label>
              <input
                id="amount"
                type="number"
                value={leaseAmount}
                onChange={(e) => setLeaseAmount(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                placeholder="50"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="amount-words" className="block font-bold">Suma slovom <span className="text-red-500">*</span></label>
              <input
                id="amount-words"
                type="text"
                value={leaseAmountWords}
                onChange={(e) => setLeaseAmountWords(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                placeholder="päťdesiat"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: ARTICLES III, IV, V */}
      {step === 4 && (
        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          <h3 className="text-sm font-bold border-b pb-1">Články III., IV., V.</h3>
          
          <div className="space-y-3 text-gray-600 bg-brand-off-white/40 p-4 rounded-2xl border leading-relaxed">
            <div>
              <strong className="block text-brand-navy mb-1">Článok III. Práva a povinnosti zmluvných strán</strong>
              <p>1. Nájomca je povinný užívať Predmet nájmu v súlade s návodom na obsluhu a výlučne na určený účel.</p>
              <p>2. Nájomca zodpovedá za akékoľvek poškodenie, stratu alebo zničenie Predmetu nájmu.</p>
              <p>3. Prenajímateľ má právo kedykoľvek kontrolovať stav a spôsob užívania Predmetu nájmu.</p>
            </div>
            <div className="border-t pt-2">
              <strong className="block text-brand-navy mb-1">Článok IV. Sankcie a ukončenie nájmu</strong>
              <p>1. V prípade omeškania s vrátením Predmetu nájmu je nájomca povinný zaplatiť zmluvnú pokutu vo výške 10 EUR za každý začatý deň omeškania.</p>
              <p>2. Zmluva zaniká uplynutím doby nájmu, písomnou dohodou alebo odstúpením v prípade hrubého porušenia podmienok.</p>
            </div>
            <div className="border-t pt-2">
              <strong className="block text-brand-navy mb-1">Článok V. Záverečné ustanovenia</strong>
              <p>1. Táto zmluva je vyhotovená v dvoch rovnopisoch a nadobúda platnosť dňom jej podpísania oboma zmluvnými stranami.</p>
              <p>2. Všetky zmeny a doplnky musia mať písomnú formu podpísanú zmluvnými stranami.</p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: SIGNATURE */}
      {step === 5 && (
        <form onSubmit={handleFinalSubmit} className="space-y-4">
          <h3 className="text-sm font-bold border-b pb-1">Záver a Podpisová sekcia</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="sign-date" className="block font-bold">V Bratislave, dňa <span className="text-red-500">*</span></label>
              <input
                id="sign-date"
                type="date"
                value={signDate}
                onChange={(e) => setSignDate(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="sign-email" className="block font-bold">Email podpis / Podpisový email <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <input
                  id="sign-email"
                  type="email"
                  value={signEmail}
                  onChange={(e) => setSignEmail(e.target.value)}
                  className="flex-1 bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                  placeholder="klient@email.sk"
                />
                <button
                  type="button"
                  onClick={handleVerifyEmail}
                  disabled={isVerifying || emailVerified}
                  className={`px-4 py-2 font-bold rounded-lg transition-colors ${
                    emailVerified 
                      ? 'bg-green-600 text-white' 
                      : 'bg-brand-navy text-white hover:bg-brand-navy/90'
                  }`}
                >
                  {isVerifying ? 'Overujem...' : emailVerified ? 'Overené ✓' : 'Overiť email'}
                </button>
              </div>
            </div>
          </div>

          <div className="border p-3 rounded-xl bg-brand-off-white/40">
            <label htmlFor="agreement-consent" className="flex items-center gap-3 cursor-pointer">
              <input
                id="agreement-consent"
                type="checkbox"
                checked={agreementConsent}
                onChange={(e) => setAgreementConsent(e.target.checked)}
                className="w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
              />
              <span className="font-semibold text-gray-700">Súhlasím so znením zmluvy o nájme a podmienkami zapožičania <span className="text-red-500 font-bold">*</span></span>
            </label>
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
        {step < 5 ? (
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
            disabled={isSubmitting || !agreementConsent}
            className="flex-1 py-2.5 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl hover:bg-brand-hover-cyan transition-colors disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? 'Odosielam...' : 'Podpísať a Odoslať'}
          </button>
        )}
      </div>
    </div>
  );
}
