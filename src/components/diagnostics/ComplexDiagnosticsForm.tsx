import React, { useState, useEffect } from 'react';

interface ClientListItem {
  id: string;
  full_name: string;
  role: string;
  email?: string;
  phone?: string;
  metadata?: any;
}

interface ComplexDiagnosticsFormProps {
  selectedClientId: string;
  creatorId: string;
  clients: ClientListItem[];
  onSubmit: (formData: Record<string, any>) => Promise<boolean>;
  onCancel: () => void;
}

export default function ComplexDiagnosticsForm({
  selectedClientId,
  creatorId,
  clients,
  onSubmit,
  onCancel,
}: ComplexDiagnosticsFormProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // --- Step 1: Verification & Identity ---
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
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
        setPhone(client.phone || '');
        if (client.metadata) {
          setBirthDate(client.metadata.birth_date || client.metadata.birthDate || '');
          setAddress(client.metadata.address || '');
        }
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
      setPhone(client.phone || '');
      if (client.metadata) {
        setBirthDate(client.metadata.birth_date || client.metadata.birthDate || '');
        setAddress(client.metadata.address || '');
      }
    } else {
      setErrorMsg('Klient s týmto e-mailom nebol nájdený. Vyplňte údaje ručne pre registráciu.');
      setVerifiedClient(null);
    }
  };

  // --- Step 2: Vstupná anamnéza ---
  const [referralSources, setReferralSources] = useState<string[]>([]);
  const [referralSourceOther, setReferralSourceOther] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [goalOther, setGoalOther] = useState('');
  const [nutritionistServices, setNutritionistServices] = useState('Nie nemám záujem');
  const [dailyTimeForGoals, setDailyTimeForGoals] = useState('');
  const [timesPerWeekPreferred, setTimesPerWeekPreferred] = useState('');
  const [whenToSeeResults, setWhenToSeeResults] = useState('');

  // --- Step 3: Zdravotná anamnéza ---
  const [healthIssues, setHealthIssues] = useState<string[]>([]);
  const [healthIssueOther, setHealthIssueOther] = useState('');
  const [longTermIssues, setLongTermIssues] = useState<string[]>([]);
  const [longTermIssueOther, setLongTermIssueOther] = useState('');
  const [surgicalInterventions, setSurgicalInterventions] = useState<string[]>([]);
  const [surgicalInterventionOther, setSurgicalInterventionOther] = useState('');
  const [recentInjury, setRecentInjury] = useState('Nie');
  const [injurySpecification, setInjurySpecification] = useState('');
  const [pregnantLast12Months, setPregnantLast12Months] = useState('Nie');
  const [regularMedication, setRegularMedication] = useState('Nie');
  const [medicationDetails, setMedicationDetails] = useState('');
  const [restrictedActivityByDoctor, setRestrictedActivityByDoctor] = useState('Nie');
  const [restrictedActivityDetails, setRestrictedActivityDetails] = useState('');

  // --- Step 4: Životný štýl ---
  const [sportsCurrently, setSportsCurrently] = useState('Nie');
  const [sportsCurrentlyDetails, setSportsCurrentlyDetails] = useState('');
  const [sportsPast, setSportsPast] = useState('Nie');
  const [sportsPastDetails, setSportsPastDetails] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [occupation, setOccupation] = useState('Sedavé');
  const [sleepHours, setSleepHours] = useState('');
  const [consumption, setConsumption] = useState({
    vegetables: 'Mierne',
    sweets: 'Mierne',
    meat: 'Mierne',
    fried: 'Mierne',
    alcohol: 'Mierne',
    pasta: 'Mierne',
  });
  const [mealsPerDay, setMealsPerDay] = useState('');
  const [waterPerDay, setWaterPerDay] = useState('');
  const [didDietPast, setDidDietPast] = useState('Nie');
  const [dietPastDetails, setDietPastDetails] = useState('');
  const [wantNutritionistServices, setWantNutritionistServices] = useState('Nie nemám záujem');

  // --- Steps 5, 6, 7: File upload & comments ---
  const [clientPhotosNotes, setClientPhotosNotes] = useState('');
  const [inbodyNotes, setInbodyNotes] = useState('');
  const [bodyvisionNotes, setBodyvisionNotes] = useState('');

  // Mock upload urls for simplicity & reliability (storing name tags)
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [uploadedInBody, setUploadedInBody] = useState<string[]>([]);
  const [uploadedBodyVision, setUploadedBodyVision] = useState<string[]>([]);

  const handleMockUpload = (type: 'photo' | 'inbody' | 'bodyvision', filename: string) => {
    if (type === 'photo') setUploadedPhotos((p) => [...p, filename]);
    if (type === 'inbody') setUploadedInBody((p) => [...p, filename]);
    if (type === 'bodyvision') setUploadedBodyVision((p) => [...p, filename]);
  };

  // --- Step 8: Funkčná diagnostika ---
  // Body reading
  const [malleolusFibula, setMalleolusFibula] = useState('NORMA');
  const [fibulaTrochanter, setFibulaTrochanter] = useState('NORMA');
  const [trochanterAcromion, setTrochanterAcromion] = useState('NORMA');
  const [spineThRotation, setSpineThRotation] = useState('NORMA');

  // Foot
  const [rightFootArch, setRightFootArch] = useState('norma');
  const [leftFootArch, setLeftFootArch] = useState('norma');
  const [halluxValgus, setHalluxValgus] = useState('Nie');

  // Ankle
  const [rightAnkleState, setRightAnkleState] = useState('Norma');
  const [leftAnkleState, setLeftAnkleState] = useState('Norma');

  // Knee
  const [rightKneeState, setRightKneeState] = useState('Norma');
  const [leftKneeState, setLeftKneeState] = useState('Norma');

  // Pelvis
  const [pelvicTiltAP, setPelvicTiltAP] = useState('Norma');
  const [pelvicTiltLateral, setPelvicTiltLateral] = useState('Norma');
  const [pelvicRotation, setPelvicRotation] = useState('Norma');

  // Spine Part 1
  const [lumbarSpine, setLumbarSpine] = useState('Norma');
  const [thoracicSpine, setThoracicSpine] = useState('Norma');
  const [cervicalSpine, setCervicalSpine] = useState('Norma');
  const [scoliosis, setScoliosis] = useState('Norma');
  const [trunkRotation, setTrunkRotation] = useState('Norma');

  // Scapula
  const [scapulaRight, setScapulaRight] = useState<string[]>([]);
  const [scapulaLeft, setScapulaLeft] = useState<string[]>([]);
  const [humeroScapularRhythm, setHumeroScapularRhythm] = useState('');

  // Shoulder
  const [shoulderRightState, setShoulderRightState] = useState('Norma');
  const [shoulderRightValue, setShoulderRightValue] = useState('');
  const [shoulderLeftState, setShoulderLeftState] = useState('Norma');
  const [shoulderLeftValue, setShoulderLeftValue] = useState('');

  // Trigger Points Palpation
  const [lowerBodyTriggerPoints, setLowerBodyTriggerPoints] = useState<string[]>([]);
  const [upperBodyTriggerPoints, setUpperBodyTriggerPoints] = useState<string[]>([]);

  // Diastasis
  const [diastasisState, setDiastasisState] = useState('Norma');
  const [diastasisValue, setDiastasisValue] = useState('');
  const [breathingPattern, setBreathingPattern] = useState<string[]>([]);

  // Mobility
  const [rightAnkleMobValue, setRightAnkleMobValue] = useState('');
  const [rightAnkleMobState, setRightAnkleMobState] = useState('Norma');
  const [leftAnkleMobValue, setLeftAnkleMobValue] = useState('');
  const [leftAnkleMobState, setLeftAnkleMobState] = useState('Norma');

  const [rightKneeFlex, setRightKneeFlex] = useState('');
  const [rightKneeExt, setRightKneeExt] = useState('');
  const [leftKneeFlex, setLeftKneeFlex] = useState('');
  const [leftKneeExt, setLeftKneeExt] = useState('');

  const [rightHipFlex, setRightHipFlex] = useState('');
  const [rightHipExt, setRightHipExt] = useState('');
  const [rightHipAbd, setRightHipAbd] = useState('');
  const [rightHipAdd, setRightHipAdd] = useState('');
  const [leftHipFlex, setLeftHipFlex] = useState('');
  const [leftHipExt, setLeftHipExt] = useState('');
  const [leftHipAbd, setLeftHipAbd] = useState('');
  const [leftHipAdd, setLeftHipAdd] = useState('');

  const [hipRotationRightExt, setHipRotationRightExt] = useState('NORMA');
  const [hipRotationRightInt, setHipRotationRightInt] = useState('NORMA');
  const [hipRotationLeftExt, setHipRotationLeftExt] = useState('NORMA');
  const [hipRotationLeftInt, setHipRotationLeftInt] = useState('NORMA');

  const [siJointState, setSiJointState] = useState('NORMA');

  // Spine & Shoulder flexibility
  const [flexScoliosisState, setFlexScoliosisState] = useState('Norma');
  const [flexScoliosisValue, setFlexScoliosisValue] = useState('');
  const [flexLumbarState, setFlexLumbarState] = useState('Norma');
  const [flexLumbarValue, setFlexLumbarValue] = useState('');
  const [flexThState, setFlexThState] = useState('Norma');
  const [flexThValue, setFlexThValue] = useState('');
  const [flexCState, setFlexCState] = useState('Norma');
  const [flexCValue, setFlexCValue] = useState('');
  const [flexRotationThRightState, setFlexRotationThRightState] = useState('Norma');
  const [flexRotationThRightValue, setFlexRotationThRightValue] = useState('');
  const [flexRotationThLeftState, setFlexRotationThLeftState] = useState('Norma');
  const [flexRotationThLeftValue, setFlexRotationThLeftValue] = useState('');

  const [flexScapulaRight, setFlexScapulaRight] = useState<string[]>([]);
  const [flexScapulaLeft, setFlexScapulaLeft] = useState<string[]>([]);

  const [shoulderRangeFlexRight, setShoulderRangeFlexRight] = useState('NORMA');
  const [shoulderRangeFlexLeft, setShoulderRangeFlexLeft] = useState('NORMA');
  const [shoulderRangeExtRight, setShoulderRangeExtRight] = useState('NORMA');
  const [shoulderRangeExtLeft, setShoulderRangeExtLeft] = useState('NORMA');
  const [shoulderRangeAbdRight, setShoulderRangeAbdRight] = useState('NORMA');
  const [shoulderRangeAbdLeft, setShoulderRangeAbdLeft] = useState('NORMA');
  const [shoulderRangeAddRight, setShoulderRangeAddRight] = useState('NORMA');
  const [shoulderRangeAddLeft, setShoulderRangeAddLeft] = useState('NORMA');

  // Muscle groups flexibility uploads (11 slots)
  const [uploadedMuscleFlex, setUploadedMuscleFlex] = useState<Record<string, string>>({});

  // FMS scoring
  const [fmsGlobalFile, setFmsGlobalFile] = useState('');
  const [fmsDeepSquatScore, setFmsDeepSquatScore] = useState('3');
  const [fmsDeepSquatValue, setFmsDeepSquatValue] = useState('');
  const [fmsDeepSquatObs, setFmsDeepSquatObs] = useState<string[]>([]);
  const [fmsDeepSquatObsOther, setFmsDeepSquatObsOther] = useState('');

  const [fmsHurdleStepRightScore, setFmsHurdleStepRightScore] = useState('3');
  const [fmsHurdleStepRightValue, setFmsHurdleStepRightValue] = useState('');
  const [fmsHurdleStepRightObs, setFmsHurdleStepRightObs] = useState<string[]>([]);
  const [fmsHurdleStepRightObsOther, setFmsHurdleStepRightObsOther] = useState('');

  const [fmsHurdleStepLeftScore, setFmsHurdleStepLeftScore] = useState('3');
  const [fmsHurdleStepLeftValue, setFmsHurdleStepLeftValue] = useState('');
  const [fmsHurdleStepLeftObs, setFmsHurdleStepLeftObs] = useState<string[]>([]);
  const [fmsHurdleStepLeftObsOther, setFmsHurdleStepLeftObsOther] = useState('');

  const [fmsInlineLungeRightScore, setFmsInlineLungeRightScore] = useState('3');
  const [fmsInlineLungeRightValue, setFmsInlineLungeRightValue] = useState('');
  const [fmsInlineLungeRightObs, setFmsInlineLungeRightObs] = useState<string[]>([]);
  const [fmsInlineLungeRightObsOther, setFmsInlineLungeRightObsOther] = useState('');

  const [fmsInlineLungeLeftScore, setFmsInlineLungeLeftScore] = useState('3');
  const [fmsInlineLungeLeftValue, setFmsInlineLungeLeftValue] = useState('');
  const [fmsInlineLungeLeftObs, setFmsInlineLungeLeftObs] = useState<string[]>([]);
  const [fmsInlineLungeLeftObsOther, setFmsInlineLungeLeftObsOther] = useState('');

  const [fmsAnkleClearingRightZone, setFmsAnkleClearingRightZone] = useState('green');
  const [fmsAnkleClearingRightValue, setFmsAnkleClearingRightValue] = useState('');
  const [fmsAnkleClearingLeftZone, setFmsAnkleClearingLeftZone] = useState('green');
  const [fmsAnkleClearingLeftValue, setFmsAnkleClearingLeftValue] = useState('');

  const [fmsShoulderMobilityRightScore, setFmsShoulderMobilityRightScore] = useState('3');
  const [fmsShoulderMobilityRightValue, setFmsShoulderMobilityRightValue] = useState('');
  const [fmsShoulderMobilityRightObs, setFmsShoulderMobilityRightObs] = useState<string[]>([]);
  const [fmsShoulderMobilityRightObsOther, setFmsShoulderMobilityRightObsOther] = useState('');

  const [fmsShoulderMobilityLeftScore, setFmsShoulderMobilityLeftScore] = useState('3');
  const [fmsShoulderMobilityLeftValue, setFmsShoulderMobilityLeftValue] = useState('');
  const [fmsShoulderMobilityLeftObs, setFmsShoulderMobilityLeftObs] = useState<string[]>([]);
  const [fmsShoulderMobilityLeftObsOther, setFmsShoulderMobilityLeftObsOther] = useState('');

  const [fmsActiveLegRaiseRightScore, setFmsActiveLegRaiseRightScore] = useState('3');
  const [fmsActiveLegRaiseRightVal1, setFmsActiveLegRaiseRightVal1] = useState('');
  const [fmsActiveLegRaiseRightVal2, setFmsActiveLegRaiseRightVal2] = useState('');

  const [fmsActiveLegRaiseLeftScore, setFmsActiveLegRaiseLeftScore] = useState('3');
  const [fmsActiveLegRaiseLeftVal1, setFmsActiveLegRaiseLeftVal1] = useState('');
  const [fmsActiveLegRaiseLeftVal2, setFmsActiveLegRaiseLeftVal2] = useState('');

  const [fmsTrunkStabilityScore, setFmsTrunkStabilityScore] = useState('3');
  const [fmsTrunkStabilityObs, setFmsTrunkStabilityObs] = useState<string[]>([]);
  const [fmsTrunkStabilityObsOther, setFmsTrunkStabilityObsOther] = useState('');

  const [fmsExtensionClearingPain, setFmsExtensionClearingPain] = useState('bez bolesti');
  const [fmsExtensionClearingValue, setFmsExtensionClearingValue] = useState('');

  const [fmsRotaryStabilityRightScore, setFmsRotaryStabilityRightScore] = useState('3');
  const [fmsRotaryStabilityRightValue, setFmsRotaryStabilityRightValue] = useState('');
  const [fmsRotaryStabilityRightObs, setFmsRotaryStabilityRightObs] = useState<string[]>([]);
  const [fmsRotaryStabilityRightObsOther, setFmsRotaryStabilityRightObsOther] = useState('');

  const [fmsRotaryStabilityLeftScore, setFmsRotaryStabilityLeftScore] = useState('3');
  const [fmsRotaryStabilityLeftValue, setFmsRotaryStabilityLeftValue] = useState('');
  const [fmsRotaryStabilityLeftObs, setFmsRotaryStabilityLeftObs] = useState<string[]>([]);
  const [fmsRotaryStabilityLeftObsOther, setFmsRotaryStabilityLeftObsOther] = useState('');

  const [fmsFlexionClearingPain, setFmsFlexionClearingPain] = useState('bez bolesti');
  const [fmsFlexionClearingValue, setFmsFlexionClearingValue] = useState('');

  // Strength tests
  const [strengthNotes, setStrengthNotes] = useState('');
  const [uploadedStrength, setUploadedStrength] = useState<string[]>([]);

  // --- Step 9: Záver ---
  const [conclusionNotes, setConclusionNotes] = useState('');

  // Form submission handler
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conclusionNotes.trim()) {
      setErrorMsg('Finálne závery sú povinné.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const finalPayload = {
      // Step 1
      clientEmail: email,
      clientFirstName: firstName,
      clientLastName: lastName,
      clientBirthDate: birthDate,
      clientAddress: address,
      clientPhone: phone,
      // Step 2
      referralSources,
      referralSourceOther,
      goals,
      goalOther,
      nutritionistServices,
      dailyTimeForGoals,
      timesPerWeekPreferred,
      whenToSeeResults,
      // Step 3
      healthIssues,
      healthIssueOther,
      longTermIssues,
      longTermIssueOther,
      surgicalInterventions,
      surgicalInterventionOther,
      recentInjury,
      injurySpecification,
      pregnantLast12Months,
      regularMedication,
      medicationDetails,
      restrictedActivityByDoctor,
      restrictedActivityDetails,
      // Step 4
      sportsCurrently,
      sportsCurrentlyDetails,
      sportsPast,
      sportsPastDetails,
      height,
      weight,
      occupation,
      sleepHours,
      consumption,
      mealsPerDay,
      waterPerDay,
      didDietPast,
      dietPastDetails,
      wantNutritionistServices,
      // Step 5, 6, 7
      clientPhotosNotes,
      uploadedPhotos,
      inbodyNotes,
      uploadedInBody,
      bodyvisionNotes,
      uploadedBodyVision,
      // Step 8: Funkčná diagnostika
      malleolusFibula,
      fibulaTrochanter,
      trochanterAcromion,
      spineThRotation,
      rightFootArch,
      leftFootArch,
      halluxValgus,
      rightAnkleState,
      leftAnkleState,
      rightKneeState,
      leftKneeState,
      pelvicTiltAP,
      pelvicTiltLateral,
      pelvicRotation,
      lumbarSpine,
      thoracicSpine,
      cervicalSpine,
      scoliosis,
      trunkRotation,
      scapulaRight,
      scapulaLeft,
      humeroScapularRhythm,
      shoulderRightState,
      shoulderRightValue,
      shoulderLeftState,
      shoulderLeftValue,
      lowerBodyTriggerPoints,
      upperBodyTriggerPoints,
      diastasisState,
      diastasisValue,
      breathingPattern,
      rightAnkleMobValue,
      rightAnkleMobState,
      leftAnkleMobValue,
      leftAnkleMobState,
      rightKneeFlex,
      rightKneeExt,
      leftKneeFlex,
      leftKneeExt,
      rightHipFlex,
      rightHipExt,
      rightHipAbd,
      rightHipAdd,
      leftHipFlex,
      leftHipExt,
      leftHipAbd,
      leftHipAdd,
      hipRotationRightExt,
      hipRotationRightInt,
      hipRotationLeftExt,
      hipRotationLeftInt,
      siJointState,
      flexScoliosisState,
      flexScoliosisValue,
      flexLumbarState,
      flexLumbarValue,
      flexThState,
      flexThValue,
      flexCState,
      flexCValue,
      flexRotationThRightState,
      flexRotationThRightValue,
      flexRotationThLeftState,
      flexRotationThLeftValue,
      flexScapulaRight,
      flexScapulaLeft,
      shoulderRangeFlexRight,
      shoulderRangeFlexLeft,
      shoulderRangeExtRight,
      shoulderRangeExtLeft,
      shoulderRangeAbdRight,
      shoulderRangeAbdLeft,
      shoulderRangeAddRight,
      shoulderRangeAddLeft,
      uploadedMuscleFlex,
      // FMS
      fmsGlobalFile,
      fmsDeepSquatScore,
      fmsDeepSquatValue,
      fmsDeepSquatObs,
      fmsDeepSquatObsOther,
      fmsHurdleStepRightScore,
      fmsHurdleStepRightValue,
      fmsHurdleStepRightObs,
      fmsHurdleStepRightObsOther,
      fmsHurdleStepLeftScore,
      fmsHurdleStepLeftValue,
      fmsHurdleStepLeftObs,
      fmsHurdleStepLeftObsOther,
      fmsInlineLungeRightScore,
      fmsInlineLungeRightValue,
      fmsInlineLungeRightObs,
      fmsInlineLungeRightObsOther,
      fmsInlineLungeLeftScore,
      fmsInlineLungeLeftValue,
      fmsInlineLungeLeftObs,
      fmsInlineLungeLeftObsOther,
      fmsAnkleClearingRightZone,
      fmsAnkleClearingRightValue,
      fmsAnkleClearingLeftZone,
      fmsAnkleClearingLeftValue,
      fmsShoulderMobilityRightScore,
      fmsShoulderMobilityRightValue,
      fmsShoulderMobilityRightObs,
      fmsShoulderMobilityRightObsOther,
      fmsShoulderMobilityLeftScore,
      fmsShoulderMobilityLeftValue,
      fmsShoulderMobilityLeftObs,
      fmsShoulderMobilityLeftObsOther,
      fmsActiveLegRaiseRightScore,
      fmsActiveLegRaiseRightVal1,
      fmsActiveLegRaiseRightVal2,
      fmsActiveLegRaiseLeftScore,
      fmsActiveLegRaiseLeftVal1,
      fmsActiveLegRaiseLeftVal2,
      fmsTrunkStabilityScore,
      fmsTrunkStabilityObs,
      fmsTrunkStabilityObsOther,
      fmsExtensionClearingPain,
      fmsExtensionClearingValue,
      fmsRotaryStabilityRightScore,
      fmsRotaryStabilityRightValue,
      fmsRotaryStabilityRightObs,
      fmsRotaryStabilityRightObsOther,
      fmsRotaryStabilityLeftScore,
      fmsRotaryStabilityLeftValue,
      fmsRotaryStabilityLeftObs,
      fmsRotaryStabilityLeftObsOther,
      fmsFlexionClearingPain,
      fmsFlexionClearingValue,
      uploadedStrength,
      strengthNotes,
      // Step 9
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

  const handleNextStep = () => {
    // Basic required validation per step
    if (step === 1) {
      if (!firstName || !lastName || !birthDate || !address || !email || !phone) {
        setErrorMsg('Vyplňte prosím všetky povinné identifikačné údaje v kroku 1.');
        return;
      }
    }
    if (step === 2) {
      if (!dailyTimeForGoals || !timesPerWeekPreferred || !whenToSeeResults) {
        setErrorMsg('Krok 2: Vyplňte všetky 3 povinné textové polia pre vstupnú anamnézu.');
        return;
      }
    }
    setErrorMsg('');
    setStep((s) => s + 1);
  };

  const toggleCheckbox = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-6 text-xs text-brand-navy">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy">Komplexná diagnostika</h2>
          <p className="text-xs text-gray-400 mt-1">Celková pohybová, zdravotná a funkčná analýza klienta (9 krokov).</p>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-colors"
        >
          Zrušiť
        </button>
      </div>

      {/* Steps indicator */}
      <div className="flex flex-wrap gap-2 justify-between items-center bg-brand-off-white p-3 rounded-xl border border-gray-100">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((s) => (
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

      {/* STEP 1: CONSENTS & IDENTITY */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold border-b pb-1">Krok 1: Súhlas so spracovaním údajov a overenie</h3>
          
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
              <label htmlFor="step1-phone" className="block font-bold">Telefón <span className="text-red-500">*</span></label>
              <input
                id="step1-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                placeholder="+421900123456"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label htmlFor="step1-firstname" className="block font-bold">Meno <span className="text-red-500">*</span></label>
              <input
                id="step1-firstname"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="step1-lastname" className="block font-bold">Priezvisko <span className="text-red-500">*</span></label>
              <input
                id="step1-lastname"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="step1-birthdate" className="block font-bold">Dátum narodenia <span className="text-red-500">*</span></label>
              <input
                id="step1-birthdate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="step1-address" className="block font-bold">Trvalý pobyt <span className="text-red-500">*</span></label>
              <input
                id="step1-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                placeholder="Ulica, Mesto"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: VSTUPNÁ ANAMNÉZA */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold border-b pb-1">Krok 2: Vstupná anamnéza</h3>

          <div className="space-y-2">
            <label className="block font-bold">1. Ako ste sa o nás dozvedeli?</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {['Cez Facebook', 'Cez Instagram', 'Cez webovú stránku', 'Odporúčanie', 'Osobné referencie', 'Iné'].map((src) => (
                <label key={src} className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={referralSources.includes(src)}
                    onChange={() => toggleCheckbox(referralSources, setReferralSources, src)}
                    className="w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                  />
                  <span>{src}</span>
                </label>
              ))}
            </div>
            {referralSources.includes('Iné') && (
              <input
                type="text"
                value={referralSourceOther}
                onChange={(e) => setReferralSourceOther(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none mt-2 focus:border-brand-navy"
                placeholder="Uveďte zdroj..."
              />
            )}
          </div>

          <div className="space-y-2 pt-2">
            <label className="block font-bold">2. Charakterizujte vaše ciele:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                'Schudnúť',
                'Vyrysovať',
                'Nabrať svalovú hmotu',
                'Zlepšiť kondíciu',
                'Kompenzovať pracovné zaťaženie',
                'Športová špecializácia',
                'Zlepšenie držania tela',
                'Riešiť pooperačné stavy',
                'Iné',
              ].map((g) => (
                <label key={g} className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={goals.includes(g)}
                    onChange={() => toggleCheckbox(goals, setGoals, g)}
                    className="w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                  />
                  <span>{g}</span>
                </label>
              ))}
            </div>
            {goals.includes('Iné') && (
              <input
                type="text"
                value={goalOther}
                onChange={(e) => setGoalOther(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none mt-2 focus:border-brand-navy"
                placeholder="Uveďte ciele..."
              />
            )}
          </div>

          <div className="space-y-2 pt-2">
            <label className="block font-bold">3. Využívate zároveň aj služby výživového poradcu?</label>
            <div className="flex gap-4">
              {['Áno chcem', 'Nie nemám záujem'].map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="radio"
                    name="nutritionist"
                    value={opt}
                    checked={nutritionistServices === opt}
                    onChange={(e) => setNutritionistServices(e.target.value)}
                    className="w-4 h-4 text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1">
              <label htmlFor="step2-dailytime" className="block font-bold">4. Čas denne venovaný cieľom? <span className="text-red-500">*</span></label>
              <input
                id="step2-dailytime"
                type="text"
                value={dailyTimeForGoals}
                onChange={(e) => setDailyTimeForGoals(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                placeholder="napr. 1 hodina"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="step2-timesperweek" className="block font-bold">5. Počet cvičení týždenne / čas? <span className="text-red-500">*</span></label>
              <input
                id="step2-timesperweek"
                type="text"
                value={timesPerWeekPreferred}
                onChange={(e) => setTimesPerWeekPreferred(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                placeholder="napr. 3x, poobede"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="step2-whentosee" className="block font-bold">6. Kedy si prajete výsledky? <span className="text-red-500">*</span></label>
              <input
                id="step2-whentosee"
                type="text"
                value={whenToSeeResults}
                onChange={(e) => setWhenToSeeResults(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                placeholder="napr. do 3 mesiacov"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: ZDRAVOTNÁ ANAMNÉZA */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold border-b pb-1">Krok 3: Zdravotná anamnéza</h3>

          <div className="space-y-2">
            <label className="block font-bold">1. Trpíte niektorými z nasledujúcich problémov?</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                'Srdcovou arytmiou',
                'Vysokým/nízkym krvným tlakom',
                'Alergiou',
                'Zvýšenou hladinou cholesterolu',
                'Dysfunkciou štítnej žľazy',
                'Astmou',
                'Opuchmi',
                'Migrénou',
                'Opakovanými stratami vedomia',
                'Reumou',
                'Bolesťami kĺbov',
                'Nespavosťou',
                'Epilepsiou',
                'Cukrovkou',
                'Závratmi',
                'Skoliózou',
                'Diastázou',
                'Pruhom',
                'Iné',
              ].map((issue) => (
                <label key={issue} className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={healthIssues.includes(issue)}
                    onChange={() => toggleCheckbox(healthIssues, setHealthIssues, issue)}
                    className="w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                  />
                  <span>{issue}</span>
                </label>
              ))}
            </div>
            {healthIssues.includes('Iné') && (
              <input
                type="text"
                value={healthIssueOther}
                onChange={(e) => setHealthIssueOther(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none mt-2 focus:border-brand-navy"
                placeholder="Špecifikujte iné problémy..."
              />
            )}
          </div>

          <div className="space-y-2 pt-2">
            <label className="block font-bold">2. Dlhodobé problémy:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['Chrbtice', 'Chodidiel', 'Bedier', 'Svalov', 'Kolien', 'Členkov', 'Ramien', 'Iné'].map((lt) => (
                <label key={lt} className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={longTermIssues.includes(lt)}
                    onChange={() => toggleCheckbox(longTermIssues, setLongTermIssues, lt)}
                    className="w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                  />
                  <span>{lt}</span>
                </label>
              ))}
            </div>
            {longTermIssues.includes('Iné') && (
              <input
                type="text"
                value={longTermIssueOther}
                onChange={(e) => setLongTermIssueOther(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none mt-2 focus:border-brand-navy"
                placeholder="Špecifikujte..."
              />
            )}
          </div>

          <div className="space-y-2 pt-2">
            <label className="block font-bold">3. Operačný zákrok:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['Členka', 'Kolena', 'Bedra', 'Chrbtice', 'Ramien', 'Iné'].map((op) => (
                <label key={op} className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={surgicalInterventions.includes(op)}
                    onChange={() => toggleCheckbox(surgicalInterventions, setSurgicalInterventions, op)}
                    className="w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                  />
                  <span>{op}</span>
                </label>
              ))}
            </div>
            {surgicalInterventions.includes('Iné') && (
              <input
                type="text"
                value={surgicalInterventionOther}
                onChange={(e) => setSurgicalInterventionOther(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none mt-2 focus:border-brand-navy"
                placeholder="Špecifikujte..."
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2 border p-3 rounded-xl">
              <label className="block font-bold">4. Zlomenina, výron, vytknutie alebo iný úraz?</label>
              <div className="flex gap-4">
                {['Áno', 'Nie'].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="radio"
                      name="injury"
                      value={opt}
                      checked={recentInjury === opt}
                      onChange={(e) => setRecentInjury(e.target.value)}
                      className="w-4 h-4 text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              {recentInjury === 'Áno' && (
                <input
                  type="text"
                  value={injurySpecification}
                  onChange={(e) => setInjurySpecification(e.target.value)}
                  className="w-full bg-brand-off-white border p-2 rounded-lg outline-none mt-2 focus:border-brand-navy"
                  placeholder="Špecifikácia zranenia..."
                />
              )}
            </div>

            <div className="space-y-2 border p-3 rounded-xl">
              <label className="block font-bold">5. Tehotná za posledných 12 mesiacov?</label>
              <div className="flex gap-4">
                {['Áno', 'Nie'].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="radio"
                      name="pregnancy"
                      value={opt}
                      checked={pregnantLast12Months === opt}
                      onChange={(e) => setPregnantLast12Months(e.target.value)}
                      className="w-4 h-4 text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 border p-3 rounded-xl">
              <label className="block font-bold">6. Pravidelne lieky?</label>
              <div className="flex gap-4">
                {['Áno', 'Nie'].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="radio"
                      name="meds"
                      value={opt}
                      checked={regularMedication === opt}
                      onChange={(e) => setRegularMedication(e.target.value)}
                      className="w-4 h-4 text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              {regularMedication === 'Áno' && (
                <input
                  type="text"
                  value={medicationDetails}
                  onChange={(e) => setMedicationDetails(e.target.value)}
                  className="w-full bg-brand-off-white border p-2 rounded-lg outline-none mt-2 focus:border-brand-navy"
                  placeholder="Aké lieky..."
                />
              )}
            </div>

            <div className="space-y-2 border p-3 rounded-xl">
              <label className="block font-bold">7. Obmedzená/zakázaná pohybová aktivita lekárom?</label>
              <div className="flex gap-4">
                {['Áno', 'Nie'].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="radio"
                      name="restriction"
                      value={opt}
                      checked={restrictedActivityByDoctor === opt}
                      onChange={(e) => setRestrictedActivityByDoctor(e.target.value)}
                      className="w-4 h-4 text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              {restrictedActivityByDoctor === 'Áno' && (
                <input
                  type="text"
                  value={restrictedActivityDetails}
                  onChange={(e) => setRestrictedActivityDetails(e.target.value)}
                  className="w-full bg-brand-off-white border p-2 rounded-lg outline-none mt-2 focus:border-brand-navy"
                  placeholder="Aká aktivita a dôvody..."
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: ŽIVOTNÝ ŠTÝL A DOPLŇUJÚCE INFORMÁCIE */}
      {step === 4 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold border-b pb-1">Krok 4: Životný štýl a doplňujúce informácie</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 border p-3 rounded-xl">
              <label className="block font-bold">1. Športujete?</label>
              <div className="flex gap-4">
                {['Áno', 'Nie'].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="radio"
                      name="sportsNow"
                      value={opt}
                      checked={sportsCurrently === opt}
                      onChange={(e) => setSportsCurrently(e.target.value)}
                      className="w-4 h-4 text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              {sportsCurrently === 'Áno' && (
                <input
                  type="text"
                  value={sportsCurrentlyDetails}
                  onChange={(e) => setSportsCurrentlyDetails(e.target.value)}
                  className="w-full bg-brand-off-white border p-2 rounded-lg outline-none mt-2 focus:border-brand-navy"
                  placeholder="Akému športu..."
                />
              )}
            </div>

            <div className="space-y-2 border p-3 rounded-xl">
              <label className="block font-bold">2. Športovali ste v minulosti?</label>
              <div className="flex gap-4">
                {['Áno', 'Nie'].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="radio"
                      name="sportsPast"
                      value={opt}
                      checked={sportsPast === opt}
                      onChange={(e) => setSportsPast(e.target.value)}
                      className="w-4 h-4 text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              {sportsPast === 'Áno' && (
                <input
                  type="text"
                  value={sportsPastDetails}
                  onChange={(e) => setSportsPastDetails(e.target.value)}
                  className="w-full bg-brand-off-white border p-2 rounded-lg outline-none mt-2 focus:border-brand-navy"
                  placeholder="O aký šport išlo..."
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label htmlFor="step4-height" className="block font-bold">3. Výška (cm)</label>
              <input
                id="step4-height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="step4-weight" className="block font-bold">4. Hmotnosť (kg)</label>
              <input
                id="step4-weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="step4-job" className="block font-bold">5. Zamestnanie</label>
              <select
                id="step4-job"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
              >
                {['Sedavé', 'Fyzicky náročné', 'Manuálne', 'Psychicky náročné'].map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="step4-sleep" className="block font-bold">6. Spánok (hod/deň)</label>
              <input
                id="step4-sleep"
                type="number"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
              />
            </div>
          </div>

          <div className="border p-4 rounded-xl space-y-3">
            <label className="block font-bold text-sm">7. Týždenná konzumácia</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {['vegetables', 'sweets', 'meat', 'fried', 'alcohol', 'pasta'].map((food) => {
                const SlovakNames: Record<string, string> = {
                  vegetables: 'Zelenina',
                  sweets: 'Sladkosti',
                  meat: 'Mäso',
                  fried: 'Vyprážané',
                  alcohol: 'Alkohol',
                  pasta: 'Cestoviny',
                };
                return (
                  <div key={food} className="space-y-1">
                    <label htmlFor={`cons-${food}`} className="block font-bold capitalize">{SlovakNames[food] || food}</label>
                    <select
                      id={`cons-${food}`}
                      value={(consumption as any)[food] || 'Mierne'}
                      onChange={(e) => setConsumption({ ...consumption, [food]: e.target.value })}
                      className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                    >
                      {['Vôbec', 'Mierne', 'Často', 'Každý deň'].map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label htmlFor="step4-meals" className="block font-bold">8. Ako často denne jete?</label>
              <input
                id="step4-meals"
                type="number"
                value={mealsPerDay}
                onChange={(e) => setMealsPerDay(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="step4-water" className="block font-bold">9. Koľko litrov denne pijete?</label>
              <input
                id="step4-water"
                type="number"
                value={waterPerDay}
                onChange={(e) => setWaterPerDay(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
              />
            </div>
            <div className="space-y-1">
              <label className="block font-bold">10. Držali ste niekedy diétu?</label>
              <div className="flex gap-4 mt-2">
                {['Áno', 'Nie'].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="radio"
                      name="diet"
                      value={opt}
                      checked={didDietPast === opt}
                      onChange={(e) => setDidDietPast(e.target.value)}
                      className="w-4 h-4 text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block font-bold">11. Služby výživového poradcu?</label>
              <div className="flex gap-4 mt-2">
                {['Áno chcem', 'Nie nemám záujem'].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="radio"
                      name="wantNutri"
                      value={opt}
                      checked={wantNutritionistServices === opt}
                      onChange={(e) => setWantNutritionistServices(e.target.value)}
                      className="w-4 h-4 text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          {didDietPast === 'Áno' && (
            <div className="space-y-1">
              <label htmlFor="step4-dietdetails" className="block font-bold">O akú diétu išlo</label>
              <input
                id="step4-dietdetails"
                type="text"
                value={dietPastDetails}
                onChange={(e) => setDietPastDetails(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
              />
            </div>
          )}
        </div>
      )}

      {/* STEP 5: FOTO KLIENTA */}
      {step === 5 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold border-b pb-1">Krok 5: Foto klienta</h3>
          
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center bg-brand-off-white hover:bg-brand-light-cyan/30 hover:border-brand-cyan/40 transition-colors">
            <span className="font-bold text-gray-400 block mb-2">Pretiahnite fotky sem alebo kliknite na nahranie</span>
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              id="photo-upload-input"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleMockUpload('photo', e.target.files[0].name);
                }
              }}
            />
            <label
              htmlFor="photo-upload-input"
              className="inline-block py-2 px-5 bg-brand-navy text-white font-bold rounded-xl cursor-pointer hover:bg-brand-navy/90 transition-colors"
            >
              Vybrať súbor
            </label>
          </div>

          {uploadedPhotos.length > 0 && (
            <div className="p-3 bg-brand-light-cyan/40 border border-brand-cyan/20 rounded-xl space-y-1">
              <strong className="block text-[10px] uppercase text-gray-500">Nahrané súbory:</strong>
              {uploadedPhotos.map((fn, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white border p-2 rounded-lg font-semibold">
                  <span>📷 {fn}</span>
                  <button type="button" onClick={() => setUploadedPhotos(uploadedPhotos.filter((_, i) => i !== idx))} className="text-red-500 font-bold hover:underline">Zmazať</button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="step5-notes" className="block font-bold">Doplňujúce informácie</label>
            <textarea
              id="step5-notes"
              value={clientPhotosNotes}
              onChange={(e) => setClientPhotosNotes(e.target.value)}
              className="w-full bg-brand-off-white border p-2 rounded-lg outline-none h-24 focus:border-brand-navy"
              placeholder="Poznámky k vizuálnemu stavu..."
            />
          </div>
        </div>
      )}

      {/* STEP 6: INBODY DIAGNOSTIKA */}
      {step === 6 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold border-b pb-1">Krok 6: InBody diagnostika</h3>

          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center bg-brand-off-white hover:bg-brand-light-cyan/30 hover:border-brand-cyan/40 transition-colors">
            <span className="font-bold text-gray-400 block mb-2">Pretiahnite InBody výsledky sem alebo kliknite na nahranie</span>
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              id="inbody-upload-input"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleMockUpload('inbody', e.target.files[0].name);
                }
              }}
            />
            <label
              htmlFor="inbody-upload-input"
              className="inline-block py-2 px-5 bg-brand-navy text-white font-bold rounded-xl cursor-pointer hover:bg-brand-navy/90 transition-colors"
            >
              Vybrať súbor
            </label>
          </div>

          {uploadedInBody.length > 0 && (
            <div className="p-3 bg-brand-light-cyan/40 border border-brand-cyan/20 rounded-xl space-y-1">
              <strong className="block text-[10px] uppercase text-gray-500">Nahrané súbory:</strong>
              {uploadedInBody.map((fn, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white border p-2 rounded-lg font-semibold">
                  <span>📊 {fn}</span>
                  <button type="button" onClick={() => setUploadedInBody(uploadedInBody.filter((_, i) => i !== idx))} className="text-red-500 font-bold hover:underline">Zmazať</button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="step6-notes" className="block font-bold">Doplňujúce informácie</label>
            <textarea
              id="step6-notes"
              value={inbodyNotes}
              onChange={(e) => setInbodyNotes(e.target.value)}
              className="w-full bg-brand-off-white border p-2 rounded-lg outline-none h-24 focus:border-brand-navy"
              placeholder="Poznámky k výsledkom InBody..."
            />
          </div>
        </div>
      )}

      {/* STEP 7: BODY VISION */}
      {step === 7 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold border-b pb-1">Krok 7: Body vision</h3>

          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center bg-brand-off-white hover:bg-brand-light-cyan/30 hover:border-brand-cyan/40 transition-colors">
            <span className="font-bold text-gray-400 block mb-2">Pretiahnite Body vision výsledky sem alebo kliknite na nahranie</span>
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              id="bodyvision-upload-input"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleMockUpload('bodyvision', e.target.files[0].name);
                }
              }}
            />
            <label
              htmlFor="bodyvision-upload-input"
              className="inline-block py-2 px-5 bg-brand-navy text-white font-bold rounded-xl cursor-pointer hover:bg-brand-navy/90 transition-colors"
            >
              Vybrať súbor
            </label>
          </div>

          {uploadedBodyVision.length > 0 && (
            <div className="p-3 bg-brand-light-cyan/40 border border-brand-cyan/20 rounded-xl space-y-1">
              <strong className="block text-[10px] uppercase text-gray-500">Nahrané súbory:</strong>
              {uploadedBodyVision.map((fn, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white border p-2 rounded-lg font-semibold">
                  <span>🕶️ {fn}</span>
                  <button type="button" onClick={() => setUploadedBodyVision(uploadedBodyVision.filter((_, i) => i !== idx))} className="text-red-500 font-bold hover:underline">Zmazať</button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="step7-notes" className="block font-bold">Doplňujúce informácie</label>
            <textarea
              id="step7-notes"
              value={bodyvisionNotes}
              onChange={(e) => setBodyvisionNotes(e.target.value)}
              className="w-full bg-brand-off-white border p-2 rounded-lg outline-none h-24 focus:border-brand-navy"
              placeholder="Poznámky k držaniu tela / Body vision..."
            />
          </div>
        </div>
      )}

      {/* STEP 8: FUNKČNÁ DIAGNOSTIKA POHYBOVÉHO APARÁTU */}
      {step === 8 && (
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          <h3 className="text-sm font-bold border-b pb-1">Krok 8: Funkčná diagnostika pohybového aparátu</h3>

          {/* 8.1 Body reading */}
          <div className="border p-4 rounded-xl space-y-3">
            <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Body reading</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Malleolus → Hl. fibuly', val: malleolusFibula, set: setMalleolusFibula },
                { label: 'Hl. fibuly → Trochanter', val: fibulaTrochanter, set: setFibulaTrochanter },
                { label: 'Trochanter → Acromion', val: trochanterAcromion, set: setTrochanterAcromion },
              ].map((field, i) => (
                <div key={i} className="space-y-1">
                  <label htmlFor={`body-read-${i}`} className="block font-bold">{field.label}</label>
                  <select
                    id={`body-read-${i}`}
                    value={field.val}
                    onChange={(e) => field.set(e.target.value)}
                    className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                  >
                    {['NORMA', 'Anterior tilt', 'Posterior tilt'].map((x) => (
                      <option key={x} value={x}>{x}</option>
                    ))}
                  </select>
                </div>
              ))}

              <div className="space-y-1">
                <label htmlFor="rot-th-spine" className="block font-bold">Rotácia Th chrbtice</label>
                <select
                  id="rot-th-spine"
                  value={spineThRotation}
                  onChange={(e) => setSpineThRotation(e.target.value)}
                  className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                >
                  {['NORMA', 'obmedzená rotácia vpravo', 'obmedzená rotácia vľavo'].map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 8.2 Chodidlo a klenba */}
          <div className="border p-4 rounded-xl space-y-3">
            <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Chodidlo – klenba nohy</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: '1. Pravá noha - Klenba', val: rightFootArch, set: setRightFootArch },
                { label: '2. Ľavá noha - Klenba', val: leftFootArch, set: setLeftFootArch },
              ].map((field, i) => (
                <div key={i} className="space-y-1">
                  <label htmlFor={`foot-arch-${i}`} className="block font-bold">{field.label}</label>
                  <select
                    id={`foot-arch-${i}`}
                    value={field.val}
                    onChange={(e) => field.set(e.target.value)}
                    className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                  >
                    {['norma', 'plochá', 'ťažko plochá', 'zvýšená', 'vysoká'].map((x) => (
                      <option key={x} value={x}>{x}</option>
                    ))}
                  </select>
                </div>
              ))}

              <div className="space-y-1">
                <label className="block font-bold">Hallux valgus</label>
                <div className="flex gap-4 mt-2">
                  {['Áno', 'Nie'].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer font-semibold">
                      <input
                        type="radio"
                        name="hallux"
                        value={opt}
                        checked={halluxValgus === opt}
                        onChange={(e) => setHalluxValgus(e.target.value)}
                        className="w-4 h-4 text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 8.3 Členkový a kolenný kĺb */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border p-4 rounded-xl space-y-3">
              <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Členkový kĺb</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '1. Pravá noha', val: rightAnkleState, set: setRightAnkleState, opts: ['Norma', 'Supinácia', 'Pronácia'] },
                  { label: '2. Ľavá noha', val: leftAnkleState, set: setLeftAnkleState, opts: ['Norma', 'Supinácia', 'Pronácia'] },
                ].map((field, i) => (
                  <div key={i} className="space-y-1">
                    <label htmlFor={`ankle-${i}`} className="block font-bold">{field.label}</label>
                    <select
                      id={`ankle-${i}`}
                      value={field.val}
                      onChange={(e) => field.set(e.target.value)}
                      className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                    >
                      {field.opts.map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="border p-4 rounded-xl space-y-3">
              <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Kolenný kĺb</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '1. Pravá noha', val: rightKneeState, set: setRightKneeState, opts: ['Norma', 'Valgus', 'Varus'] },
                  { label: '2. Ľavá noha', val: leftKneeState, set: setLeftKneeState, opts: ['Norma', 'Valgus', 'Varus'] },
                ].map((field, i) => (
                  <div key={i} className="space-y-1">
                    <label htmlFor={`knee-${i}`} className="block font-bold">{field.label}</label>
                    <select
                      id={`knee-${i}`}
                      value={field.val}
                      onChange={(e) => field.set(e.target.value)}
                      className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                    >
                      {field.opts.map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 8.4 Postavenie panvy */}
          <div className="border p-4 rounded-xl space-y-3">
            <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Postavenie panvy</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Predo-zadné vyosenie', val: pelvicTiltAP, set: setPelvicTiltAP, opts: ['Norma', 'Anterior tilt', 'Posterior tilt'] },
                { label: 'Vyosenie panvy bokom', val: pelvicTiltLateral, set: setPelvicTiltLateral, opts: ['Norma', 'Shift vpravo', 'Shift vľavo'] },
                { label: 'Rotácia panvy', val: pelvicRotation, set: setPelvicRotation, opts: ['Norma', 'Rotácia vpravo', 'Rotácia vľavo'] },
              ].map((field, i) => (
                <div key={i} className="space-y-1">
                  <label htmlFor={`pelvis-${i}`} className="block font-bold">{field.label}</label>
                  <select
                    id={`pelvis-${i}`}
                    value={field.val}
                    onChange={(e) => field.set(e.target.value)}
                    className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                  >
                    {field.opts.map((x) => (
                      <option key={x} value={x}>{x}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* 8.5 Chrbtica (Časť 1) */}
          <div className="border p-4 rounded-xl space-y-3">
            <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Chrbtica (Časť 1)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Lumbálna (drieková)', val: lumbarSpine, set: setLumbarSpine, opts: ['Norma', 'Hyperlordóza mierna', 'Hyperlordóza výrazná', 'Kyfotizácia', 'Napriamená lordóza'] },
                { label: 'Hrudníková (Th)', val: thoracicSpine, set: setThoracicSpine, opts: ['Norma', 'Hyperkyfóza', 'Zvýšená kyfotická krivka'] },
                { label: 'Krčná (C)', val: cervicalSpine, set: setCervicalSpine, opts: ['Norma', 'Hyperlordóza', 'Napriamená lordóza'] },
                { label: 'Skolióza', val: scoliosis, set: setScoliosis, opts: ['Norma', 'Vpravo mierne', 'Vpravo výrazne', 'Vľavo výrazne', 'Vľavo mierne'] },
                { label: 'Rotácia trupu', val: trunkRotation, set: setTrunkRotation, opts: ['Norma', 'Vpravo', 'Vľavo'] },
              ].map((field, i) => (
                <div key={i} className="space-y-1">
                  <label htmlFor={`spine-c1-${i}`} className="block font-bold">{field.label}</label>
                  <select
                    id={`spine-c1-${i}`}
                    value={field.val}
                    onChange={(e) => field.set(e.target.value)}
                    className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                  >
                    {field.opts.map((x) => (
                      <option key={x} value={x}>{x}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* 8.6 Lopatka */}
          <div className="border p-4 rounded-xl space-y-3">
            <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Lopatka</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: '1. Pravá lopatka', list: scapulaRight, set: setScapulaRight },
                { label: '2. Ľavá lopatka', list: scapulaLeft, set: setScapulaLeft },
              ].map((field, i) => (
                <div key={i} className="space-y-2">
                  <label className="block font-bold">{field.label}</label>
                  <div className="grid grid-cols-2 gap-1.5 bg-brand-off-white p-2.5 rounded-lg border">
                    {['Protrakcia', 'Retrakcia', 'Depresia', 'Elevácia', 'Vonkajšia rotácia', 'Vnútorná rotácia'].map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer font-semibold">
                        <input
                          type="checkbox"
                          checked={field.list.includes(opt)}
                          onChange={() => toggleCheckbox(field.list, field.set, opt)}
                          className="w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-1 pt-2">
              <label htmlFor="humero-scapular" className="block font-bold">Humero-skapulárny rytmus</label>
              <input
                id="humero-scapular"
                type="text"
                value={humeroScapularRhythm}
                onChange={(e) => setHumeroScapularRhythm(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                placeholder="Poznámky k humero-skapulárnemu rytmu..."
              />
            </div>
          </div>

          {/* 8.7 Ramenný kĺb */}
          <div className="border p-4 rounded-xl space-y-3">
            <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Ramenný kĺb</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: '1. Pravé rameno', state: shoulderRightState, setState: setShoulderRightState, val: shoulderRightValue, setVal: setShoulderRightValue },
                { label: '2. Ľavé rameno', state: shoulderLeftState, setState: setShoulderLeftState, val: shoulderLeftValue, setVal: setShoulderLeftValue },
              ].map((field, i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label htmlFor={`shoulder-state-${i}`} className="block font-bold">{field.label}</label>
                    <select
                      id={`shoulder-state-${i}`}
                      value={field.state}
                      onChange={(e) => field.setState(e.target.value)}
                      className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                    >
                      {['Norma', 'Protrakcia'].map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor={`shoulder-val-${i}`} className="block font-bold">Hodnota (rozsah / cm)</label>
                    <input
                      id={`shoulder-val-${i}`}
                      type="text"
                      value={field.val}
                      onChange={(e) => field.setVal(e.target.value)}
                      className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                      placeholder="napr. 2 cm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 8.8 PALPÁCIA – trigger pointy */}
          <div className="border p-4 rounded-xl space-y-3">
            <h4 className="font-bold text-brand-navy text-xs border-b pb-1">PALPÁCIA – "trigger pointy"</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block font-bold">Dolná časť tela</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-brand-off-white p-2.5 rounded-lg border max-h-48 overflow-y-auto">
                  {[
                    'm. Soleus',
                    'm. Gastrocnemius',
                    'm. Tibialis anterior',
                    'm. Rectus femoris',
                    'm. Vastus lateralis',
                    'm. Vastus medialis',
                    'm. Biceps femoris',
                    'm. Semitendinosus',
                    'm. Adductor longus',
                    'm. Gluteus medius',
                  ].map((tp) => (
                    <label key={tp} className="flex items-center gap-2 cursor-pointer font-semibold">
                      <input
                        type="checkbox"
                        checked={lowerBodyTriggerPoints.includes(tp)}
                        onChange={() => toggleCheckbox(lowerBodyTriggerPoints, setLowerBodyTriggerPoints, tp)}
                        className="w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                      />
                      <span>{tp}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-bold">Horná časť tela</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-brand-off-white p-2.5 rounded-lg border max-h-48 overflow-y-auto">
                  {[
                    'Mm. Splenius',
                    'm. Trapezius',
                    'm. Levator scapulae',
                    'm. Supraspinatus',
                    'm. Infraspinatus',
                    'm. Subscapularis',
                    'm. Pectoralis major',
                    'm. Latissimus dorsi',
                    'Mm. Rhomboidei',
                    'm. Sternocleidomastoideus',
                  ].map((tp) => (
                    <label key={tp} className="flex items-center gap-2 cursor-pointer font-semibold">
                      <input
                        type="checkbox"
                        checked={upperBodyTriggerPoints.includes(tp)}
                        onChange={() => toggleCheckbox(upperBodyTriggerPoints, setUpperBodyTriggerPoints, tp)}
                        className="w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                      />
                      <span>{tp}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 8.9 Vyšetrenie diastázy a dychový stereotyp */}
          <div className="border p-4 rounded-xl space-y-3">
            <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Vyšetrenie diastázy a dychový stereotyp</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label htmlFor="diastasis-state" className="block font-bold">Vyšetrenie diastázy</label>
                  <select
                    id="diastasis-state"
                    value={diastasisState}
                    onChange={(e) => setDiastasisState(e.target.value)}
                    className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                  >
                    {['Norma', 'Pupočná', 'Nad pupkom', 'Pod pupkom', 'Kombinovaná'].map((x) => (
                      <option key={x} value={x}>{x}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="diastasis-val" className="block font-bold">Hodnota (cm / prsty)</label>
                  <input
                    id="diastasis-val"
                    type="text"
                    value={diastasisValue}
                    onChange={(e) => setDiastasisValue(e.target.value)}
                    className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                    placeholder="napr. 1.5 cm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-bold">Dychový stereotyp</label>
                <div className="grid grid-cols-2 gap-1.5 bg-brand-off-white p-2 rounded-lg border">
                  {['Bránicové', 'Syndróm "presýpacích hodín"', 'Do brušnej dutiny', 'Do hrudníkovej dutiny'].map((ds) => (
                    <label key={ds} className="flex items-center gap-2 cursor-pointer font-semibold">
                      <input
                        type="checkbox"
                        checked={breathingPattern.includes(ds)}
                        onChange={() => toggleCheckbox(breathingPattern, setBreathingPattern, ds)}
                        className="w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                      />
                      <span>{ds}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 8.10 Kĺbna Mobilita a Flexibilita */}
          <div className="border p-4 rounded-xl space-y-4">
            <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Kĺbna Mobilita a Flexibilita</h4>
            
            {/* Ankle mobility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: '1. Pravý členkový kĺb', val: rightAnkleMobValue, setVal: setRightAnkleMobValue, state: rightAnkleMobState, setState: setRightAnkleMobState },
                { label: '2. Ľavý členkový kĺb', val: leftAnkleMobValue, setVal: setLeftAnkleMobValue, state: leftAnkleMobState, setState: setLeftAnkleMobState },
              ].map((field, i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label htmlFor={`ankle-mob-val-${i}`} className="block font-bold">{field.label} (Hodnota)</label>
                    <input
                      id={`ankle-mob-val-${i}`}
                      type="text"
                      value={field.val}
                      onChange={(e) => field.setVal(e.target.value)}
                      className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor={`ankle-mob-state-${i}`} className="block font-bold">Stav</label>
                    <select
                      id={`ankle-mob-state-${i}`}
                      value={field.state}
                      onChange={(e) => field.setState(e.target.value)}
                      className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                    >
                      {['Norma', 'mierne obmedzený', 'výrazne obmedzený'].map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {/* Knee mobility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label htmlFor="knee-r-flex" className="block font-bold">Koleno P - Flexia</label>
                  <input id="knee-r-flex" type="text" value={rightKneeFlex} onChange={(e) => setRightKneeFlex(e.target.value)} className="w-full bg-brand-off-white border p-2 rounded-lg outline-none" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="knee-r-ext" className="block font-bold">Koleno P - Extenzia</label>
                  <input id="knee-r-ext" type="text" value={rightKneeExt} onChange={(e) => setRightKneeExt(e.target.value)} className="w-full bg-brand-off-white border p-2 rounded-lg outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label htmlFor="knee-l-flex" className="block font-bold">Koleno Ľ - Flexia</label>
                  <input id="knee-l-flex" type="text" value={leftKneeFlex} onChange={(e) => setLeftKneeFlex(e.target.value)} className="w-full bg-brand-off-white border p-2 rounded-lg outline-none" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="knee-l-ext" className="block font-bold">Koleno Ľ - Extenzia</label>
                  <input id="knee-l-ext" type="text" value={leftKneeExt} onChange={(e) => setLeftKneeExt(e.target.value)} className="w-full bg-brand-off-white border p-2 rounded-lg outline-none" />
                </div>
              </div>
            </div>

            {/* Hip mobility */}
            <div className="border-t pt-2 space-y-3">
              <h5 className="font-bold text-[11px] text-gray-500 uppercase">Bedrový kĺb (Pravý a Ľavý)</h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <label htmlFor="hip-r-fl" className="block font-bold text-[10px]">Bedro P - Flexia</label>
                  <input id="hip-r-fl" type="text" value={rightHipFlex} onChange={(e) => setRightHipFlex(e.target.value)} className="w-full bg-brand-off-white border p-1.5 rounded-lg outline-none" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="hip-r-ex" className="block font-bold text-[10px]">Bedro P - Extenzia</label>
                  <input id="hip-r-ex" type="text" value={rightHipExt} onChange={(e) => setRightHipExt(e.target.value)} className="w-full bg-brand-off-white border p-1.5 rounded-lg outline-none" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="hip-r-ab" className="block font-bold text-[10px]">Bedro P - Abdukcia</label>
                  <input id="hip-r-ab" type="text" value={rightHipAbd} onChange={(e) => setRightHipAbd(e.target.value)} className="w-full bg-brand-off-white border p-1.5 rounded-lg outline-none" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="hip-r-ad" className="block font-bold text-[10px]">Bedro P - Addukcia</label>
                  <input id="hip-r-ad" type="text" value={rightHipAdd} onChange={(e) => setRightHipAdd(e.target.value)} className="w-full bg-brand-off-white border p-1.5 rounded-lg outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <label htmlFor="hip-l-fl" className="block font-bold text-[10px]">Bedro Ľ - Flexia</label>
                  <input id="hip-l-fl" type="text" value={leftHipFlex} onChange={(e) => setLeftHipFlex(e.target.value)} className="w-full bg-brand-off-white border p-1.5 rounded-lg outline-none" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="hip-l-ex" className="block font-bold text-[10px]">Bedro Ľ - Extenzia</label>
                  <input id="hip-l-ex" type="text" value={leftHipExt} onChange={(e) => setLeftHipExt(e.target.value)} className="w-full bg-brand-off-white border p-1.5 rounded-lg outline-none" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="hip-l-ab" className="block font-bold text-[10px]">Bedro Ľ - Abdukcia</label>
                  <input id="hip-l-ab" type="text" value={leftHipAbd} onChange={(e) => setLeftHipAbd(e.target.value)} className="w-full bg-brand-off-white border p-1.5 rounded-lg outline-none" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="hip-l-ad" className="block font-bold text-[10px]">Bedro Ľ - Addukcia</label>
                  <input id="hip-l-ad" type="text" value={leftHipAdd} onChange={(e) => setLeftHipAdd(e.target.value)} className="w-full bg-brand-off-white border p-1.5 rounded-lg outline-none" />
                </div>
              </div>
            </div>

            {/* Hip rotations */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t pt-2">
              {[
                { label: 'Pravý vonk. rotácia', val: hipRotationRightExt, set: setHipRotationRightExt },
                { label: 'Pravý vnút. rotácia', val: hipRotationRightInt, set: setHipRotationRightInt },
                { label: 'Ľavý vonk. rotácia', val: hipRotationLeftExt, set: setHipRotationLeftExt },
                { label: 'Ľavý vnút. rotácia', val: hipRotationLeftInt, set: setHipRotationLeftInt },
              ].map((field, i) => (
                <div key={i} className="space-y-1">
                  <label htmlFor={`hip-rot-${i}`} className="block font-bold text-[10px]">{field.label}</label>
                  <select
                    id={`hip-rot-${i}`}
                    value={field.val}
                    onChange={(e) => field.set(e.target.value)}
                    className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
                  >
                    {['NORMA', 'mierne obmedzený', 'výrazne obmedzený'].map((x) => (
                      <option key={x} value={x}>{x}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="space-y-1 border-t pt-2">
              <label htmlFor="si-joint" className="block font-bold">Vyšetrenie SI skĺbenia</label>
              <select
                id="si-joint"
                value={siJointState}
                onChange={(e) => setSiJointState(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none focus:border-brand-navy"
              >
                {['NORMA', 'pravé vyššie', 'ľavé vyššie'].map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 8.11 Chrbtica a Ramenný kĺb (Doplnkové testy flexibility) */}
          <div className="border p-4 rounded-xl space-y-4">
            <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Chrbtica a Ramenný kĺb (Doplnkové testy flexibility)</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'Skolióza', state: flexScoliosisState, setState: setFlexScoliosisState, val: flexScoliosisValue, setVal: setFlexScoliosisValue },
                { label: 'Lumbálna', state: flexLumbarState, setState: setFlexLumbarState, val: flexLumbarValue, setVal: setFlexLumbarValue },
                { label: 'Hrudníková (Th)', state: flexThState, setState: setFlexThState, val: flexThValue, setVal: setFlexThValue },
                { label: 'Krčná (C)', state: flexCState, setState: setFlexCState, val: flexCValue, setVal: setFlexCValue },
                { label: 'Rotácia Th (Pravá)', state: flexRotationThRightState, setState: setFlexRotationThRightState, val: flexRotationThRightValue, setVal: setFlexRotationThRightValue },
                { label: 'Rotácia Th (Ľavá)', state: flexRotationThLeftState, setState: setFlexRotationThLeftState, val: flexRotationThLeftValue, setVal: setFlexRotationThLeftValue },
              ].map((field, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 border p-2 rounded-lg bg-brand-off-white">
                  <div className="space-y-1">
                    <span className="block font-bold text-[10px]">{field.label} (Stav)</span>
                    <select
                      value={field.state}
                      onChange={(e) => field.setState(e.target.value)}
                      className="w-full bg-white border p-1 rounded outline-none"
                    >
                      {['Norma', 'Zvýšená', 'Znížená', 'Obmedzená'].map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="block font-bold text-[10px]">Hodnota</span>
                    <input
                      type="text"
                      value={field.val}
                      onChange={(e) => field.setVal(e.target.value)}
                      className="w-full bg-white border p-1 rounded outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-2">
              {[
                { label: 'Postavenie lopatky (Pravá)', list: flexScapulaRight, set: setFlexScapulaRight },
                { label: 'Postavenie lopatky (Ľavá)', list: flexScapulaLeft, set: setFlexScapulaLeft },
              ].map((field, i) => (
                <div key={i} className="space-y-2">
                  <label className="block font-bold">{field.label}</label>
                  <div className="grid grid-cols-2 gap-1.5 bg-brand-off-white p-2 rounded-lg border">
                    {['Protrakcia', 'Retrakcia', 'Depresia', 'Elevácia', 'Vonkajšia rotácia', 'Vnútorná rotácia'].map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer font-semibold">
                        <input
                          type="checkbox"
                          checked={field.list.includes(opt)}
                          onChange={() => toggleCheckbox(field.list, field.set, opt)}
                          className="w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-2 space-y-2">
              <h5 className="font-bold text-[10px] text-gray-500 uppercase">Ramenný kĺb – rozsah pohybu</h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Pravé - Flexia', val: shoulderRangeFlexRight, set: setShoulderRangeFlexRight },
                  { label: 'Ľavé - Flexia', val: shoulderRangeFlexLeft, set: setShoulderRangeFlexLeft },
                  { label: 'Pravé - Extenzia', val: shoulderRangeExtRight, set: setShoulderRangeExtRight },
                  { label: 'Ľavé - Extenzia', val: shoulderRangeExtLeft, set: setShoulderRangeExtLeft },
                  { label: 'Pravé - Abdukcia', val: shoulderRangeAbdRight, set: setShoulderRangeAbdRight },
                  { label: 'Ľavé - Abdukcia', val: shoulderRangeAbdLeft, set: setShoulderRangeAbdLeft },
                  { label: 'Pravé - Addukcia', val: shoulderRangeAddRight, set: setShoulderRangeAddRight },
                  { label: 'Ľavé - Addukcia', val: shoulderRangeAddLeft, set: setShoulderRangeAddLeft },
                ].map((field, i) => (
                  <div key={i} className="space-y-1">
                    <label htmlFor={`shoulder-range-${i}`} className="block font-bold text-[9px]">{field.label}</label>
                    <select
                      id={`shoulder-range-${i}`}
                      value={field.val}
                      onChange={(e) => field.set(e.target.value)}
                      className="w-full bg-brand-off-white border p-1.5 rounded-lg outline-none focus:border-brand-navy"
                    >
                      {['NORMA', 'mierne obmedzený', 'výrazne obmedzený'].map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 8.12 Vyšetrenie flexibility svalových skupín (Fotografie) */}
          <div className="border p-4 rounded-xl space-y-4">
            <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Vyšetrenie flexibility svalových skupín</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[
                'm. Gastrocnemius',
                'm. Soleus',
                'm. Iliopsoas',
                'm. Rectus femoris',
                'm. Tensor fasciae latae',
                'm. Piriformis',
                'Hamstrings',
                'Adductors',
                'm. Pectoralis major',
                'm. Pectoralis minor',
                'm. Latissimus dorsi',
              ].map((muscle) => (
                <div key={muscle} className="border p-2 rounded-lg bg-brand-off-white text-center space-y-2">
                  <span className="font-bold block text-[10px]">{muscle}</span>
                  {uploadedMuscleFlex[muscle] ? (
                    <div className="flex justify-between items-center bg-white p-1 rounded text-[10px] border">
                      <span className="truncate flex-1">📷 {uploadedMuscleFlex[muscle]}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...uploadedMuscleFlex };
                          delete updated[muscle];
                          setUploadedMuscleFlex(updated);
                        }}
                        className="text-red-500 hover:underline font-bold ml-1"
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        id={`upload-${muscle}`}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadedMuscleFlex({
                              ...uploadedMuscleFlex,
                              [muscle]: file.name,
                            });
                          }
                        }}
                      />
                      <label
                        htmlFor={`upload-${muscle}`}
                        className="py-1 px-3 bg-brand-navy text-white text-[10px] font-bold rounded-lg cursor-pointer inline-block"
                      >
                        Pridať foto
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 8.13 FMS diagnostika */}
          <div className="border p-4 rounded-xl space-y-4">
            <h4 className="font-bold text-brand-navy text-xs border-b pb-1">FMS diagnostika</h4>
            
            <div className="space-y-1">
              <label htmlFor="fms-glob" className="block font-bold">Globálny File upload FMS</label>
              <input
                id="fms-glob"
                type="text"
                value={fmsGlobalFile}
                onChange={(e) => setFmsGlobalFile(e.target.value)}
                placeholder="Názov FMS súboru..."
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none"
              />
            </div>

            {/* FMS details list */}
            {[
              {
                id: 'deepsquat',
                label: 'DEEP SQUAT',
                score: fmsDeepSquatScore,
                setScore: setFmsDeepSquatScore,
                val: fmsDeepSquatValue,
                setVal: setFmsDeepSquatValue,
                list: fmsDeepSquatObs,
                setList: setFmsDeepSquatObs,
                other: fmsDeepSquatObsOther,
                setOther: setFmsDeepSquatObsOther,
                opts: ['externá rotácia tibie PDK', 'externá rotácia tibie LDK', 'nestabilita trupu', 'päty sa dvíhajú', 'kolená do valgusu'],
              },
              {
                id: 'hurdlestep-r',
                label: 'HURDLE STEP (Pravá)',
                score: fmsHurdleStepRightScore,
                setScore: setFmsHurdleStepRightScore,
                val: fmsHurdleStepRightValue,
                setVal: setFmsHurdleStepRightValue,
                list: fmsHurdleStepRightObs,
                setList: setFmsHurdleStepRightObs,
                other: fmsHurdleStepRightObsOther,
                setOther: setFmsHurdleStepRightObsOther,
                opts: ['strata rovnováhy', 'vytočenie panvy', 'koleno do valgusu', 'dotyk prekážky'],
              },
              {
                id: 'hurdlestep-l',
                label: 'HURDLE STEP (Ľavá)',
                score: fmsHurdleStepLeftScore,
                setScore: setFmsHurdleStepLeftScore,
                val: fmsHurdleStepLeftValue,
                setVal: setFmsHurdleStepLeftValue,
                list: fmsHurdleStepLeftObs,
                setList: setFmsHurdleStepLeftObs,
                other: fmsHurdleStepLeftObsOther,
                setOther: setFmsHurdleStepLeftObsOther,
                opts: ['strata rovnováhy', 'vytočenie panvy', 'koleno do valgusu', 'dotyk prekážky'],
              },
              {
                id: 'inlinelunge-r',
                label: 'IN-LINE LUNGE (Pravá)',
                score: fmsInlineLungeRightScore,
                setScore: setFmsInlineLungeRightScore,
                val: fmsInlineLungeRightValue,
                setVal: setFmsInlineLungeRightValue,
                list: fmsInlineLungeRightObs,
                setList: setFmsInlineLungeRightObs,
                other: fmsInlineLungeRightObsOther,
                setOther: setFmsInlineLungeRightObsOther,
                opts: ['neudržanie osi', 'strata rovnováhy', 'koleno sa nedotkne podložky'],
              },
              {
                id: 'inlinelunge-l',
                label: 'IN-LINE LUNGE (Ľavá)',
                score: fmsInlineLungeLeftScore,
                setScore: setFmsInlineLungeLeftScore,
                val: fmsInlineLungeLeftValue,
                setVal: setFmsInlineLungeLeftValue,
                list: fmsInlineLungeLeftObs,
                setList: setFmsInlineLungeLeftObs,
                other: fmsInlineLungeLeftObsOther,
                setOther: setFmsInlineLungeLeftObsOther,
                opts: ['neudržanie osi', 'strata rovnováhy', 'koleno sa nedotkne podložky'],
              },
            ].map((fms) => (
              <div key={fms.id} className="border p-3 rounded-lg bg-brand-off-white space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-brand-navy">{fms.label}</span>
                  <div className="flex gap-2 items-center">
                    <span className="font-semibold text-gray-500">Skóre:</span>
                    {['3', '2', '1', '0'].map((scr) => (
                      <label key={scr} className="flex items-center gap-1 cursor-pointer font-bold">
                        <input
                          type="radio"
                          name={`score-${fms.id}`}
                          value={scr}
                          checked={fms.score === scr}
                          onChange={() => fms.setScore(scr)}
                          className="w-4 h-4 text-brand-cyan"
                        />
                        <span>{scr}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="block font-semibold">Pozorovania</span>
                    <div className="grid grid-cols-1 gap-1">
                      {fms.opts.map((opt) => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer font-semibold text-[10px]">
                          <input
                            type="checkbox"
                            checked={fms.list.includes(opt)}
                            onChange={() => toggleCheckbox(fms.list, fms.setList, opt)}
                            className="w-3.5 h-3.5 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <span className="block font-semibold">Hodnota</span>
                      <input
                        type="text"
                        value={fms.val}
                        onChange={(e) => fms.setVal(e.target.value)}
                        className="w-full bg-white border p-1.5 rounded outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="block font-semibold">Iné (pozorovania)</span>
                      <input
                        type="text"
                        value={fms.other}
                        onChange={(e) => fms.setOther(e.target.value)}
                        className="w-full bg-white border p-1.5 rounded outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Ankle clearing tests */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-3 rounded-lg bg-brand-off-white">
              {[
                { label: 'ANKLE CLEARING TEST (Pravá)', zone: fmsAnkleClearingRightZone, setZone: setFmsAnkleClearingRightZone, val: fmsAnkleClearingRightValue, setVal: setFmsAnkleClearingRightValue, name: 'ankle-cl-r' },
                { label: 'ANKLE CLEARING TEST (Ľavá)', zone: fmsAnkleClearingLeftZone, setZone: setFmsAnkleClearingLeftZone, val: fmsAnkleClearingLeftValue, setVal: setFmsAnkleClearingLeftValue, name: 'ankle-cl-l' },
              ].map((fms, i) => (
                <div key={i} className="space-y-2">
                  <span className="font-bold text-[10px] block">{fms.label}</span>
                  <div className="flex gap-3 items-center">
                    <span className="font-semibold text-gray-500">Zóna:</span>
                    {[
                      { val: 'green', cls: 'accent-green-500', lbl: 'Green' },
                      { val: 'yellow', cls: 'accent-yellow-500', lbl: 'Yellow' },
                      { val: 'red', cls: 'accent-red-500', lbl: 'Red' },
                    ].map((opt) => (
                      <label key={opt.val} className="flex items-center gap-1 cursor-pointer font-semibold">
                        <input
                          type="radio"
                          name={`zone-${fms.name}`}
                          value={opt.val}
                          checked={fms.zone === opt.val}
                          onChange={() => fms.setZone(opt.val)}
                          className={`w-4 h-4 ${opt.cls}`}
                        />
                        <span>{opt.lbl}</span>
                      </label>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <span className="block font-semibold">Hodnota</span>
                    <input
                      type="text"
                      value={fms.val}
                      onChange={(e) => fms.setVal(e.target.value)}
                      className="w-full bg-white border p-1.5 rounded outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Shoulder mobility FMS */}
            {[
              {
                id: 'shouldermob-r',
                label: 'SHOULDER MOBILITY (Pravá)',
                score: fmsShoulderMobilityRightScore,
                setScore: setFmsShoulderMobilityRightScore,
                val: fmsShoulderMobilityRightValue,
                setVal: setFmsShoulderMobilityRightValue,
                list: fmsShoulderMobilityRightObs,
                setList: setFmsShoulderMobilityRightObs,
                other: fmsShoulderMobilityRightObsOther,
                setOther: setFmsShoulderMobilityRightObsOther,
                opts: ['asymetria', 'obmedzenie rotácie', 'bolesť pri dotyku lopatky'],
              },
              {
                id: 'shouldermob-l',
                label: 'SHOULDER MOBILITY (Ľavá)',
                score: fmsShoulderMobilityLeftScore,
                setScore: setFmsShoulderMobilityLeftScore,
                val: fmsShoulderMobilityLeftValue,
                setVal: setFmsShoulderMobilityLeftValue,
                list: fmsShoulderMobilityLeftObs,
                setList: setFmsShoulderMobilityLeftObs,
                other: fmsShoulderMobilityLeftObsOther,
                setOther: setFmsShoulderMobilityLeftObsOther,
                opts: ['asymetria', 'obmedzenie rotácie', 'bolesť pri dotyku lopatky'],
              },
            ].map((fms) => (
              <div key={fms.id} className="border p-3 rounded-lg bg-brand-off-white space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-brand-navy">{fms.label}</span>
                  <div className="flex gap-2 items-center">
                    <span className="font-semibold text-gray-500">Skóre:</span>
                    {['3', '2', '1', '0'].map((scr) => (
                      <label key={scr} className="flex items-center gap-1 cursor-pointer font-bold">
                        <input
                          type="radio"
                          name={`score-${fms.id}`}
                          value={scr}
                          checked={fms.score === scr}
                          onChange={() => fms.setScore(scr)}
                          className="w-4 h-4 text-brand-cyan"
                        />
                        <span>{scr}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="block font-semibold">Pozorovania</span>
                    <div className="grid grid-cols-1 gap-1">
                      {fms.opts.map((opt) => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer font-semibold text-[10px]">
                          <input
                            type="checkbox"
                            checked={fms.list.includes(opt)}
                            onChange={() => toggleCheckbox(fms.list, fms.setList, opt)}
                            className="w-3.5 h-3.5 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <span className="block font-semibold">Hodnota</span>
                      <input
                        type="text"
                        value={fms.val}
                        onChange={(e) => fms.setVal(e.target.value)}
                        className="w-full bg-white border p-1.5 rounded outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="block font-semibold">Iné (pozorovania)</span>
                      <input
                        type="text"
                        value={fms.other}
                        onChange={(e) => fms.setOther(e.target.value)}
                        className="w-full bg-white border p-1.5 rounded outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Active straight-leg raise */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-3 rounded-lg bg-brand-off-white">
              {[
                { label: 'ACTIVE STRAIGHT-LEG RAISE (Pravá)', score: fmsActiveLegRaiseRightScore, setScore: setFmsActiveLegRaiseRightScore, val1: fmsActiveLegRaiseRightVal1, setVal1: setFmsActiveLegRaiseRightVal1, val2: fmsActiveLegRaiseRightVal2, setVal2: setFmsActiveLegRaiseRightVal2, name: 'aslr-r' },
                { label: 'ACTIVE STRAIGHT-LEG RAISE (Ľavá)', score: fmsActiveLegRaiseLeftScore, setScore: setFmsActiveLegRaiseLeftScore, val1: fmsActiveLegRaiseLeftVal1, setVal1: setFmsActiveLegRaiseLeftVal1, val2: fmsActiveLegRaiseLeftVal2, setVal2: setFmsActiveLegRaiseLeftVal2, name: 'aslr-l' },
              ].map((fms, i) => (
                <div key={i} className="space-y-2 border-b pb-2 sm:border-b-0 sm:pb-0">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[10px]">{fms.label}</span>
                    <div className="flex gap-1">
                      {['3', '2', '1', '0'].map((scr) => (
                        <label key={scr} className="flex items-center gap-1 cursor-pointer font-bold text-[10px]">
                          <input
                            type="radio"
                            name={`score-${fms.name}`}
                            value={scr}
                            checked={fms.score === scr}
                            onChange={() => fms.setScore(scr)}
                            className="w-3.5 h-3.5 text-brand-cyan"
                          />
                          <span>{scr}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="block font-semibold">Hodnota 1</span>
                      <input
                        type="text"
                        value={fms.val1}
                        onChange={(e) => fms.setVal1(e.target.value)}
                        className="w-full bg-white border p-1.5 rounded outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="block font-semibold">Hodnota 2</span>
                      <input
                        type="text"
                        value={fms.val2}
                        onChange={(e) => fms.setVal2(e.target.value)}
                        className="w-full bg-white border p-1.5 rounded outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Trunk stability push up */}
            <div className="border p-3 rounded-lg bg-brand-off-white space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-brand-navy">TRUNK STABILITY PUSH-UP</span>
                <div className="flex gap-2 items-center">
                  <span className="font-semibold text-gray-500">Skóre:</span>
                  {['3', '2', '1', '0'].map((scr) => (
                    <label key={scr} className="flex items-center gap-1 cursor-pointer font-bold">
                      <input
                        type="radio"
                        name="score-pushup"
                        value={scr}
                        checked={fmsTrunkStabilityScore === scr}
                        onChange={() => setFmsTrunkStabilityScore(scr)}
                        className="w-4 h-4 text-brand-cyan"
                      />
                      <span>{scr}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="block font-semibold">Pozorovania</span>
                  <div className="grid grid-cols-1 gap-1">
                    {['sagging trupu', 'asymetria lakťov', 'neschopnosť vytlačiť naraz'].map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer font-semibold text-[10px]">
                        <input
                          type="checkbox"
                          checked={fmsTrunkStabilityObs.includes(opt)}
                          onChange={() => toggleCheckbox(fmsTrunkStabilityObs, setFmsTrunkStabilityObs, opt)}
                          className="w-3.5 h-3.5 rounded text-brand-cyan focus:ring-brand-cyan"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="block font-semibold">Iné (pozorovania)</span>
                  <input
                    type="text"
                    value={fmsTrunkStabilityObsOther}
                    onChange={(e) => setFmsTrunkStabilityObsOther(e.target.value)}
                    className="w-full bg-white border p-1.5 rounded outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Extension clearing test */}
            <div className="grid grid-cols-2 gap-3 border p-3 rounded-lg bg-brand-off-white">
              <div className="space-y-2">
                <span className="font-bold text-[10px] block">EXTENSION CLEARING TEST</span>
                <div className="flex gap-3">
                  {['bez bolesti', 'bolesť'].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer font-semibold">
                      <input
                        type="radio"
                        name="ext-clearing"
                        value={opt}
                        checked={fmsExtensionClearingPain === opt}
                        onChange={() => setFmsExtensionClearingPain(opt)}
                        className="w-4 h-4 text-brand-cyan"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <span className="block font-semibold">Hodnota</span>
                <input
                  type="text"
                  value={fmsExtensionClearingValue}
                  onChange={(e) => setFmsExtensionClearingValue(e.target.value)}
                  className="w-full bg-white border p-1.5 rounded outline-none"
                />
              </div>
            </div>

            {/* Rotary stability */}
            {[
              {
                id: 'rotary-r',
                label: 'ROTARY STABILITY (Pravá)',
                score: fmsRotaryStabilityRightScore,
                setScore: setFmsRotaryStabilityRightScore,
                val: fmsRotaryStabilityRightValue,
                setVal: setFmsRotaryStabilityRightValue,
                list: fmsRotaryStabilityRightObs,
                setList: setFmsRotaryStabilityRightObs,
                other: fmsRotaryStabilityRightObsOther,
                setOther: setFmsRotaryStabilityRightObsOther,
                opts: ['strata rovnováhy', 'neudržanie stability', 'neschopnosť vykonať unilaterálne'],
              },
              {
                id: 'rotary-l',
                label: 'ROTARY STABILITY (Ľavá)',
                score: fmsRotaryStabilityLeftScore,
                setScore: setFmsRotaryStabilityLeftScore,
                val: fmsRotaryStabilityLeftValue,
                setVal: setFmsRotaryStabilityLeftValue,
                list: fmsRotaryStabilityLeftObs,
                setList: setFmsRotaryStabilityLeftObs,
                other: fmsRotaryStabilityLeftObsOther,
                setOther: setFmsRotaryStabilityLeftObsOther,
                opts: ['strata rovnováhy', 'neudržanie stability', 'neschopnosť vykonať unilaterálne'],
              },
            ].map((fms) => (
              <div key={fms.id} className="border p-3 rounded-lg bg-brand-off-white space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-brand-navy">{fms.label}</span>
                  <div className="flex gap-2 items-center">
                    <span className="font-semibold text-gray-500">Skóre:</span>
                    {['3', '2', '1', '0'].map((scr) => (
                      <label key={scr} className="flex items-center gap-1 cursor-pointer font-bold">
                        <input
                          type="radio"
                          name={`score-${fms.id}`}
                          value={scr}
                          checked={fms.score === scr}
                          onChange={() => fms.setScore(scr)}
                          className="w-4 h-4 text-brand-cyan"
                        />
                        <span>{scr}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="block font-semibold">Pozorovania</span>
                    <div className="grid grid-cols-1 gap-1">
                      {fms.opts.map((opt) => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer font-semibold text-[10px]">
                          <input
                            type="checkbox"
                            checked={fms.list.includes(opt)}
                            onChange={() => toggleCheckbox(fms.list, fms.setList, opt)}
                            className="w-3.5 h-3.5 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <span className="block font-semibold">Hodnota</span>
                      <input
                        type="text"
                        value={fms.val}
                        onChange={(e) => fms.setVal(e.target.value)}
                        className="w-full bg-white border p-1.5 rounded outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="block font-semibold">Iné (pozorovania)</span>
                      <input
                        type="text"
                        value={fms.other}
                        onChange={(e) => fms.setOther(e.target.value)}
                        className="w-full bg-white border p-1.5 rounded outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Flexion clearing test */}
            <div className="grid grid-cols-2 gap-3 border p-3 rounded-lg bg-brand-off-white">
              <div className="space-y-2">
                <span className="font-bold text-[10px] block">FLEXION CLEARING TEST</span>
                <div className="flex gap-3">
                  {['bez bolesti', 'bolesť'].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer font-semibold">
                      <input
                        type="radio"
                        name="flex-clearing"
                        value={opt}
                        checked={fmsFlexionClearingPain === opt}
                        onChange={() => setFmsFlexionClearingPain(opt)}
                        className="w-4 h-4 text-brand-cyan"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <span className="block font-semibold">Hodnota</span>
                <input
                  type="text"
                  value={fmsFlexionClearingValue}
                  onChange={(e) => setFmsFlexionClearingValue(e.target.value)}
                  className="w-full bg-white border p-1.5 rounded outline-none"
                />
              </div>
            </div>
          </div>

          {/* 8.14 Silové testy */}
          <div className="border p-4 rounded-xl space-y-4">
            <h4 className="font-bold text-brand-navy text-xs border-b pb-1">Silové testy</h4>
            
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center bg-brand-off-white hover:bg-brand-light-cyan/30 hover:border-brand-cyan/40 transition-colors">
              <span className="font-bold text-gray-400 block mb-2">Pretiahnite silové výsledky/obrázky sem</span>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                id="strength-upload-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadedStrength((s) => [...s, file.name]);
                  }
                }}
              />
              <label
                htmlFor="strength-upload-input"
                className="inline-block py-2 px-5 bg-brand-navy text-white font-bold rounded-xl cursor-pointer hover:bg-brand-navy/90 transition-colors"
              >
                Vybrať súbor
              </label>
            </div>

            {uploadedStrength.length > 0 && (
              <div className="p-3 bg-brand-light-cyan/40 border border-brand-cyan/20 rounded-xl space-y-1">
                <strong className="block text-[10px] uppercase text-gray-500">Nahrané súbory:</strong>
                {uploadedStrength.map((fn, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white border p-2 rounded-lg font-semibold">
                    <span>💪 {fn}</span>
                    <button type="button" onClick={() => setUploadedStrength(uploadedStrength.filter((_, i) => i !== idx))} className="text-red-500 font-bold hover:underline">Zmazať</button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="step8-strnotes" className="block font-bold">Doplňujúce informácie</label>
              <textarea
                id="step8-strnotes"
                value={strengthNotes}
                onChange={(e) => setStrengthNotes(e.target.value)}
                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none h-24 focus:border-brand-navy"
                placeholder="Poznámky k silovým testom (napr. 1RM drep, bench, atď.)..."
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 9: ZÁVER */}
      {step === 9 && (
        <form onSubmit={handleFinalSubmit} className="space-y-4">
          <h3 className="text-sm font-bold border-b pb-1">Krok 9: Záver</h3>

          <div className="space-y-1">
            <label htmlFor="step9-conclusion" className="block font-bold">
              Na základe zistených svalových dysbalancií sa budeme venovať nasledujúcim kľúčovým segmentom: <span className="text-red-500">*</span>
            </label>
            <textarea
              id="step9-conclusion"
              required
              value={conclusionNotes}
              onChange={(e) => setConclusionNotes(e.target.value)}
              className="w-full bg-brand-off-white border p-3 rounded-lg outline-none h-32 focus:border-brand-navy text-xs"
              placeholder="Zadajte finálne zhodnotenie, svalové dysbalancie a odporúčaný postup..."
            />
          </div>

          <div className="bg-brand-light-cyan/40 border border-brand-cyan/20 p-3 rounded-xl">
            <p className="font-semibold text-brand-navy">Odoslaním formulára vytvoríte komplexný diagnostický záznam v databáze pre klienta {firstName} {lastName}.</p>
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
        {step < 9 ? (
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
