import React from 'react';

interface DiagnosticDetailModalProps {
  record: any;
  onClose: () => void;
}

export default function DiagnosticDetailModal({ record, onClose }: DiagnosticDetailModalProps) {
  const isComplex =
    record.title === 'Komplexná diagnostika' ||
    record.title === 'Základná diagnostika' ||
    (record.form_data?.conclusionNotes !== undefined &&
      record.form_data?.leftKneeFlexion === undefined &&
      record.form_data?.leftShoulderFlexion === undefined);

  const isAnkleOp =
    record.title === 'Výstupná diagnostika po OP členkového kĺbu' ||
    (record.form_data?.uploadedFiles !== undefined &&
      record.form_data?.leftShoulderFlexion === undefined);

  const isKneeOp =
    record.title === 'Výstupná diagnostika po OP kolena' ||
    record.form_data?.uploadedStrengthFiles !== undefined;

  const isShoulderOp =
    record.title === 'Výstupná diagnostika po OP ramena' ||
    record.form_data?.leftShoulderFlexion !== undefined;

  const isDeviceLease =
    record.title === 'Zmluva o nájme zdravotníckeho prístroja' ||
    record.form_data?.passportId !== undefined;

  const data = record.form_data || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white text-brand-navy rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <div>
            <h3 className="text-lg font-bold">
              {record.title || (record.type === 'fyzio' ? 'Fyzioterapeutický záznam' : 'Diagnostický záznam')}
            </h3>
            <p className="text-xs text-gray-400">
              Dátum: {new Date(record.created_at).toLocaleString()} | Vytvoril:{' '}
              {record.profiles_creator?.full_name || 'Tréner'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 border rounded-xl hover:bg-gray-50 transition-colors font-bold text-xs px-3"
          >
            Zatvoriť
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 text-xs">
          {isKneeOp ? (
            <div className="space-y-6">
              
              {/* Step 1: GDPR & Identity */}
              <div className="border p-4 rounded-xl space-y-3 bg-brand-off-white/30">
                <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Identifikačné údaje & GDPR</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><strong>Meno:</strong> {data.clientFirstName} {data.clientLastName}</div>
                  <div><strong>E-mail:</strong> {data.clientEmail}</div>
                  <div><strong>Tel. kontakt / Dátum narodenia:</strong> {data.clientPhoneBirthDate}</div>
                  <div><strong>GDPR Súhlas:</strong> {data.gdprConsent ? 'Udelený' : 'Neudelený'}</div>
                </div>
              </div>

              {/* Step 2: Vstupná anamnéza */}
              <div className="border p-4 rounded-xl space-y-3 bg-brand-off-white/30">
                <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Vstupná anamnéza</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><strong>Pohlavie:</strong> {data.gender}</div>
                  <div><strong>Aktívny šport:</strong> {data.activeSport || 'Nie'}</div>
                  <div><strong>Operačný výkon:</strong> {data.surgeryType}</div>
                  <div><strong>Dátum operácie:</strong> {data.surgeryDate}</div>
                  <div><strong>Dátum úrazu:</strong> {data.injuryDate}</div>
                </div>
                {data.finding && (
                  <div className="border-t pt-2">
                    <strong>Lekársky nález:</strong>
                    <p className="text-gray-700 mt-1 whitespace-pre-wrap">{data.finding}</p>
                  </div>
                )}
              </div>

              {/* Step 3: Funkčné svalové testy */}
              <div className="border p-4 rounded-xl space-y-3 bg-brand-off-white/30">
                <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Funkčné svalové testy – mobilita a flexibilita</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><strong>Dorzálna flexia členka (Ľ/P):</strong> {data.leftAnkleFlexion} / {data.rightAnkleFlexion}</div>
                  <div><strong>Koleno flexia (Ľ/P):</strong> {data.leftKneeFlexion} / {data.rightKneeFlexion}</div>
                  <div><strong>Koleno extenzia (Ľ/P):</strong> {data.leftKneeExtension} / {data.rightKneeExtension}</div>
                  <div><strong>Bedro flexia (Ľ/P):</strong> {data.leftHipFlexion} / {data.rightHipFlexion}</div>
                  <div><strong>Bedro extenzia (Ľ/P):</strong> {data.leftHipExtension} / {data.rightHipExtension}</div>
                  <div><strong>Bedro vonk. rotácia (Ľ/P):</strong> {data.leftHipExtRotation} / {data.rightHipExtRotation}</div>
                  <div><strong>Bedro vnút. rotácia (Ľ/P):</strong> {data.leftHipIntRotation} / {data.rightHipIntRotation}</div>
                </div>
                {data.mobilityNotes && (
                  <div className="border-t pt-2">
                    <strong>Poznámka k mobilite a flexibilite:</strong>
                    <p className="text-gray-700 mt-1 whitespace-pre-wrap">{data.mobilityNotes}</p>
                  </div>
                )}
              </div>

              {/* Step 4: Mobilty files */}
              <div className="border p-4 rounded-xl space-y-2 bg-brand-off-white/30">
                <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Funkčné svalové testy – nahrávanie súborov</h4>
                <div>
                  <strong>Fotografie/Výsledky z testov:</strong>{' '}
                  {data.uploadedMobilityFiles?.length > 0 ? data.uploadedMobilityFiles.join(', ') : 'Žiadne'}
                </div>
                {data.mobilityFilesNotes && (
                  <div className="border-t pt-2">
                    <strong>Poznámky k výsledkom:</strong>
                    <p className="text-gray-700 mt-1 whitespace-pre-wrap">{data.mobilityFilesNotes}</p>
                  </div>
                )}
              </div>

              {/* Step 5: Strength files */}
              <div className="border p-4 rounded-xl space-y-2 bg-brand-off-white/30">
                <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Silové testy koleno</h4>
                <div>
                  <strong>Merania sily kolena:</strong>{' '}
                  {data.uploadedStrengthFiles?.length > 0 ? data.uploadedStrengthFiles.join(', ') : 'Žiadne'}
                </div>
                {data.strengthFilesNotes && (
                  <div className="border-t pt-2">
                    <strong>Poznámky k meraniam:</strong>
                    <p className="text-gray-700 mt-1 whitespace-pre-wrap">{data.strengthFilesNotes}</p>
                  </div>
                )}
              </div>

              {/* Step 6: Záver */}
              <div className="border p-4 rounded-xl space-y-2 bg-brand-cyan/5 border-brand-cyan/30">
                <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Záver a odporúčania (svalové dysbalancie)</h4>
                <p className="text-gray-800 font-medium leading-relaxed whitespace-pre-wrap">{data.conclusionNotes}</p>
              </div>

            </div>
          ) : isDeviceLease ? (
            <div className="space-y-6">
              
              {/* Section 1: Zmluvné strany */}
              <div className="border p-4 rounded-xl space-y-3 bg-brand-off-white/30">
                <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Zmluvné strany</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><strong>Nájomca:</strong> {data.fullName}</div>
                  <div><strong>Dátum narodenia:</strong> {data.birthDate}</div>
                  <div><strong>Trvalý pobyt:</strong> {data.address}</div>
                  <div><strong>Číslo OP:</strong> {data.passportId}</div>
                </div>
              </div>

              {/* Section 2: Predmet nájmu */}
              <div className="border p-4 rounded-xl space-y-3 bg-brand-off-white/30">
                <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Článok I. Predmet nájmu</h4>
                <div>
                  <strong>Prenajímaný prístroj:</strong> {data.device}
                </div>
              </div>

              {/* Section 3: Doba nájmu a nájomné */}
              <div className="border p-4 rounded-xl space-y-3 bg-brand-off-white/30">
                <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Článok II. Doba nájmu a nájomné</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><strong>Nájom Od:</strong> {data.leaseFrom}</div>
                  <div><strong>Nájom Do:</strong> {data.leaseTo}</div>
                  <div><strong>Výška nájomného:</strong> {data.leaseAmount} EUR</div>
                  <div><strong>Slovom:</strong> {data.leaseAmountWords}</div>
                </div>
              </div>

              {/* Section 4: Podpisy */}
              <div className="border p-4 rounded-xl space-y-3 bg-brand-cyan/5 border-brand-cyan/30">
                <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Záver a podpisová doložka</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><strong>V Bratislave, dňa:</strong> {data.signDate}</div>
                  <div><strong>Overovací podpisový e-mail:</strong> {data.signEmail}</div>
                  <div><strong>Stav email overenia:</strong> {data.emailVerified ? 'Overené' : 'Neoverené'}</div>
                  <div><strong>Súhlas so znením zmluvy:</strong> {data.agreementConsent ? 'Áno' : 'Nie'}</div>
                </div>
              </div>

            </div>
          ) : isShoulderOp ? (
            <div className="space-y-6">
              
              {/* Step 1: GDPR & Identity */}
              <div className="border p-4 rounded-xl space-y-3 bg-brand-off-white/30">
                <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Identifikačné údaje & GDPR</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><strong>Meno:</strong> {data.clientFirstName} {data.clientLastName}</div>
                  <div><strong>E-mail:</strong> {data.clientEmail}</div>
                  <div><strong>Tel. kontakt / Dátum narodenia:</strong> {data.clientPhoneBirthDate}</div>
                  <div><strong>GDPR Súhlas:</strong> {data.gdprConsent ? 'Udelený' : 'Neudelený'}</div>
                </div>
              </div>

              {/* Step 2: Vstupná anamnéza */}
              <div className="border p-4 rounded-xl space-y-3 bg-brand-off-white/30">
                <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Vstupná anamnéza</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><strong>Pohlavie:</strong> {data.gender}</div>
                  <div><strong>Aktívny šport:</strong> {data.activeSport || 'Nie'}</div>
                  <div><strong>Operačný výkon:</strong> {data.surgeryType}</div>
                  <div><strong>Dátum operácie:</strong> {data.surgeryDate}</div>
                  <div><strong>Dátum úrazu:</strong> {data.injuryDate}</div>
                </div>
                {data.finding && (
                  <div className="border-t pt-2">
                    <strong>Lekársky nález:</strong>
                    <p className="text-gray-700 mt-1 whitespace-pre-wrap">{data.finding}</p>
                  </div>
                )}
              </div>

              {/* Step 3: Funkčné svalové testy */}
              <div className="border p-4 rounded-xl space-y-3 bg-brand-off-white/30">
                <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Funkčné svalové testy – mobilita a flexibilita</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><strong>Flexia (Ľ/P):</strong> {data.leftShoulderFlexion} / {data.rightShoulderFlexion}</div>
                  <div><strong>Extenzia (Ľ/P):</strong> {data.leftShoulderExtension} / {data.rightShoulderExtension}</div>
                  <div><strong>Abdukcia (Ľ/P):</strong> {data.leftShoulderAbduction} / {data.rightShoulderAbduction}</div>
                  <div><strong>Interná rotácia (Ľ/P):</strong> {data.leftShoulderIntRotation} / {data.rightShoulderIntRotation}</div>
                  <div><strong>Externá rotácia (Ľ/P):</strong> {data.leftShoulderExtRotation} / {data.rightShoulderExtRotation}</div>
                </div>
                {data.mobilityNotes && (
                  <div className="border-t pt-2">
                    <strong>Poznámka k mobilite a flexibilite:</strong>
                    <p className="text-gray-700 mt-1 whitespace-pre-wrap">{data.mobilityNotes}</p>
                  </div>
                )}
              </div>

              {/* Step 4: Silové testy */}
              <div className="border p-4 rounded-xl space-y-2 bg-brand-off-white/30">
                <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Silové testy rameno</h4>
                <div>
                  <strong>Nahrané silové reporty:</strong>{' '}
                  {data.uploadedFiles?.length > 0 ? data.uploadedFiles.join(', ') : 'Žiadne'}
                </div>
                {data.strengthNotes && (
                  <div className="border-t pt-2">
                    <strong>Poznámky k meraniam:</strong>
                    <p className="text-gray-700 mt-1 whitespace-pre-wrap">{data.strengthNotes}</p>
                  </div>
                )}
              </div>

              {/* Step 5: Záver */}
              <div className="border p-4 rounded-xl space-y-2 bg-brand-cyan/5 border-brand-cyan/30">
                <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Záver a odporúčania (svalové dysbalancie)</h4>
                <p className="text-gray-800 font-medium leading-relaxed whitespace-pre-wrap">{data.conclusionNotes}</p>
              </div>

            </div>
          ) : isAnkleOp ? (
            <div className="space-y-6">
              
              {/* Step 1: GDPR & Identity */}
              <div className="border p-4 rounded-xl space-y-3 bg-brand-off-white/30">
                <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Identifikačné údaje & GDPR</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><strong>Meno:</strong> {data.clientFirstName} {data.clientLastName}</div>
                  <div><strong>E-mail:</strong> {data.clientEmail}</div>
                  <div><strong>Dátum narodenia / Telefón:</strong> {data.clientBirthDatePhone}</div>
                  <div><strong>GDPR Súhlas:</strong> {data.gdprConsent ? 'Udelený' : 'Neudelený'}</div>
                </div>
              </div>

              {/* Step 2: Vstupná anamnéza */}
              <div className="border p-4 rounded-xl space-y-3 bg-brand-off-white/30">
                <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Vstupná anamnéza</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><strong>Pohlavie:</strong> {data.gender}</div>
                  <div><strong>Aktívny šport:</strong> {data.activeSport || 'Nie'}</div>
                  <div><strong>Operačný výkon:</strong> {data.surgeryType}</div>
                  <div><strong>Dátum operácie:</strong> {data.surgeryDate}</div>
                  <div><strong>Dátum úrazu:</strong> {data.injuryDate}</div>
                </div>
                {data.finding && (
                  <div className="border-t pt-2">
                    <strong>Lekársky nález:</strong>
                    <p className="text-gray-700 mt-1 whitespace-pre-wrap">{data.finding}</p>
                  </div>
                )}
              </div>

              {/* Step 3: Funkčné svalové testy */}
              <div className="border p-4 rounded-xl space-y-3 bg-brand-off-white/30">
                <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Funkčné svalové testy – mobilita a flexibilita</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><strong>Dorzálna flexia členka (Ľ/P):</strong> {data.leftAnkleFlexion} / {data.rightAnkleFlexion}</div>
                  <div><strong>Koleno flexia (Ľ/P):</strong> {data.leftKneeFlexion} / {data.rightKneeFlexion}</div>
                  <div><strong>Koleno extenzia (Ľ/P):</strong> {data.leftKneeExtension} / {data.rightKneeExtension}</div>
                  <div><strong>Bedro flexia (Ľ/P):</strong> {data.leftHipFlexion} / {data.rightHipFlexion}</div>
                  <div><strong>Bedro extenzia (Ľ/P):</strong> {data.leftHipExtension} / {data.rightHipExtension}</div>
                  <div><strong>Bedro vonk. rotácia (Ľ/P):</strong> {data.leftHipExtRotation} / {data.rightHipExtRotation}</div>
                  <div><strong>Bedro vnút. rotácia (Ľ/P):</strong> {data.leftHipIntRotation} / {data.rightHipIntRotation}</div>
                </div>
                {data.mobilityNotes && (
                  <div className="border-t pt-2">
                    <strong>Poznámka k mobilite a flexibilite:</strong>
                    <p className="text-gray-700 mt-1 whitespace-pre-wrap">{data.mobilityNotes}</p>
                  </div>
                )}
              </div>

              {/* Step 4: Silové testy členok */}
              <div className="border p-4 rounded-xl space-y-3 bg-brand-cyan/5 border-brand-cyan/30">
                <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Silové testy členok & Zhodnotenie</h4>
                <div>
                  <strong>Nahrané silové reporty:</strong>{' '}
                  {data.uploadedFiles?.length > 0 ? data.uploadedFiles.join(', ') : 'Žiadne reporty neboli nahrané.'}
                </div>
                {data.strengthNotes && (
                  <div className="border-t border-brand-cyan/25 pt-2">
                    <strong>Doplňujúce informácie a zhodnotenie:</strong>
                    <p className="text-gray-800 font-medium mt-1 whitespace-pre-wrap">{data.strengthNotes}</p>
                  </div>
                )}
              </div>

            </div>
          ) : isComplex ? (
            <div className="space-y-6">
              
              {/* Section 1: Identifikačné údaje */}
              <div className="border p-4 rounded-xl space-y-3 bg-brand-off-white/30">
                <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Identifikačné údaje klienta</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><strong>Meno:</strong> {data.clientFirstName} {data.clientLastName}</div>
                  <div><strong>Dátum narodenia:</strong> {data.clientBirthDate}</div>
                  <div><strong>Trvalý pobyt:</strong> {data.clientAddress}</div>
                  <div><strong>E-mail:</strong> {data.clientEmail}</div>
                  <div><strong>Telefónne číslo:</strong> {data.clientPhone}</div>
                </div>
              </div>

              {/* Section 2: Vstupná anamnéza */}
              <div className="border p-4 rounded-xl space-y-3 bg-brand-off-white/30">
                <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Vstupná anamnéza</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <strong>Ako sa o nás dozvedeli:</strong>{' '}
                    {data.referralSources?.join(', ') || 'Nevybraté'}
                    {data.referralSourceOther && ` (${data.referralSourceOther})`}
                  </div>
                  <div>
                    <strong>Ciele:</strong>{' '}
                    {data.goals?.join(', ') || 'Nevybraté'}
                    {data.goalOther && ` (${data.goalOther})`}
                  </div>
                  <div><strong>Výživový poradca (teraz):</strong> {data.nutritionistServices}</div>
                  <div><strong>Čas denne venovaný cieľom:</strong> {data.dailyTimeForGoals}</div>
                  <div><strong>Cvičenie (týždenne/čas):</strong> {data.timesPerWeekPreferred}</div>
                  <div><strong>Kedy vidieť výsledky:</strong> {data.whenToSeeResults}</div>
                </div>
              </div>

              {/* Section 3: Zdravotná anamnéza */}
              <div className="border p-4 rounded-xl space-y-3 bg-brand-off-white/30">
                <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Zdravotná anamnéza</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <strong>Zdravotné problémy:</strong>{' '}
                    {data.healthIssues?.join(', ') || 'Žiadne'}
                    {data.healthIssueOther && ` (${data.healthIssueOther})`}
                  </div>
                  <div>
                    <strong>Dlhodobé problémy:</strong>{' '}
                    {data.longTermIssues?.join(', ') || 'Žiadne'}
                    {data.longTermIssueOther && ` (${data.longTermIssueOther})`}
                  </div>
                  <div>
                    <strong>Operácie:</strong>{' '}
                    {data.surgicalInterventions?.join(', ') || 'Žiadne'}
                    {data.surgicalInterventionOther && ` (${data.surgicalInterventionOther})`}
                  </div>
                  <div>
                    <strong>Úraz, zlomenina, výron:</strong> {data.recentInjury}
                    {data.injurySpecification && ` (${data.injurySpecification})`}
                  </div>
                  <div><strong>Tehotenstvo za 12 mesiacov:</strong> {data.pregnantLast12Months}</div>
                  <div>
                    <strong>Pravidelné lieky:</strong> {data.regularMedication}
                    {data.medicationDetails && ` (${data.medicationDetails})`}
                  </div>
                  <div>
                    <strong>Obmedzená aktivita lekárom:</strong> {data.restrictedActivityByDoctor}
                    {data.restrictedActivityDetails && ` (${data.restrictedActivityDetails})`}
                  </div>
                </div>
              </div>

              {/* Section 4: Životný štýl */}
              <div className="border p-4 rounded-xl space-y-3 bg-brand-off-white/30">
                <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Životný štýl</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><strong>Výška:</strong> {data.height} cm</div>
                  <div><strong>Hmotnosť:</strong> {data.weight} kg</div>
                  <div><strong>Zamestnanie:</strong> {data.occupation}</div>
                  <div><strong>Spánok (priemer hodín):</strong> {data.sleepHours}</div>
                  <div><strong>Počet jedál denne:</strong> {data.mealsPerDay}</div>
                  <div><strong>Tekutiny (litre/deň):</strong> {data.waterPerDay}</div>
                  <div>
                    <strong>Aktuálny šport:</strong> {data.sportsCurrently}
                    {data.sportsCurrentlyDetails && ` (${data.sportsCurrentlyDetails})`}
                  </div>
                  <div>
                    <strong>Minulý šport:</strong> {data.sportsPast}
                    {data.sportsPastDetails && ` (${data.sportsPastDetails})`}
                  </div>
                  <div>
                    <strong>Držaná diéta:</strong> {data.didDietPast}
                    {data.dietPastDetails && ` (${data.dietPastDetails})`}
                  </div>
                  <div><strong>Služby nutričného špecialistu (záujem):</strong> {data.wantNutritionistServices}</div>
                </div>
                {data.consumption && (
                  <div className="border-t pt-2 space-y-1">
                    <strong>Týždenná konzumácia:</strong>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] text-gray-500">
                      <div>Zelenina: {data.consumption.vegetables}</div>
                      <div>Sladkosti: {data.consumption.sweets}</div>
                      <div>Mäso: {data.consumption.meat}</div>
                      <div>Vyprážané: {data.consumption.fried}</div>
                      <div>Alkohol: {data.consumption.alcohol}</div>
                      <div>Cestoviny: {data.consumption.pasta}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 5, 6, 7: Súbory */}
              <div className="border p-4 rounded-xl space-y-3 bg-brand-off-white/30">
                <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Nahrané súbory a vizuálne analýzy</h4>
                <div className="space-y-2">
                  <div>
                    <strong>Fotografie klienta:</strong>{' '}
                    {data.uploadedPhotos?.length > 0 ? data.uploadedPhotos.join(', ') : 'Žiadne'}
                    {data.clientPhotosNotes && <p className="italic text-gray-500 pl-2">Pozn: {data.clientPhotosNotes}</p>}
                  </div>
                  <div>
                    <strong>InBody diagnostika:</strong>{' '}
                    {data.uploadedInBody?.length > 0 ? data.uploadedInBody.join(', ') : 'Žiadne'}
                    {data.inbodyNotes && <p className="italic text-gray-500 pl-2">Pozn: {data.inbodyNotes}</p>}
                  </div>
                  <div>
                    <strong>Body vision:</strong>{' '}
                    {data.uploadedBodyVision?.length > 0 ? data.uploadedBodyVision.join(', ') : 'Žiadne'}
                    {data.bodyvisionNotes && <p className="italic text-gray-500 pl-2">Pozn: {data.bodyvisionNotes}</p>}
                  </div>
                  <div>
                    <strong>Silové testy:</strong>{' '}
                    {data.uploadedStrength?.length > 0 ? data.uploadedStrength.join(', ') : 'Žiadne'}
                    {data.strengthNotes && <p className="italic text-gray-500 pl-2">Pozn: {data.strengthNotes}</p>}
                  </div>
                </div>
              </div>

              {/* Section 8: Funkčná diagnostika */}
              <div className="border p-4 rounded-xl space-y-3 bg-brand-off-white/30">
                <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Funkčná diagnostika pohybového aparátu</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div><strong>Malleolus → Hl. fibuly:</strong> {data.malleolusFibula}</div>
                  <div><strong>Hl. fibuly → Trochanter:</strong> {data.fibulaTrochanter}</div>
                  <div><strong>Trochanter → Acromion:</strong> {data.trochanterAcromion}</div>
                  <div><strong>Rotácia Th chrbtice:</strong> {data.spineThRotation}</div>
                  <div><strong>Pravá noha - Klenba:</strong> {data.rightFootArch}</div>
                  <div><strong>Ľavá noha - Klenba:</strong> {data.leftFootArch}</div>
                  <div><strong>Hallux valgus:</strong> {data.halluxValgus}</div>
                  <div><strong>Pravý členok:</strong> {data.rightAnkleState}</div>
                  <div><strong>Ľavý členok:</strong> {data.leftAnkleState}</div>
                  <div><strong>Pravé koleno:</strong> {data.rightKneeState}</div>
                  <div><strong>Ľavé koleno:</strong> {data.leftKneeState}</div>
                  <div><strong>Predo-zadné vyosenie panvy:</strong> {data.pelvicTiltAP}</div>
                  <div><strong>Vyosenie panvy bokom:</strong> {data.pelvicTiltLateral}</div>
                  <div><strong>Rotácia panvy:</strong> {data.pelvicRotation}</div>
                  <div><strong>Lumbálna chrbtica:</strong> {data.lumbarSpine}</div>
                  <div><strong>Hrudníková (Th) chrbtica:</strong> {data.thoracicSpine}</div>
                  <div><strong>Krčná (C) chrbtica:</strong> {data.cervicalSpine}</div>
                  <div><strong>Skolióza:</strong> {data.scoliosis}</div>
                  <div><strong>Rotácia trupu:</strong> {data.trunkRotation}</div>
                  <div><strong>Pravé rameno (stavy):</strong> {data.shoulderRightState} ({data.shoulderRightValue})</div>
                  <div><strong>Ľavé rameno (stavy):</strong> {data.shoulderLeftState} ({data.shoulderLeftValue})</div>
                  <div><strong>Pravá lopatka:</strong> {data.scapulaRight?.join(', ') || 'Norma'}</div>
                  <div><strong>Ľavá lopatka:</strong> {data.scapulaLeft?.join(', ') || 'Norma'}</div>
                  <div><strong>Humero-skapulárny rytmus:</strong> {data.humeroScapularRhythm}</div>
                  <div><strong>SI skĺbenie:</strong> {data.siJointState}</div>
                  <div><strong>Vyšetrenie diastázy:</strong> {data.diastasisState} ({data.diastasisValue})</div>
                  <div><strong>Dychový stereotyp:</strong> {data.breathingPattern?.join(', ') || 'Norma'}</div>
                </div>

                <div className="border-t pt-2 space-y-2">
                  <span className="font-bold text-[10px] uppercase text-gray-500 block">Mobilita a flexibilita kĺbov</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div>Pravý členok mob: {data.rightAnkleMobValue} ({data.rightAnkleMobState})</div>
                    <div>Ľavý členok mob: {data.leftAnkleMobValue} ({data.leftAnkleMobState})</div>
                    <div>Koleno P: Flexia {data.rightKneeFlex} | Extenzia {data.rightKneeExt}</div>
                    <div>Koleno Ľ: Flexia {data.leftKneeFlex} | Extenzia {data.leftKneeExt}</div>
                    <div>Bedro P: Flexia {data.rightHipFlex} | Extenzia {data.rightHipExt} | Abd {data.rightHipAbd} | Add {data.rightHipAdd}</div>
                    <div>Bedro Ľ: Flexia {data.leftHipFlex} | Extenzia {data.leftHipExt} | Abd {data.leftHipAbd} | Add {data.leftHipAdd}</div>
                    <div>Bedro rotácie P: Vonk {data.hipRotationRightExt} | Vnút {data.hipRotationRightInt}</div>
                    <div>Bedro rotácie Ľ: Vonk {data.hipRotationLeftExt} | Vnút {data.hipRotationLeftInt}</div>
                  </div>
                </div>

                <div className="border-t pt-2 space-y-2">
                  <span className="font-bold text-[10px] uppercase text-gray-500 block">Doplnkové testy flexibility a ramenný kĺb</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div>Flexibility Skolióza: {data.flexScoliosisState} ({data.flexScoliosisValue})</div>
                    <div>Flexibility Lumbálna: {data.flexLumbarState} ({data.flexLumbarValue})</div>
                    <div>Flexibility Th: {data.flexThState} ({data.flexThValue})</div>
                    <div>Flexibility C: {data.flexCState} ({data.flexCValue})</div>
                    <div>Flexibility Rotácia Th P: {data.flexRotationThRightState} ({data.flexRotationThRightValue})</div>
                    <div>Flexibility Rotácia Th Ľ: {data.flexRotationThLeftState} ({data.flexRotationThLeftValue})</div>
                    <div>Flexibility Lopatka P: {data.flexScapulaRight?.join(', ') || 'Norma'}</div>
                    <div>Flexibility Lopatka Ľ: {data.flexScapulaLeft?.join(', ') || 'Norma'}</div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-gray-500">
                    <div>Rameno Flexia P/Ľ: {data.shoulderRangeFlexRight} / {data.shoulderRangeFlexLeft}</div>
                    <div>Rameno Extenzia P/Ľ: {data.shoulderRangeExtRight} / {data.shoulderRangeExtLeft}</div>
                    <div>Rameno Abdukcia P/Ľ: {data.shoulderRangeAbdRight} / {data.shoulderRangeAbdLeft}</div>
                    <div>Rameno Addukcia P/Ľ: {data.shoulderRangeAddRight} / {data.shoulderRangeAddLeft}</div>
                  </div>
                </div>

                {data.uploadedMuscleFlex && Object.keys(data.uploadedMuscleFlex).length > 0 && (
                  <div className="border-t pt-2 space-y-1">
                    <span className="font-bold text-[10px] uppercase text-gray-500 block">Svalová flexibilita (obrázky)</span>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(data.uploadedMuscleFlex).map(([muscle, file]: any) => (
                        <div key={muscle} className="bg-white border px-2 py-1 rounded text-[10px] font-semibold">
                          📷 {muscle}: {file}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Palpácia trigger pointy */}
                <div className="border-t pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <strong>Trigger pointy (Dolná časť):</strong>{' '}
                    {data.lowerBodyTriggerPoints?.join(', ') || 'Žiadne'}
                  </div>
                  <div>
                    <strong>Trigger pointy (Horná časť):</strong>{' '}
                    {data.upperBodyTriggerPoints?.join(', ') || 'Žiadne'}
                  </div>
                </div>
              </div>

              {/* FMS diagnostika */}
              <div className="border p-4 rounded-xl space-y-3 bg-brand-off-white/30">
                <h4 className="font-bold text-brand-navy text-xs border-b pb-1">FMS diagnostika a skórovanie</h4>
                {data.fmsGlobalFile && <div><strong>FMS súbor:</strong> {data.fmsGlobalFile}</div>}
                
                <div className="space-y-3">
                  {[
                    { label: 'DEEP SQUAT', score: data.fmsDeepSquatScore, val: data.fmsDeepSquatValue, obs: data.fmsDeepSquatObs, other: data.fmsDeepSquatObsOther },
                    { label: 'HURDLE STEP (Pravá)', score: data.fmsHurdleStepRightScore, val: data.fmsHurdleStepRightValue, obs: data.fmsHurdleStepRightObs, other: data.fmsHurdleStepRightObsOther },
                    { label: 'HURDLE STEP (Ľavá)', score: data.fmsHurdleStepLeftScore, val: data.fmsHurdleStepLeftValue, obs: data.fmsHurdleStepLeftObs, other: data.fmsHurdleStepLeftObsOther },
                    { label: 'IN-LINE LUNGE (Pravá)', score: data.fmsInlineLungeRightScore, val: data.fmsInlineLungeRightValue, obs: data.fmsInlineLungeRightObs, other: data.fmsInlineLungeRightObsOther },
                    { label: 'IN-LINE LUNGE (Ľavá)', score: data.fmsInlineLungeLeftScore, val: data.fmsInlineLungeLeftValue, obs: data.fmsInlineLungeLeftObs, other: data.fmsInlineLungeLeftObsOther },
                    { label: 'SHOULDER MOBILITY (Pravá)', score: data.fmsShoulderMobilityRightScore, val: data.fmsShoulderMobilityRightValue, obs: data.fmsShoulderMobilityRightObs, other: data.fmsShoulderMobilityRightObsOther },
                    { label: 'SHOULDER MOBILITY (Ľavá)', score: data.fmsShoulderMobilityLeftScore, val: data.fmsShoulderMobilityLeftValue, obs: data.fmsShoulderMobilityLeftObs, other: data.fmsShoulderMobilityLeftObsOther },
                    { label: 'TRUNK STABILITY PUSH-UP', score: data.fmsTrunkStabilityScore, val: '', obs: data.fmsTrunkStabilityObs, other: data.fmsTrunkStabilityObsOther },
                    { label: 'ROTARY STABILITY (Pravá)', score: data.fmsRotaryStabilityRightScore, val: data.fmsRotaryStabilityRightValue, obs: data.fmsRotaryStabilityRightObs, other: data.fmsRotaryStabilityRightObsOther },
                    { label: 'ROTARY STABILITY (Ľavá)', score: data.fmsRotaryStabilityLeftScore, val: data.fmsRotaryStabilityLeftValue, obs: data.fmsRotaryStabilityLeftObs, other: data.fmsRotaryStabilityLeftObsOther },
                  ].map((f, idx) => (
                    <div key={idx} className="p-2 border rounded bg-white text-[10px] grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div className="font-bold">{f.label}</div>
                      <div><strong>Skóre:</strong> {f.score}/3</div>
                      <div><strong>Pozorovania:</strong> {f.obs?.join(', ') || 'Žiadne'} {f.other && ` | Iné: ${f.other}`}</div>
                      {f.val && <div><strong>Hodnota:</strong> {f.val}</div>}
                    </div>
                  ))}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-2 border rounded bg-white text-[10px]">
                      <strong>ANKLE CLEARING:</strong> Pravá ({data.fmsAnkleClearingRightZone} - {data.fmsAnkleClearingRightValue}) | Ľavá ({data.fmsAnkleClearingLeftZone} - {data.fmsAnkleClearingLeftValue})
                    </div>
                    <div className="p-2 border rounded bg-white text-[10px]">
                      <strong>ACTIVE STRAIGHT-LEG RAISE:</strong> P ({data.fmsActiveLegRaiseRightScore}/3 - {data.fmsActiveLegRaiseRightVal1}/{data.fmsActiveLegRaiseRightVal2}) | Ľ ({data.fmsActiveLegRaiseLeftScore}/3 - {data.fmsActiveLegRaiseLeftVal1}/{data.fmsActiveLegRaiseLeftVal2})
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-2 border rounded bg-white text-[10px]">
                      <strong>EXTENSION CLEARING:</strong> Bolesť ({data.fmsExtensionClearingPain}) | Hodnota ({data.fmsExtensionClearingValue})
                    </div>
                    <div className="p-2 border rounded bg-white text-[10px]">
                      <strong>FLEXION CLEARING:</strong> Bolesť ({data.fmsFlexionClearingPain}) | Hodnota ({data.fmsFlexionClearingValue})
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 9: Záver */}
              <div className="border p-4 rounded-xl space-y-2 bg-brand-cyan/5 border-brand-cyan/30">
                <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Záver a odporúčania (svalové dysbalancie)</h4>
                <p className="text-gray-800 font-medium leading-relaxed whitespace-pre-wrap">{data.conclusionNotes}</p>
              </div>

            </div>
          ) : (
            /* Fallback detail view for normal form templates */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(data).map(([key, val]) => (
                <div key={key} className="border p-3 rounded-lg bg-brand-off-white/40">
                  <strong className="block text-gray-400 uppercase text-[9px] mb-1">{key}</strong>
                  <p className="text-gray-800 font-medium">{String(val)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
