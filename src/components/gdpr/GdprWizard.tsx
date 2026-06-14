import React, { useState } from 'react';

export interface ClientProfile {
  id: string;
  role: 'admin' | 'trener' | 'klient';
  full_name: string;
  email?: string;
  phone: string;
  gdpr_signed_at: string | null;
  created_at?: string;
  metadata: {
    marketing_opt_in?: boolean;
    fms_inbody_opt_in?: boolean;
    meta_lookalike_opt_in?: boolean;
    [key: string]: any;
  };
}

interface GdprWizardProps {
  sessionUser: any;
  currentUserProfile: ClientProfile;
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    birthDate: string;
    address: string;
    email: string;
    phone: string;
    primaryInterest: string;
    marketingAccepted: boolean;
    metaAccepted: boolean;
    diagAccepted: boolean;
  }) => Promise<void>;
  onSignOut: () => void;
}

export default function GdprWizard({
  sessionUser,
  currentUserProfile,
  onSubmit,
  onSignOut,
}: GdprWizardProps) {
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onbFirstName, setOnbFirstName] = useState('');
  const [onbLastName, setOnbLastName] = useState('');
  const [onbBirthDate, setOnbBirthDate] = useState('');
  const [onbAddress, setOnbAddress] = useState('');
  const [onbEmail, setOnbEmail] = useState(currentUserProfile.email || sessionUser?.email || '');
  const [onbPhone, setOnbPhone] = useState(currentUserProfile.phone || '');
  const [onbInterest, setOnbInterest] = useState('Fyzioterapia a diagnostika');

  const [onbPrivacyAccepted, setOnbPrivacyAccepted] = useState(false);
  const [onbTermsAccepted, setOnbTermsAccepted] = useState(false);
  const [onbMarketingAccepted, setOnbMarketingAccepted] = useState(false);
  const [onbMetaAccepted, setOnbMetaAccepted] = useState(false);
  const [onbDiagAccepted, setOnbDiagAccepted] = useState(false);

  const [showPrivacyTerms, setShowPrivacyTerms] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Select all handler
  const handleSelectAll = (checked: boolean) => {
    setOnbPrivacyAccepted(checked);
    setOnbTermsAccepted(checked);
    setOnbMarketingAccepted(checked);
    setOnbMetaAccepted(checked);
    setOnbDiagAccepted(checked);
  };

  const isAllChecked = 
    onbPrivacyAccepted && 
    onbTermsAccepted && 
    onbMarketingAccepted && 
    onbMetaAccepted && 
    onbDiagAccepted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onbPrivacyAccepted || !onbTermsAccepted) return;

    setIsSaving(true);
    try {
      await onSubmit({
        firstName: onbFirstName,
        lastName: onbLastName,
        birthDate: onbBirthDate,
        address: onbAddress,
        email: onbEmail,
        phone: onbPhone,
        primaryInterest: onbInterest,
        marketingAccepted: onbMarketingAccepted,
        metaAccepted: onbMetaAccepted,
        diagAccepted: onbDiagAccepted,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020C1B]/95 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-panel-dark text-white rounded-2xl max-w-lg w-full p-8 shadow-2xl border border-white/10 space-y-6 my-8">
        <div className="text-center">
          <div className="inline-block mb-2 overflow-hidden rounded-xl bg-black border border-white/10 p-1">
            <img src="/logo.png" alt="SportWell Logo" className="w-12 h-12 object-contain" />
          </div>
          <h2 className="text-2xl font-bold">Aktivácia profilu</h2>
          <p className="text-xs text-gray-300 mt-1">
            Krok {onboardingStep} z 3:{' '}
            {onboardingStep === 1 
              ? 'Identifikačné údaje' 
              : onboardingStep === 2 
                ? 'Výber služby' 
                : 'Právne súhlasy'}
          </p>

          <div className="w-full bg-white/10 h-1 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-brand-cyan h-1 transition-all duration-300"
              style={{ width: `${(onboardingStep / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* STEP 1: IDENTITY */}
        {onboardingStep === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); setOnboardingStep(2); }} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-gray-300 font-semibold mb-1">Meno <span className="text-red-500">*</span></label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={onbFirstName}
                  onChange={(e) => setOnbFirstName(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                  placeholder="Ján"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-gray-300 font-semibold mb-1">Priezvisko <span className="text-red-500">*</span></label>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={onbLastName}
                  onChange={(e) => setOnbLastName(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                  placeholder="Novák"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="birthDate" className="block text-gray-300 font-semibold mb-1">Dátum narodenia <span className="text-red-500">*</span></label>
                <input
                  id="birthDate"
                  type="date"
                  required
                  value={onbBirthDate}
                  onChange={(e) => setOnbBirthDate(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-gray-300 font-semibold mb-1">Telefónne číslo <span className="text-red-500">*</span></label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={onbPhone}
                  onChange={(e) => setOnbPhone(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                  placeholder="+421 900 000 000"
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-gray-300 font-semibold mb-1">Trvalý pobyt <span className="text-red-500">*</span></label>
              <input
                id="address"
                type="text"
                required
                value={onbAddress}
                onChange={(e) => setOnbAddress(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                placeholder="Hlavná 123, 811 01 Bratislava"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-gray-300 font-semibold mb-1">E-mail <span className="text-red-500">*</span></label>
              <input
                id="email"
                type="email"
                required
                value={onbEmail}
                onChange={(e) => setOnbEmail(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                placeholder="meno@domena.sk"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl hover:bg-brand-hover-cyan transition-colors min-h-[44px]"
            >
              Pokračovať na výber služby
            </button>
          </form>
        )}

        {/* STEP 2: SERVICE CHOICE */}
        {onboardingStep === 2 && (
          <form onSubmit={(e) => { e.preventDefault(); setOnboardingStep(3); }} className="space-y-4 text-xs">
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl leading-relaxed text-gray-300">
              <p>Zvoľte prosím typ služby, o ktorú máte v centre SportWell záujem:</p>
            </div>

            <div className="space-y-3">
              {[
                { id: 'srv-1', val: 'Masáž', desc: 'Relaxačné a športové masáže' },
                { id: 'srv-2', val: 'Funkčný tréning a diagnostika', desc: 'Individuálne pohybové tréningy' },
                { id: 'srv-3', val: 'Fyzioterapia a diagnostika', desc: 'Rehabilitačné a fyzioterapeutické cvičenia' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  htmlFor={opt.id}
                  className="flex items-start gap-3 border border-white/10 rounded-xl p-3 bg-white/5 cursor-pointer hover:border-brand-cyan/40 transition-colors"
                >
                  <input
                    id={opt.id}
                    type="radio"
                    name="primaryInterest"
                    value={opt.val}
                    checked={onbInterest === opt.val}
                    onChange={(e) => setOnbInterest(e.target.value)}
                    className="mt-0.5 w-4 h-4 text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                  />
                  <div>
                    <span className="font-bold text-white block">{opt.val}</span>
                    <span className="text-[10px] text-gray-400">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOnboardingStep(1)}
                className="w-1/3 py-2 border border-white/20 rounded-xl font-bold hover:bg-white/10 min-h-[44px]"
              >
                Späť
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl hover:bg-brand-hover-cyan transition-colors min-h-[44px]"
              >
                Pokračovať na súhlasy
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: CONSENTS & E-SIGN */}
        {onboardingStep === 3 && (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Global check all control */}
            <div className="p-3 bg-brand-cyan/10 border border-brand-cyan/20 rounded-xl">
              <label htmlFor="selectAll" className="flex items-center gap-3 cursor-pointer">
                <input
                  id="selectAll"
                  type="checkbox"
                  checked={isAllChecked}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                />
                <span className="font-bold text-brand-cyan">Zaškrtnúť a prijať všetko nasledujúce</span>
              </label>
            </div>

            <div className="space-y-3">
              
              {/* Checkbox 1: GDPR Article 26 */}
              <div className="border border-white/10 rounded-xl p-3 bg-white/5 space-y-2">
                <label htmlFor="privacyConsent" className="flex items-start gap-3 cursor-pointer">
                  <input
                    id="privacyConsent"
                    type="checkbox"
                    checked={onbPrivacyAccepted}
                    onChange={(e) => setOnbPrivacyAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                  />
                  <span>
                    Oboznámenie sa s pravidlami ochrany osobných údajov... (čl. 26 GDPR) <span className="text-red-500 font-bold">*</span>
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPrivacyTerms(!showPrivacyTerms)}
                  className="text-[10px] text-brand-cyan hover:underline block"
                >
                  {showPrivacyTerms ? 'Zobraziť menej' : 'Zobraziť viac informácií'}
                </button>
                {showPrivacyTerms && (
                  <div className="text-[10px] text-gray-400 bg-black/30 p-2.5 rounded-lg border border-white/5 max-h-24 overflow-y-auto leading-relaxed">
                    Spoloční prevádzkovatelia SportWell s.r.o. a SportWell rehab s.r.o. vyhlasujú pravidlá spracovania osobných údajov a zmluvnú požiadavku potrebnú na plnenie rehabilitačných služieb a tréningov.
                  </div>
                )}
              </div>

              {/* Checkbox 2: Booking System Terms */}
              <label htmlFor="termsConsent" className="flex items-start gap-3 cursor-pointer border border-white/10 rounded-xl p-3 bg-white/5">
                <input
                  id="termsConsent"
                  type="checkbox"
                  checked={onbTermsAccepted}
                  onChange={(e) => setOnbTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                />
                <span>
                  Súhlas s podmienkami používania rezervačného systému <span className="text-red-500 font-bold">*</span>
                </span>
              </label>

              {/* Checkbox 3: Marketing email */}
              <label htmlFor="marketingOptIn" className="flex items-start gap-3 cursor-pointer border border-white/10 rounded-xl p-3 bg-white/5">
                <input
                  id="marketingOptIn"
                  type="checkbox"
                  checked={onbMarketingAccepted}
                  onChange={(e) => setOnbMarketingAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                />
                <span>Súhlas so spracovaním e-mailovej adresy na marketingové účely</span>
              </label>

              {/* Checkbox 4: Meta sharing */}
              <label htmlFor="metaOptIn" className="flex items-start gap-3 cursor-pointer border border-white/10 rounded-xl p-3 bg-white/5">
                <input
                  id="metaOptIn"
                  type="checkbox"
                  checked={onbMetaAccepted}
                  onChange={(e) => setOnbMetaAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                />
                <span>Súhlas s poskytnutím e-mailovej adresy tretej osobe (Meta Platforms) na marketingové účely</span>
              </label>

              {/* Checkbox 5: InBody & Diag */}
              <label htmlFor="diagOptIn" className="flex items-start gap-3 cursor-pointer border border-white/10 rounded-xl p-3 bg-white/5">
                <input
                  id="diagOptIn"
                  type="checkbox"
                  checked={onbDiagAccepted}
                  onChange={(e) => setOnbDiagAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                />
                <span>Súhlas so spracovaním údajov získaných počas vstupnej diagnostiky</span>
              </label>

            </div>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setOnboardingStep(2)}
                className="w-1/3 py-2 px-4 border border-white/20 rounded-xl font-bold hover:bg-white/10 transition-colors disabled:opacity-50 min-h-[44px]"
              >
                Späť
              </button>
              <button
                type="submit"
                disabled={isSaving || !onbPrivacyAccepted || !onbTermsAccepted}
                className="flex-1 py-2.5 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl hover:bg-brand-hover-cyan transition-colors flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
              >
                {isSaving ? 'Ukladám…' : 'Dokončiť registráciu'}
              </button>
            </div>
          </form>
        )}

        <div className="text-center pt-2 border-t border-white/10">
          <button
            onClick={onSignOut}
            className="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors"
          >
            Odhlásiť sa a vyplniť neskôr
          </button>
        </div>
      </div>
    </div>
  );
}
