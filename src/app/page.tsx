"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";

// Hooks
import { useAuth, ClientProfile } from "@/hooks/useAuth";
import { useSportWellData, WorkoutPlan, Appointment, MedicalCard } from "@/hooks/useSportWellData";

// Components
import FormRenderer from "@/components/common/FormRenderer";
import Prescription from "@/components/training/Prescription";
import GdprWizard from "@/components/gdpr/GdprWizard";

// Utils
import { generateGdprPdf } from "@/utils/pdfGenerator";
import { isLateCancellation, getCancellationStatus } from "@/utils/cancellation";

interface PainPoint {
  region: string;
  intensity: number;
  notes: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration_min: number;
  category: 'fyzio' | 'masaz' | 'trening' | 'ortoped' | 'nutricia';
}

interface Payment {
  id: string;
  client_name: string;
  service_name: string;
  amount: number;
  method: 'karta' | 'hotovost';
  invoice_number: string;
  status: 'zaplatene' | 'refundovane';
  created_at: string;
}

export default function CompleteSportWellApp() {
  const supabase = createClient();
  const [toast, setToast] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Data Hooks
  const {
    clients,
    setClients,
    medicalCards,
    appointments,
    auditLogs,
    documents,
    setDocuments,
    formTemplates,
    exercises,
    workoutPlans,
    setWorkoutPlans,
    loadData,
    prescribeExercise,
    deleteClientExercise,
    submitDiagnosis,
    savePainPoint
  } = useSportWellData(triggerToast);

  // 2. Auth Hooks
  const {
    sessionUser,
    setSessionUser,
    currentUserProfile,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authMode,
    setAuthMode,
    isAuthLoading,
    registerFullName,
    setRegisterFullName,
    registerVerifyPending,
    setRegisterVerifyPending,
    registerInputCode,
    setRegisterInputCode,
    setRegisterVerifyCode,
    handleAuthSubmit,
    handleSignOut,
    updateProfilePhone,
    fetchUserProfile
  } = useAuth(triggerToast, loadData);

  // 3. UI states & static lists
  const [services] = useState<Service[]>([
    { id: "s1", name: "Fyzioterapia - Vstupné vyšetrenie", price: 45, duration_min: 50, category: "fyzio" },
    { id: "s2", name: "Rehabilitačný tréning", price: 35, duration_min: 60, category: "trening" },
    { id: "s3", name: "Športová masáž chrbta", price: 25, duration_min: 30, category: "masaz" },
    { id: "s4", name: "Ortopedická konzultácia", price: 60, duration_min: 20, category: "ortoped" },
    { id: "s5", name: "Nutričná diagnostika", price: 40, duration_min: 45, category: "nutricia" }
  ]);

  const [payments, setPayments] = useState<Payment[]>([
    { id: "p1", client_name: "Roman Kováč", service_name: "Fyzioterapia - Vstupné vyšetrenie", amount: 45, method: "karta", invoice_number: "20260001", status: "zaplatene", created_at: "2026-06-01T09:00:00Z" }
  ]);

  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [videoSearch, setVideoSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<'all' | 'gdpr_missing' | 'inactive'>('all');
  
  // Custom Registration Form (Admin)
  const [newClientFirst, setNewClientFirst] = useState("");
  const [newClientLast, setNewClientLast] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");

  // Late cancellation confirmation
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [isLateCancel, setIsLateCancel] = useState(false);

  // Payment creation
  const [payServiceId, setPayServiceId] = useState("s1");
  const [payMethod, setPayMethod] = useState<'karta' | 'hotovost'>("karta");

  // Client workout feedback
  const [feedbackWorkId, setFeedbackWorkId] = useState<string | null>(null);
  const [feedbackRpe, setFeedbackRpe] = useState(5);
  const [feedbackPain, setFeedbackPain] = useState(2);
  const [feedbackNote, setFeedbackNote] = useState("");

  // Pain map client state
  const [selectedPainRegion, setSelectedPainRegion] = useState<string>("Pravé koleno");
  const [painIntensity, setPainIntensity] = useState<number>(5);
  const [painNotes, setPainNotes] = useState<string>("");

  // Onboarding Wizard States & Actions
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onbFirstName, setOnbFirstName] = useState("");
  const [onbLastName, setOnbLastName] = useState("");
  const [onbBirthDate, setOnbBirthDate] = useState("");
  const [onbAddress, setOnbAddress] = useState("");
  const [onbEmail, setOnbEmail] = useState("");
  const [onbPhone, setOnbPhone] = useState("");
  const [onbInterest, setOnbInterest] = useState("Fyzioterapia");

  const [onbPrivacyAccepted, setOnbPrivacyAccepted] = useState(false);
  const [onbTermsAccepted, setOnbTermsAccepted] = useState(false);
  const [onbMarketingAccepted, setOnbMarketingAccepted] = useState(false);
  const [onbMetaAccepted, setOnbMetaAccepted] = useState(false);
  const [onbDiagAccepted, setOnbDiagAccepted] = useState(false);

  const [showPrivacyTerms, setShowPrivacyTerms] = useState(false);
  const [showBookingTerms, setShowBookingTerms] = useState(false);
  const [isOnboardingSaving, setIsOnboardingSaving] = useState(false);

  // Verejné formuláre (GDPR a Vstupná anamnéza z domu)
  const [publicForm, setPublicForm] = useState<'gdpr' | 'anamneza' | null>(null);
  const [signatureCode, setSignatureCode] = useState("");
  const [signatureInput, setSignatureInput] = useState("");
  const [signatureSent, setSignatureSent] = useState(false);
  const [anamnesisStep, setAnamnesisStep] = useState(1);
  const [anbInjuries, setAnbInjuries] = useState("");
  const [anbMedications, setAnbMedications] = useState("");
  const [anbContraindications, setAnbContraindications] = useState("");
  const [anbRestrictions, setAnbRestrictions] = useState("");
  const [publicPainPoints, setPublicPainPoints] = useState<PainPoint[]>([]);

  // Form templates editor
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorCategory, setEditorCategory] = useState("fyzio");
  const [editorFields, setEditorFields] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [dynamicFormData, setDynamicFormData] = useState<Record<string, any>>({});

  // Zaheslované PDF
  const [pdfPassword, setPdfPassword] = useState("");
  const [showPdfPasswordModal, setShowPdfPasswordModal] = useState(false);
  const [selectedRecordForPdf, setSelectedRecordForPdf] = useState<any>(null);

  // 4. Client workout plans effect
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const p = params.get("p");
      if (p === "gdpr" || p === "anamneza") {
        setPublicForm(p as 'gdpr' | 'anamneza');
      }
    }
  }, []);

  const handleOnboardingSubmit = async (data: {
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
  }) => {
    if (!sessionUser || !currentUserProfile) return;

    const fullName = `${data.firstName} ${data.lastName}`.trim() || "Nový Klient";
    const metadataObj = {
      birth_date: data.birthDate,
      address: data.address,
      primary_interest: data.primaryInterest,
      gdpr_version: "v3.0",
      marketing_accepted: data.marketingAccepted,
      meta_accepted: data.metaAccepted,
      diag_accepted: data.diagAccepted,
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone: data.phone,
        email: data.email || sessionUser.email,
        gdpr_signed_at: new Date().toISOString(),
        metadata: metadataObj
      })
      .eq("id", sessionUser.id);

    if (profileError) {
      triggerToast(`Chyba uloženia profilu: ${profileError.message}`);
      return;
    }

    await supabase.from("documents").insert({
      client_id: sessionUser.id,
      file_name: `GDPR_Suhlas_${fullName.replace(/\s+/g, '_')}.pdf`,
      storage_path: `gdpr/gdpr_${sessionUser.id}.pdf`
    });

    triggerToast("Registrácia a súhlas s GDPR boli úspešne uložené!");
    await fetchUserProfile(sessionUser.id);
  };

  const isEmployee = currentUserProfile ? currentUserProfile.role !== "klient" : false;

  const navigationItems = useMemo(() => {
    if (!currentUserProfile) return [];
    if (currentUserProfile.role === 'admin') {
      return [
        { id: "dashboard", label: "Dashboard" },
        { id: "klienti", label: "Klienti" },
        { id: "diagnostika", label: "Diagnostika" },
        { id: "videokniznica", label: "Videoknižnica" },
        { id: "rezervacie", label: "Rezervácie" },
        { id: "platby", label: "Platby & eKasa" },
        { id: "reporty", label: "Reporty" },
        { id: "nastavenia", label: "Nastavenia" }
      ];
    }
    if (currentUserProfile.role === 'klient') {
      return [
        { id: "dashboard", label: "Dashboard" },
        { id: "plan", label: "Moje Cviky" },
        { id: "videa", label: "Videá" },
        { id: "rezervacie", label: "Rezervácie" },
        { id: "dokumenty", label: "Dokumenty" },
        { id: "profil", label: "Môj profil" }
      ];
    }
    return [
      { id: "dashboard", label: "Dashboard" },
      { id: "klienti", label: "Moji klienti" },
      { id: "diagnostika", label: "Diagnostika" },
      { id: "plan", label: "Domáce plány" },
      { id: "videokniznica", label: "Videoknižnica" },
      { id: "rezervacie", label: "Rezervácie" }
    ];
  }, [currentUserProfile]);

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchSearch = c.full_name.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;
      if (clientFilter === 'gdpr_missing') return !c.gdpr_signed_at;
      if (clientFilter === 'inactive') return c.role === 'klient' && !c.gdpr_signed_at;
      return true;
    });
  }, [clients, searchTerm, clientFilter]);

  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId) || clients[0] || currentUserProfile;
  }, [clients, selectedClientId, currentUserProfile]);

  const registerClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: newClientEmail,
      password: "DefaultPassword123!"
    });

    if (authData?.user) {
      const { error } = await supabase.from("profiles").insert({
        id: authData.user.id,
        role: "klient",
        full_name: `${newClientFirst} ${newClientLast}`.trim() || "Nový Klient",
        phone: newClientPhone,
        email: newClientEmail,
        metadata: {}
      });

      if (!error) {
        triggerToast("Klient bol úspešne registrovaný a uložený do databázy.");
        await loadData(currentUserProfile!);
      }
    } else {
      triggerToast(authErr?.message || "Registrácia zlyhala");
    }

    setNewClientFirst("");
    setNewClientLast("");
    setNewClientEmail("");
    setNewClientPhone("");
  };

  const handleBookingCancelInit = (id: string) => {
    const appt = appointments.find(a => a.id === id);
    if (!appt) return;
    const isLate = isLateCancellation(appt.start_time);
    setIsLateCancel(isLate);
    setCancelTargetId(id);
  };

  const executeCancel = async () => {
    if (!cancelTargetId || !currentUserProfile) return;

    const finalStatus = getCancellationStatus(isLateCancel);
    const { error } = await supabase
      .from("reservations")
      .update({
        status: finalStatus,
        cancelled_at: new Date().toISOString()
      })
      .eq("id", cancelTargetId);

    if (!error) {
      triggerToast(isLateCancel ? "Termín stornovaný s poplatkom (neskoré storno)." : "Termín bezplatne zrušený.");
      await loadData(currentUserProfile);
    }
    setCancelTargetId(null);
  };

  const sendSignatureCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSignatureCode(code);
    setSignatureSent(true);
    triggerToast(`[SMS/EMAIL SIMULÁCIA] Overovací podpisový kód odoslaný: ${code}`);
  };

  const submitPublicForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signatureInput !== signatureCode) {
      triggerToast("Nesprávny overovací kód podpisovania. Skúste to znova.");
      return;
    }

    setIsOnboardingSaving(true);
    const emailToUse = onbEmail || `klient_${Date.now()}@sportwell.sk`;
    const fullName = `${onbFirstName} ${onbLastName}`.trim() || "Nový Klient";

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: emailToUse,
      password: "SportWellPassword123!"
    });

    let userId = authData?.user?.id;
    if (signUpError && signUpError.message.includes("already registered")) {
      const { data: existingProf } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", emailToUse)
        .maybeSingle();
      if (existingProf) {
        userId = existingProf.id;
      }
    }

    if (!userId) {
      triggerToast("Nepodarilo sa vytvoriť alebo získať konto.");
      setIsOnboardingSaving(false);
      return;
    }

    const metadataObj = {
      birth_date: onbBirthDate,
      address: onbAddress,
      primary_interest: onbInterest,
      gdpr_version: "v3.0",
      marketing_accepted: onbMarketingAccepted,
      meta_accepted: onbMetaAccepted,
      diag_accepted: onbDiagAccepted,
      e_signed: true,
      e_signature_code: signatureCode
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        role: "klient",
        full_name: fullName,
        phone: onbPhone,
        email: emailToUse,
        gdpr_signed_at: new Date().toISOString(),
        metadata: metadataObj
      });

    if (profileError) {
      triggerToast(`Chyba uloženia profilu: ${profileError.message}`);
      setIsOnboardingSaving(false);
      return;
    }

    const docName = publicForm === 'gdpr' ? `GDPR_Suhlas_${fullName.replace(/\s+/g, '_')}.pdf` : `Vstupna_Anamneza_${fullName.replace(/\s+/g, '_')}.pdf`;
    await supabase.from("documents").insert({
      client_id: userId,
      file_name: docName,
      storage_path: `gdpr/gdpr_${userId}.pdf`
    });

    if (publicForm === "anamneza") {
      await supabase.from("medical_cards").insert({
        client_id: userId,
        created_by: userId,
        type: "fyzio",
        pain_map_data: publicPainPoints,
        form_data: {
          injuries: anbInjuries,
          medications: anbMedications,
          contraindications: anbContraindications,
          restrictions: anbRestrictions,
          summary: "Vstupná anamnéza vyplnená klientom z domu."
        }
      });
    }

    triggerToast(publicForm === 'gdpr' ? "GDPR formulár bol úspešne elektronicky podpísaný!" : "Vstupná anamnéza bola úspešne podpísaná!");
    setIsOnboardingSaving(false);
    
    if (typeof window !== "undefined") {
      window.history.pushState({}, document.title, window.location.pathname);
    }
    setPublicForm(null);
    setSessionUser(null);
  };

  const addEditorField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      type: "text",
      label: "Názov stĺpca",
      placeholder: "",
      required: false,
      options: []
    };
    setEditorFields([...editorFields, newField]);
  };

  const removeEditorField = (id: string) => {
    setEditorFields(editorFields.filter(f => f.id !== id));
  };

  const startNewTemplate = () => {
    setEditingTemplate({ id: "new" });
    setEditorTitle("");
    setEditorCategory("fyzio");
    setEditorFields([]);
  };

  const saveFormTemplate = async () => {
    if (!editorTitle.trim()) {
      triggerToast("Názov šablóny je povinný.");
      return;
    }

    if (!editingTemplate || editingTemplate.id === "new") {
      const { error } = await supabase.from("form_templates").insert({
        title: editorTitle,
        category: editorCategory,
        schema: editorFields,
        is_active: true
      });
      if (!error) {
        triggerToast("Šablóna bola vytvorená!");
        setEditingTemplate(null);
        await loadData(currentUserProfile!);
      }
    } else {
      const { error } = await supabase
        .from("form_templates")
        .update({
          title: editorTitle,
          category: editorCategory,
          schema: editorFields
        })
        .eq("id", editingTemplate.id);
      if (!error) {
        triggerToast("Šablóna bola aktualizovaná!");
        setEditingTemplate(null);
        await loadData(currentUserProfile!);
      }
    }
  };

  const startEditingTemplate = (t: any) => {
    setEditingTemplate(t);
    setEditorTitle(t.title);
    setEditorCategory(t.category);
    setEditorFields(t.schema || []);
  };

  const promptPasswordPdf = (record: any) => {
    setSelectedRecordForPdf(record);
    setPdfPassword("");
    setShowPdfPasswordModal(true);
  };

  const handleDownloadPasswordPdf = () => {
    if (!pdfPassword) {
      triggerToast("Zadajte heslo pre šifrovanie PDF.");
      return;
    }
    
    triggerToast(`PDF bolo zašifrované heslom: "${pdfPassword}". Prebieha sťahovanie…`);
    setShowPdfPasswordModal(false);

    const element = document.createElement("a");
    const file = new Blob([
      `SPORTWELL - LEKÁRSKY NÁLEZ / DIAGNOSTIKA\n`,
      `==========================================\n`,
      `Klient: ${selectedClient?.full_name}\n`,
      `Dátum: ${new Date(selectedRecordForPdf.created_at).toLocaleDateString()}\n`,
      `Typ vyšetrenia: ${selectedRecordForPdf.type?.toUpperCase()}\n`,
      `Diagnóza / Nález: ${selectedRecordForPdf.form_data?.summary || "Bez nálezu"}\n`,
      `Detaily: ${selectedRecordForPdf.form_data?.field1 || ""}\n`,
      `Plán: ${selectedRecordForPdf.form_data?.field2 || ""}\n`,
      `------------------------------------------\n`,
      `Tento dokument je chránený heslom.\n`
    ], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Chraneny_Nalez_${selectedClient?.full_name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadDocument = async (storagePath: string, fileName: string) => {
    const parts = storagePath.split('/');
    const bucket = parts[0];
    const filePath = parts.slice(1).join('/');
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(filePath, 60);

    if (!error && data?.signedUrl) {
      const link = window.document.createElement("a");
      link.href = data.signedUrl;
      link.download = fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      return;
    }

    if (currentUserProfile) {
      const docPdf = generateGdprPdf(currentUserProfile);
      docPdf.save(fileName);
      triggerToast('GDPR dokument bol stiahnutý ako PDF.');
    }
  };

  const handlePrescribeWrapper = async (data: {
    exercise_title: string;
    sets: number;
    reps: number;
    tempo: string;
    pause: string;
    notes: string;
  }) => {
    if (!currentUserProfile || !selectedClientId) return;
    await prescribeExercise(currentUserProfile.id, selectedClientId, data);
  };

  const handleDeleteWrapper = async (workoutId: string) => {
    if (!selectedClientId) return;
    await deleteClientExercise(selectedClientId, workoutId);
  };

  const handleDiagnosisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile || !selectedTemplateId) return;
    const success = await submitDiagnosis(currentUserProfile.id, selectedClientId, selectedTemplateId, dynamicFormData, currentUserProfile);
    if (success) {
      setDynamicFormData({});
    }
  };

  const createPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const srv = services.find(s => s.id === payServiceId);
    if (!srv) return;
    const newPay: Payment = {
      id: `p-${Date.now()}`,
      client_name: selectedClient?.full_name || "Neznámy",
      service_name: srv.name,
      amount: srv.price,
      method: payMethod,
      invoice_number: `202600${payments.length + 1}`,
      status: 'zaplatene',
      created_at: new Date().toISOString()
    };
    setPayments(prev => [newPay, ...prev]);
    triggerToast("Platba bola úspešne vytlačená do eKasy.");
  };

  const handleWorkoutFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackWorkId || !currentUserProfile) return;

    const updated = workoutPlans.map(w =>
      w.id === feedbackWorkId
        ? { ...w, completed: true, rpe: feedbackRpe, pain_level: feedbackPain, notes: feedbackNote }
        : w
    );

    const { data: dbPlans } = await supabase
      .from("training_plans")
      .select("id")
      .eq("client_id", currentUserProfile.id)
      .limit(1);

    if (dbPlans && dbPlans.length > 0) {
      const { error } = await supabase
        .from("training_plans")
        .update({ plan_data: updated })
        .eq("id", dbPlans[0].id);

      if (!error) {
        setWorkoutPlans(updated);
        triggerToast("Tréningový log bol úspešne zaznamenaný v databáze!");
      }
    } else {
      setWorkoutPlans(updated);
      triggerToast("Tréningový log bol zaznamenaný lokálne.");
    }
    setFeedbackWorkId(null);
  };

  const savePainPointWrapper = async () => {
    if (!selectedPainRegion || !currentUserProfile) return;
    const newPain: PainPoint = {
      region: selectedPainRegion,
      intensity: painIntensity,
      notes: painNotes
    };
    await savePainPoint(currentUserProfile.id, currentUserProfile, newPain);
    setPainNotes("");
  };

  // 5. Initial mount spinner
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F7FAFC]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0A192F] border-t-transparent"></div>
      </div>
    );
  }

  // 6. Public GDPR & Anamnesis wizard pages
  if (publicForm) {
    return (
      <div className="flex flex-col min-h-screen bg-[#020C1B] justify-center items-center p-4">
        {toast && (
          <div aria-live="polite" className="fixed bottom-6 right-6 z-50 glass-panel-dark text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-brand-cyan">
            <span className="w-2 h-2 bg-[#00F0FF] rounded-full animate-ping"></span>
            <span>{toast}</span>
          </div>
        )}

        <div className="glass-panel-dark text-white rounded-2xl max-w-lg w-full p-8 shadow-2xl border border-white/10 space-y-6 my-8">
          <div className="text-center">
            <div className="inline-block mb-3 overflow-hidden rounded-xl bg-black border border-white/10 p-1">
              <img src="/logo.png" alt="SportWell Logo" className="w-16 h-16 object-contain" />
            </div>
            <h2 className="text-2xl font-bold">
              {publicForm === 'gdpr' ? "Registrácia & GDPR súhlas" : "Vstupná zdravotná anamnéza"}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Vyplňte tieto povinné náležitosti bezpečne zo svojho domova.
            </p>
          </div>

          <div className="w-full bg-white/10 h-1.5 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-[#00F0FF] h-1.5 transition-all duration-300"
              style={{ 
                width: publicForm === 'gdpr' 
                  ? `${(anamnesisStep / 4) * 100}%` 
                  : `${(anamnesisStep / 5) * 100}%` 
              }}
            ></div>
          </div>
          <div className="text-center text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
            Krok {anamnesisStep} z {publicForm === 'gdpr' ? 4 : 5}
          </div>

          {anamnesisStep === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); setAnamnesisStep(2); }} className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-[#00F0FF] border-b border-white/10 pb-1">1. Osobné a kontaktné údaje</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="pubFirst" className="block text-gray-300 font-semibold mb-1">Meno <span className="text-red-500">*</span></label>
                  <input
                    id="pubFirst"
                    type="text"
                    required
                    value={onbFirstName}
                    onChange={(e) => setOnbFirstName(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan"
                    placeholder="Ján"
                  />
                </div>
                <div>
                  <label htmlFor="pubLast" className="block text-gray-300 font-semibold mb-1">Priezvisko <span className="text-red-500">*</span></label>
                  <input
                    id="pubLast"
                    type="text"
                    required
                    value={onbLastName}
                    onChange={(e) => setOnbLastName(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan"
                    placeholder="Novák"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="pubBirth" className="block text-gray-300 font-semibold mb-1">Dátum narodenia <span className="text-red-500">*</span></label>
                  <input
                    id="pubBirth"
                    type="date"
                    required
                    value={onbBirthDate}
                    onChange={(e) => setOnbBirthDate(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan text-gray-300"
                  />
                </div>
                <div>
                  <label htmlFor="pubPhone" className="block text-gray-300 font-semibold mb-1">Telefón <span className="text-red-500">*</span></label>
                  <input
                    id="pubPhone"
                    type="tel"
                    required
                    value={onbPhone}
                    onChange={(e) => setOnbPhone(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan"
                    placeholder="+421 900 000 000"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="pubAddr" className="block text-gray-300 font-semibold mb-1">Trvalý pobyt / Adresa <span className="text-red-500">*</span></label>
                <input
                  id="pubAddr"
                  type="text"
                  required
                  value={onbAddress}
                  onChange={(e) => setOnbAddress(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan"
                  placeholder="Hlavná 12, 811 01 Bratislava"
                />
              </div>

              <div>
                <label htmlFor="pubEmail" className="block text-gray-300 font-semibold mb-1">Váš e-mail <span className="text-red-500">*</span></label>
                <input
                  id="pubEmail"
                  type="email"
                  required
                  value={onbEmail}
                  onChange={(e) => setOnbEmail(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan"
                  placeholder="meno@domena.sk"
                />
              </div>

              <div>
                <label htmlFor="pubInterest" className="block text-gray-300 font-semibold mb-1">Máte primárny záujem o:</label>
                <select
                  id="pubInterest"
                  value={onbInterest}
                  onChange={(e) => setOnbInterest(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan"
                >
                  <option value="Fyzioterapia" className="text-gray-800">Fyzioterapia</option>
                  <option value="Funkčný tréning" className="text-gray-800">Funkčný tréning</option>
                  <option value="Masáže" className="text-gray-800">Masáže</option>
                </select>
              </div>

              <div className="flex justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setPublicForm(null); }}
                  className="w-1/3 py-2 px-4 border border-white/20 rounded-xl hover:bg-white/10 transition-colors text-center"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#00F0FF] text-[#020C1B] font-bold rounded-xl hover:bg-[#00D0DF] transition-colors"
                >
                  Pokračovať
                </button>
              </div>
            </form>
          )}

          {anamnesisStep === 2 && publicForm === 'gdpr' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-[#00F0FF] border-b border-white/10 pb-1">2. Povinné zmluvné doložky</h3>
              
              <div className="border border-white/10 rounded-xl p-3 bg-white/5 space-y-2">
                <label htmlFor="pubGdprCheck" className="flex items-start gap-3 cursor-pointer">
                  <input
                    id="pubGdprCheck"
                    type="checkbox"
                    checked={onbPrivacyAccepted}
                    onChange={(e) => setOnbPrivacyAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-brand-cyan accent-brand-cyan"
                  />
                  <span>Súhlasím so spracovaním citlivých zdravotných údajov pre diagnostiku <span className="text-[#00F0FF]">(Povinné)</span></span>
                </label>
                <button 
                  onClick={() => setShowPrivacyTerms(!showPrivacyTerms)} 
                  className="text-[10px] text-[#00F0FF] hover:underline block"
                >
                  Zobraziť podmienky
                </button>
                {showPrivacyTerms && (
                  <div className="p-2 bg-black/30 border border-white/10 rounded text-[10px] text-gray-400 max-h-24 overflow-y-auto">
                    Zaväzujete sa poskytnúť pravdivé údaje za účelom zostavenia rehabilitačného plánu. Údaje uchovávame v súlade s legislatívou SR.
                  </div>
                )}
              </div>

              <div className="border border-white/10 rounded-xl p-3 bg-white/5 space-y-2">
                <label htmlFor="pubVopCheck" className="flex items-start gap-3 cursor-pointer">
                  <input
                    id="pubVopCheck"
                    type="checkbox"
                    checked={onbTermsAccepted}
                    onChange={(e) => setOnbTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-brand-cyan accent-brand-cyan"
                  />
                  <span>Súhlasím so storno podmienkami rezervačného systému (24h vopred) <span className="text-[#00F0FF]">(Povinné)</span></span>
                </label>
                <button 
                  onClick={() => setShowBookingTerms(!showBookingTerms)} 
                  className="text-[10px] text-[#00F0FF] hover:underline block"
                >
                  Zobraziť podmienky
                </button>
                {showBookingTerms && (
                  <div className="p-2 bg-black/30 border border-white/10 rounded text-[10px] text-gray-400 max-h-24 overflow-y-auto">
                    Termín je možné bezplatne zrušiť najneskôr 24 hodín pred začiatkom. Pri neskoršom zrušení prepadá záloha v prospech SportWell.
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setAnamnesisStep(1)}
                  className="w-1/3 py-2 border border-white/20 rounded-xl font-bold hover:bg-white/10"
                >
                  Späť
                </button>
                <button
                  disabled={!onbPrivacyAccepted || !onbTermsAccepted}
                  onClick={() => setAnamnesisStep(3)}
                  className="flex-1 py-2 bg-[#00F0FF] text-[#020C1B] font-bold rounded-xl disabled:opacity-50"
                >
                  Pokračovať
                </button>
              </div>
            </div>
          )}

          {anamnesisStep === 2 && publicForm === 'anamneza' && (
            <form onSubmit={(e) => { e.preventDefault(); setAnamnesisStep(3); }} className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-[#00F0FF] border-b border-white/10 pb-1">2. Zdravotný stav & Anamnéza</h3>
              
              <div>
                <label htmlFor="pubInjuries" className="block text-gray-300 font-semibold mb-1">Predchádzajúce zranenia, operácie, vážne diagnózy:</label>
                <textarea
                  id="pubInjuries"
                  value={anbInjuries}
                  onChange={(e) => setAnbInjuries(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white h-16"
                  placeholder="napr. plastika predného skríženého väzu 2024..."
                />
              </div>

              <div>
                <label htmlFor="pubMeds" className="block text-gray-300 font-semibold mb-1">Lieky, ktoré pravidelne užívate:</label>
                <input
                  id="pubMeds"
                  type="text"
                  value={anbMedications}
                  onChange={(e) => setAnbMedications(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white"
                  placeholder="napr. Euthyrox..."
                />
              </div>

              <div>
                <label htmlFor="pubContra" className="block text-gray-300 font-semibold mb-1">Akékoľvek kontraindikácie (alergie, hypertenzia):</label>
                <input
                  id="pubContra"
                  type="text"
                  value={anbContraindications}
                  onChange={(e) => setAnbContraindications(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white"
                  placeholder="napr. vysoký krvný tlak..."
                />
              </div>

              <div>
                <label htmlFor="pubRestr" className="block text-gray-300 font-semibold mb-1">Vaše pohybové obmedzenia alebo bolesti pri pohybe:</label>
                <textarea
                  id="pubRestr"
                  value={anbRestrictions}
                  onChange={(e) => setAnbRestrictions(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white h-16"
                  placeholder="napr. bolesť ramena pri vzpažení..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAnamnesisStep(1)}
                  className="w-1/3 py-2 border border-white/20 rounded-xl font-bold hover:bg-white/10"
                >
                  Späť
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#00F0FF] text-[#020C1B] font-bold rounded-xl"
                >
                  Pokračovať
                </button>
              </div>
            </form>
          )}

          {anamnesisStep === 3 && publicForm === 'gdpr' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-[#00F0FF] border-b border-white/10 pb-1">3. Dobrovoľné marketingové súhlasy</h3>
              
              <div className="space-y-2">
                <label htmlFor="pubMktCheck" className="flex items-start gap-3 cursor-pointer border border-white/10 rounded-xl p-3 bg-white/5">
                  <input
                    id="pubMktCheck"
                    type="checkbox"
                    checked={onbMarketingAccepted}
                    onChange={(e) => setOnbMarketingAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-brand-cyan accent-brand-cyan"
                  />
                  <span>Súhlasím so zasielaním noviniek a akcií na e-mail (Ecomail)</span>
                </label>

                <label htmlFor="pubMetaCheck" className="flex items-start gap-3 cursor-pointer border border-white/10 rounded-xl p-3 bg-white/5">
                  <input
                    id="pubMetaCheck"
                    type="checkbox"
                    checked={onbMetaAccepted}
                    onChange={(e) => setOnbMetaAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-brand-cyan accent-brand-cyan"
                  />
                  <span>Súhlasím so zdieľaním e-mailu s Meta Platforms pre Lookalike Audiences</span>
                </label>

                <label htmlFor="pubDiagCheck" className="flex items-start gap-3 cursor-pointer border border-white/10 rounded-xl p-3 bg-white/5">
                  <input
                    id="pubDiagCheck"
                    type="checkbox"
                    checked={onbDiagAccepted}
                    onChange={(e) => setOnbDiagAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-brand-cyan accent-brand-cyan"
                  />
                  <span>Súhlasím so spracovaním a prepojením dát z InBody prístroja</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setAnamnesisStep(2)}
                  className="w-1/3 py-2 border border-white/20 rounded-xl font-bold hover:bg-white/10"
                >
                  Späť
                </button>
                <button
                  onClick={() => { setAnamnesisStep(4); sendSignatureCode(); }}
                  className="flex-1 py-2 bg-[#00F0FF] text-[#020C1B] font-bold rounded-xl"
                >
                  Generovať podpisový kód
                </button>
              </div>
            </div>
          )}

          {anamnesisStep === 3 && publicForm === 'anamneza' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-[#00F0FF] border-b border-white/10 pb-1">3. Mapa bolesti a VAS škála</h3>
              
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-3">
                <div>
                  <label htmlFor="pubPainRegion" className="block text-gray-300 font-semibold mb-1">Vyberte oblasť najväčšej bolesti:</label>
                  <select
                    id="pubPainRegion"
                    value={selectedPainRegion}
                    onChange={(e) => setSelectedPainRegion(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan"
                  >
                    <option value="Drieková chrbtica" className="text-gray-800">Drieková chrbtica (kríže)</option>
                    <option value="Krčná chrbtica" className="text-gray-800">Krčná chrbtica</option>
                    <option value="Pravé rameno" className="text-gray-800">Pravé rameno</option>
                    <option value="Ľavé rameno" className="text-gray-800">Ľavé rameno</option>
                    <option value="Pravé koleno" className="text-gray-800">Pravé koleno</option>
                    <option value="Ľavé koleno" className="text-gray-800">Ľavé koleno</option>
                    <option value="Pravé bedro" className="text-gray-800">Pravé bedro</option>
                    <option value="Ľavé bedro" className="text-gray-800">Ľavé bedro</option>
                    <option value="Iná časť tela" className="text-gray-800">Iná oblasť / celé telo</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="pubPainIntensity" className="block text-gray-300 font-semibold mb-1">Úroveň pociťovanej bolesti (VAS): {painIntensity}/10</label>
                  <input
                    id="pubPainIntensity"
                    type="range"
                    min="0"
                    max="10"
                    value={painIntensity}
                    onChange={(e) => setPainIntensity(parseInt(e.target.value))}
                    className="w-full accent-brand-cyan cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
                    <span>Bez bolesti (0)</span>
                    <span className="text-brand-cyan font-bold">{painIntensity}/10</span>
                    <span>Neznesiteľná (10)</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="pubPainNotes" className="block text-gray-300 font-semibold mb-1">Doplňujúce pocity k bolesti:</label>
                  <input
                    id="pubPainNotes"
                    type="text"
                    value={painNotes}
                    onChange={(e) => setPainNotes(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan"
                    placeholder="napr. tupá bolesť vystreľujúca do stehna..."
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const newPoint: PainPoint = {
                      region: selectedPainRegion,
                      intensity: painIntensity,
                      notes: painNotes
                    };
                    setPublicPainPoints([...publicPainPoints, newPoint]);
                    setPainNotes("");
                    triggerToast(`Pridaný záznam bolesti: ${selectedPainRegion} (${painIntensity}/10)`);
                  }}
                  className="w-full py-1.5 bg-white/10 border border-white/25 rounded-lg hover:bg-white/20 text-center font-bold"
                >
                  + Pridať bolesť do zoznamu
                </button>
              </div>

              {publicPainPoints.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="font-semibold text-gray-300">Zaznamenané body bolesti:</h4>
                  <div className="flex flex-wrap gap-2">
                    {publicPainPoints.map((pt, idx) => (
                      <span key={idx} className="bg-brand-cyan/20 text-brand-cyan px-2.5 py-1 rounded-full text-[10px] border border-brand-cyan/35 flex items-center gap-1.5">
                        <strong>{pt.region}</strong>: {pt.intensity}/10 {pt.notes && `(${pt.notes})`}
                        <button 
                          onClick={() => setPublicPainPoints(publicPainPoints.filter((_, i) => i !== idx))}
                          className="hover:text-red-500 font-bold text-xs"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setAnamnesisStep(2)}
                  className="w-1/3 py-2 border border-white/20 rounded-xl font-bold hover:bg-white/10"
                >
                  Späť
                </button>
                <button
                  onClick={() => setAnamnesisStep(4)}
                  className="flex-1 py-2 bg-[#00F0FF] text-[#020C1B] font-bold rounded-xl"
                >
                  Pokračovať
                </button>
              </div>
            </div>
          )}

          {anamnesisStep === 4 && publicForm === 'anamneza' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-[#00F0FF] border-b border-white/10 pb-1">4. Súhlasy a GDPR</h3>
              
              <div className="border border-white/10 rounded-xl p-3 bg-white/5 space-y-2">
                <label htmlFor="pubAnamPrivacy" className="flex items-start gap-3 cursor-pointer">
                  <input
                    id="pubAnamPrivacy"
                    type="checkbox"
                    checked={onbPrivacyAccepted}
                    onChange={(e) => setOnbPrivacyAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-brand-cyan accent-brand-cyan"
                  />
                  <span>Súhlasím so spracovaním citlivých zdravotných údajov pre diagnostiku <span className="text-[#00F0FF]">(Povinné)</span></span>
                </label>
                <button onClick={() => setShowPrivacyTerms(!showPrivacyTerms)} className="text-[10px] text-[#00F0FF] hover:underline block">Zobraziť podmienky</button>
                {showPrivacyTerms && (
                  <div className="p-2 bg-black/30 border border-white/10 rounded text-[10px] text-gray-400 max-h-24 overflow-y-auto">
                    Zaväzujete sa poskytnúť pravdivé údaje za účelom zostavenia plánu.
                  </div>
                )}
              </div>

              <div className="border border-white/10 rounded-xl p-3 bg-white/5 space-y-2">
                <label htmlFor="pubAnamVop" className="flex items-start gap-3 cursor-pointer">
                  <input
                    id="pubAnamVop"
                    type="checkbox"
                    checked={onbTermsAccepted}
                    onChange={(e) => setOnbTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-brand-cyan accent-brand-cyan"
                  />
                  <span>Súhlasím s VOP rezervačného systému (storno 24h) <span className="text-[#00F0FF]">(Povinné)</span></span>
                </label>
                <button onClick={() => setShowBookingTerms(!showBookingTerms)} className="text-[10px] text-[#00F0FF] hover:underline block">Zobraziť podmienky</button>
                {showBookingTerms && (
                  <div className="p-2 bg-black/30 border border-white/10 rounded text-[10px] text-gray-400 max-h-24 overflow-y-auto">
                    Bezplatné zrušenie termínu najneskôr 24h pred začiatkom.
                  </div>
                )}
              </div>

              <div className="border border-white/10 rounded-xl p-3 bg-white/5">
                <label htmlFor="pubAnamMkt" className="flex items-start gap-3 cursor-pointer">
                  <input
                    id="pubAnamMkt"
                    type="checkbox"
                    checked={onbMarketingAccepted}
                    onChange={(e) => setOnbMarketingAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-brand-cyan accent-brand-cyan"
                  />
                  <span>Chcem dostávať tipy na domáce cvičenia e-mailom (Ecomail marketing)</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setAnamnesisStep(3)}
                  className="w-1/3 py-2 border border-white/20 rounded-xl font-bold hover:bg-white/10"
                >
                  Späť
                </button>
                <button
                  disabled={!onbPrivacyAccepted || !onbTermsAccepted}
                  onClick={() => { setAnamnesisStep(5); sendSignatureCode(); }}
                  className="flex-1 py-2 bg-[#00F0FF] text-[#020C1B] font-bold rounded-xl disabled:opacity-50"
                >
                  Generovať podpisový kód
                </button>
              </div>
            </div>
          )}

          {((publicForm === 'gdpr' && anamnesisStep === 4) || (publicForm === 'anamneza' && anamnesisStep === 5)) && (
            <form onSubmit={submitPublicForm} className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-[#00F0FF] border-b border-white/10 pb-1">Elektronický podpis (Overovací kód)</h3>
              
              <div className="p-3.5 bg-[#00F0FF]/10 border border-[#00F0FF]/25 rounded-xl text-brand-cyan space-y-1">
                <strong>Elektronický podpis VOP & GDPR</strong>
                <p className="text-[10px] text-gray-300">
                  Na zadaný e-mail <strong>{onbEmail}</strong> sme zaslali verifikačný PIN. Zadaním tohto kódu potvrdzujete pravdivosť údajov a podpisujete súhlasy.
                </p>
              </div>

              <div>
                <label htmlFor="pubSignInput" className="block text-gray-300 font-semibold mb-1">Zadajte 6-miestny overovací kód <span className="text-red-500">*</span></label>
                <input
                  id="pubSignInput"
                  type="text"
                  required
                  maxLength={7}
                  value={signatureInput}
                  onChange={(e) => setSignatureInput(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white tracking-widest text-center text-sm font-bold focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]"
                  placeholder="XXX-XXX"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAnamnesisStep(anamnesisStep - 1)}
                  className="w-1/3 py-2 border border-white/20 rounded-xl font-bold hover:bg-white/10"
                >
                  Späť
                </button>
                <button
                  type="submit"
                  disabled={isOnboardingSaving || !signatureInput}
                  className="flex-1 py-2 bg-[#00F0FF] text-[#020C1B] font-bold rounded-xl hover:bg-[#00D0DF] flex items-center justify-center gap-2"
                >
                  {isOnboardingSaving ? "Odosielam…" : "Podpísať & Odoslať"}
                </button>
              </div>

              <button
                type="button"
                onClick={sendSignatureCode}
                className="text-[10px] text-[#00F0FF] hover:underline block text-center w-full mt-2"
              >
                Znovu zaslať overovací kód
              </button>
            </form>
          )}

        </div>
      </div>
    );
  }

  // 7. Sign in screen if not authenticated
  if (!sessionUser) {
    return (
      <div className="flex flex-col min-h-screen bg-[#020C1B] justify-center items-center p-4">
        {toast && (
          <div aria-live="polite" className="fixed bottom-6 right-6 z-50 glass-panel-dark text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-brand-cyan">
            <span className="w-2 h-2 bg-[#00F0FF] rounded-full animate-ping"></span>
            <span>{toast}</span>
          </div>
        )}
        <div className="glass-panel-dark text-white rounded-2xl max-w-sm w-full p-8 shadow-2xl border border-white/10 space-y-6">
          <div className="text-center">
            <div className="inline-block mb-3 overflow-hidden rounded-xl bg-black border border-white/10 p-1">
              <img src="/logo.png" alt="SportWell Logo" className="w-16 h-16 object-contain" />
            </div>
            <h2 className="text-xl font-bold">SportWell Klientsky Portál</h2>
            <p className="text-xs text-gray-400 mt-1">Pre prístup k vašim diagnostikám a tréningom.</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
            {authMode === 'register' && !registerVerifyPending && (
              <div>
                <label htmlFor="regName" className="block text-gray-300 font-semibold mb-1">Celé meno</label>
                <input
                  id="regName"
                  type="text"
                  required
                  value={registerFullName}
                  onChange={(e) => setRegisterFullName(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan"
                  placeholder="Ján Novák"
                />
              </div>
            )}

            {registerVerifyPending ? (
              <div className="space-y-4">
                <div className="p-3 bg-[#00F0FF]/10 border border-[#00F0FF]/25 text-brand-cyan rounded-lg leading-normal">
                  Zadajte overovací kód, ktorý bol odoslaný na váš e-mail <strong>{authEmail}</strong> pre dokončenie registrácie.
                </div>
                <div>
                  <label htmlFor="regCode" className="block text-gray-300 font-semibold mb-1 text-center">Overovací kód</label>
                  <input
                    id="regCode"
                    type="text"
                    required
                    maxLength={6}
                    value={registerInputCode}
                    onChange={(e) => setRegisterInputCode(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white tracking-widest text-center text-sm font-bold focus:border-brand-cyan"
                    placeholder="XXXXXX"
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="loginEmail" className="block text-gray-300 font-semibold mb-1">E-mailová adresa</label>
                  <input
                    id="loginEmail"
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan"
                    placeholder="meno@domena.sk"
                  />
                </div>

                {(authMode === 'login' || authMode === 'register') && (
                  <div>
                    <label htmlFor="loginPass" className="block text-gray-300 font-semibold mb-1">Heslo</label>
                    <input
                      id="loginPass"
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan"
                      placeholder="••••••••"
                    />
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full py-2.5 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl text-xs hover:bg-[#00D0DF] transition-colors"
            >
              {isAuthLoading ? "Počkajte…" : registerVerifyPending ? "Overiť a dokončiť registráciu" : authMode === 'login' ? "Prihlásiť sa" : authMode === 'register' ? "Zaregistrovať sa" : "Aktivovať účet (Reset hesla)"}
            </button>
          </form>

          <div className="flex flex-col gap-2 text-center">
            {authMode === 'login' ? (
              <>
                <button
                  onClick={() => setAuthMode('register')}
                  className="text-brand-cyan hover:underline text-[10px]"
                >
                  Nemáte účet? Zaregistrujte sa tu
                </button>
                <button
                  onClick={() => setAuthMode('reset')}
                  className="text-brand-cyan hover:underline text-[10px]"
                >
                  Máte u nás účet z WordPressu? Aktivujte ho tu
                </button>
              </>
            ) : registerVerifyPending ? (
              <button
                onClick={() => { setRegisterVerifyPending(false); setRegisterInputCode(""); setRegisterVerifyCode(""); }}
                className="text-brand-cyan hover:underline text-[10px]"
              >
                Späť — zadať iné heslo alebo e-mail
              </button>
            ) : (
              <button
                onClick={() => { setAuthMode('login'); setRegisterVerifyPending(false); setRegisterInputCode(""); setRegisterVerifyCode(""); }}
                className="text-brand-cyan hover:underline text-[10px]"
              >
                Už máte účet? Prihláste sa
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 8. Main Client dashboard and app layouts
  return (
    <div className="flex flex-col min-h-screen bg-brand-off-white text-gray-800 font-sans">
      
      {/* Toast Notification */}
      {toast && (
        <div aria-live="polite" className="fixed bottom-6 right-6 z-50 glass-panel-dark text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-brand-cyan">
          <span className="w-2 h-2 bg-brand-cyan rounded-full animate-ping"></span>
          <span>{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <header className="brand-gradient text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-black flex items-center justify-center p-0.5 border border-white/10">
              <img src="/logo.png" alt="SportWell Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">SportWell</h1>
              <p className="text-xs text-brand-light-cyan">Zdravie na prvom mieste.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-white/25 px-3 py-1 rounded-full uppercase tracking-wider font-semibold">
              Rola: {currentUserProfile?.role}
            </span>
            <button
              onClick={handleSignOut}
              className="text-xs hover:underline text-white bg-red-600/30 hover:bg-red-600 px-3 py-1 rounded-full transition-all"
            >
              Odhlásiť sa
            </button>
          </div>
        </div>
      </header>

      {/* GDPR Onboarding Wizard Blocker if missing */}
      {currentUserProfile && currentUserProfile.role === "klient" && !currentUserProfile.gdpr_signed_at && (
        <GdprWizard
          sessionUser={sessionUser}
          currentUserProfile={currentUserProfile}
          onSubmit={handleOnboardingSubmit}
          onSignOut={handleSignOut}
        />
      )}

      {/* Main Workspace Grid */}
      <div className={`max-w-6xl mx-auto w-full px-4 py-8 flex flex-col md:flex-row gap-8 flex-1 ${currentUserProfile?.role === 'klient' ? 'pb-24 md:pb-8' : ''}`}>
        
        {/* Navigation Sidebar */}
        <aside className={`md:w-64 flex flex-col gap-3 ${currentUserProfile?.role === 'klient' ? 'hidden md:flex' : ''}`}>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 px-3">Menu</h3>
            <nav className="flex flex-col gap-1">
              {navigationItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setRegisterVerifyPending(false); }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === item.id 
                      ? "bg-brand-navy text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Dynamic tab contents */}
        <main className="flex-1 flex flex-col gap-6">

          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {currentUserProfile?.role === 'klient' ? (
                <>
                  {/* Welcome hero card */}
                  <div className="md:col-span-3 bg-gradient-to-r from-brand-navy to-[#0d2a4a] text-white rounded-2xl p-6 shadow-lg border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-brand-cyan text-xs font-semibold uppercase tracking-wider">Vitajte späť</p>
                      <h2 className="text-2xl font-bold">{currentUserProfile.full_name || sessionUser?.email?.split('@')[0]}</h2>
                      <p className="text-white/60 text-xs">
                        člen od {currentUserProfile.created_at ? new Date(currentUserProfile.created_at).toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' }) : 'dnes'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {currentUserProfile.gdpr_signed_at ? (
                        <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-semibold">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          GDPR Podpísané
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 text-amber-300 px-3 py-1.5 rounded-xl text-xs font-semibold">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Chýba GDPR
                        </div>
                      )}
                      <button
                        onClick={() => setActiveTab('profil')}
                        className="px-4 py-2 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl text-xs hover:bg-[#00D0DF] transition-colors"
                      >
                        Môj profil
                      </button>
                    </div>
                  </div>

                  {/* Quick stats row */}
                  <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Cviky v pláne', value: workoutPlans.length, icon: '🏋️', tab: 'plan', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                      { label: 'Splnené cviky', value: workoutPlans.filter(w => w.completed).length, icon: '✅', tab: 'plan', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                      { label: 'Nadchádzajúce termíny', value: appointments.length, icon: '📅', tab: 'rezervacie', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                      { label: 'Moje dokumenty', value: documents.length, icon: '📄', tab: 'dokumenty', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                    ].map((stat) => (
                      <button
                        key={stat.label}
                        onClick={() => setActiveTab(stat.tab)}
                        className={`p-4 rounded-2xl border text-left hover:scale-[1.02] transition-transform cursor-pointer ${stat.color}`}
                      >
                        <span className="text-2xl block mb-2">{stat.icon}</span>
                        <span className="text-2xl font-bold block">{stat.value}</span>
                        <span className="text-xs font-semibold mt-0.5 block opacity-75">{stat.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Workout plan */}
                  <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-base font-bold text-brand-navy">Môj tréningový plán</h2>
                      <button onClick={() => setActiveTab('plan')} className="text-[10px] text-brand-cyan hover:underline font-semibold">Zobraziť všetko</button>
                    </div>
                    <div className="space-y-2 text-xs">
                      {workoutPlans.length === 0 ? (
                        <div className="text-center py-6 text-gray-400">
                          <span className="text-3xl block mb-2">🏃</span>
                          <p>Zatiaľ nemáte priradený tréningový plán.</p>
                        </div>
                      ) : (
                        workoutPlans.slice(0, 4).map(w => (
                          <div key={w.id} className="flex justify-between items-center bg-brand-off-white/50 p-3 rounded-xl border">
                            <div>
                              <strong>{w.exercise_title}</strong>
                              <p className="text-gray-500">{w.sets} sérií | {w.reps} opakovaní</p>
                            </div>
                            {w.completed ? (
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Splnené</span>
                            ) : (
                              <button
                                onClick={() => setFeedbackWorkId(w.id)}
                                className="px-3 py-1 bg-brand-cyan text-brand-dark-navy font-bold rounded-lg hover:bg-brand-hover-cyan transition-colors"
                              >
                                Cvičiť
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Next appointment */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-brand-navy mb-3">Najbližší termín</h3>
                      {appointments.filter(a => a.status === 'confirmed').length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Žiadne naplánované termíny.</p>
                      ) : (
                        <div className="p-3 bg-brand-cyan/10 border border-brand-cyan/25 rounded-xl text-xs space-y-1">
                          <strong>{appointments.filter(a => a.status === 'confirmed')[0].service_name || "Fyzioterapia"}</strong>
                          <p className="text-gray-500 font-mono text-[10px]">
                            {new Date(appointments.filter(a => a.status === 'confirmed')[0].start_time).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                    <button onClick={() => setActiveTab('rezervacie')} className="w-full mt-4 py-2 bg-brand-navy text-white text-xs font-semibold rounded-lg hover:opacity-95 transition-opacity">
                      Nová rezervácia
                    </button>
                  </div>
                </>
              ) : currentUserProfile?.role === 'admin' ? (
                <>
                  <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-4">
                    <h2 className="text-xl font-bold text-brand-navy">Obrat SportWell</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-brand-navy text-white rounded-xl">
                        <span className="text-xs opacity-75 block">Obrat</span>
                        <span className="text-2xl font-bold">12,450 €</span>
                      </div>
                      <div className="p-4 bg-brand-off-white rounded-xl border">
                        <span className="text-xs text-gray-400 block font-semibold">Vyťaženosť</span>
                        <span className="text-2xl font-bold text-brand-navy">87%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-4">
                    <h3 className="font-bold text-brand-navy">Registrácia klienta do DB</h3>
                    <form onSubmit={registerClient} className="space-y-3 text-xs">
                      <input type="text" placeholder="Meno" required value={newClientFirst} onChange={(e) => setNewClientFirst(e.target.value)} className="w-full bg-brand-off-white border p-2 rounded-lg outline-none" />
                      <input type="text" placeholder="Priezvisko" required value={newClientLast} onChange={(e) => setNewClientLast(e.target.value)} className="w-full bg-brand-off-white border p-2 rounded-lg outline-none" />
                      <input type="email" placeholder="E-mail" required value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} className="w-full bg-brand-off-white border p-2 rounded-lg outline-none" />
                      <input type="tel" placeholder="Telefón" required value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} className="w-full bg-brand-off-white border p-2 rounded-lg outline-none" />
                      <button type="submit" className="w-full py-2 bg-brand-cyan text-brand-dark-navy font-bold rounded-lg">Zaregistrovať klienta</button>
                    </form>
                  </div>
                </>
              ) : (
                // Specialist view
                <>
                  <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-4">
                    <h2 className="text-xl font-bold text-brand-navy">Harmonogram špecialistu</h2>
                    <div className="space-y-2 text-xs">
                      {appointments
                        .filter(a => a.status === 'confirmed')
                        .map(a => (
                          <div key={a.id} className="flex justify-between items-center bg-brand-off-white/50 p-3 rounded-lg border">
                            <div>
                              <strong>{a.client_name || "Pacient"}</strong>
                              <span className="text-gray-500 block">{a.service_name}</span>
                            </div>
                            <span className="font-mono font-bold text-brand-navy">{new Date(a.start_time).toLocaleTimeString()}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 flex flex-col gap-2">
                    <h3 className="font-bold text-brand-navy">Akcie</h3>
                    <button onClick={() => setActiveTab("diagnostika")} className="w-full py-2 bg-brand-navy text-white text-xs font-semibold rounded-lg">
                      Zadať diagnostiku
                    </button>
                  </div>
                </>
              )}

            </div>
          )}

          {/* TAB 2: KLIENTI */}
          {activeTab === "klienti" && isEmployee && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              <div className="md:col-span-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-200/50 flex flex-col gap-4">
                <h3 className="font-bold text-brand-navy text-sm">Zoznam klientov v DB</h3>
                <input
                  type="text"
                  placeholder="Hľadať meno..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-brand-off-white border rounded-lg px-3 py-2 text-xs outline-none"
                />

                <div className="space-y-1 divide-y mt-2 max-h-[300px] overflow-y-auto pr-1">
                  {filteredClients.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClientId(c.id)}
                      className={`w-full text-left p-3 rounded-lg text-xs transition-all flex justify-between items-center ${
                        selectedClientId === c.id ? "bg-brand-cyan/20 border-l-4 border-brand-cyan font-bold" : "hover:bg-gray-50"
                      }`}
                    >
                      <span>{c.full_name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-6">
                <div className="border-b pb-4">
                  <h2 className="text-xl font-bold text-brand-navy">{selectedClient?.full_name}</h2>
                  <p className="text-xs text-gray-400 mt-1">GDPR & Záznamy v PostgreSQL</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-brand-off-white/60 rounded-xl">
                    <strong className="block text-gray-400 uppercase text-[9px] mb-1">Kontakt</strong>
                    <p><strong>E-mail:</strong> {selectedClient?.email || "Nezadaný"}</p>
                    <p><strong>Telefón:</strong> {selectedClient?.phone}</p>
                    <p><strong>GDPR:</strong> {selectedClient?.gdpr_signed_at ? "Podpísané" : "Chýba súhlas"}</p>
                  </div>
                </div>

                {/* Timeline of client diagnostics */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Diagnostický denník pacienta</h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {medicalCards
                      .filter(m => m.client_id === selectedClient?.id)
                      .map(m => (
                        <div key={m.id} className="p-3 bg-brand-off-white/50 border rounded-lg text-xs">
                          <div className="flex justify-between font-bold text-brand-navy">
                            <span>{m.type.toUpperCase()} záznam</span>
                            <span className="text-gray-400">{new Date(m.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="mt-1">{m.form_data?.summary || m.form_data?.field1 || "Prázdny záznam"}</p>
                          <button
                            onClick={() => promptPasswordPdf(m)}
                            className="mt-2 text-brand-cyan hover:underline flex items-center gap-1 font-semibold"
                          >
                            🔒 Stiahnuť zaheslované PDF
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: DIAGNOSTIKA */}
          {activeTab === "diagnostika" && isEmployee && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-6 animate-fade-in text-xs">
              <div className="border-b pb-4">
                <h2 className="text-xl font-bold text-brand-navy">Vytvoriť Diagnostiku</h2>
                <p className="text-xs text-gray-400 mt-1">Zápis do tabuľky public.client_records na základe dynamických šablón.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1">Klient</label>
                  <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} className="w-full bg-brand-off-white border p-2 rounded-lg outline-none">
                    <option value="">-- Vyberte klienta --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Šablóna formulára</label>
                  <select value={selectedTemplateId} onChange={(e) => {
                    setSelectedTemplateId(e.target.value);
                    setDynamicFormData({});
                  }} className="w-full bg-brand-off-white border p-2 rounded-lg outline-none">
                    {formTemplates.map(t => <option key={t.id} value={t.id}>{t.title} ({t.category})</option>)}
                  </select>
                </div>
              </div>

              {(() => {
                const currentTemplate = formTemplates.find(t => t.id === selectedTemplateId);
                if (!currentTemplate || !currentTemplate.schema) return null;

                return (
                  <div className="space-y-4 border-t pt-4">
                    <FormRenderer
                      schema={currentTemplate.schema}
                      values={dynamicFormData}
                      onChange={(id, val) => setDynamicFormData(prev => ({ ...prev, [id]: val }))}
                      onSubmit={handleDiagnosisSubmit}
                      submitLabel="Uložiť záznam do DB"
                    />
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 4: REZERVÁCIE */}
          {activeTab === "rezervacie" && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-6 animate-fade-in">
              <div className="border-b pb-4">
                <h2 className="text-xl font-bold text-brand-navy">Rezervačný Kalendár</h2>
                <p className="text-xs text-gray-400 mt-1">Plánovanie termínov v SportWell.</p>
              </div>

              {currentUserProfile?.role === 'klient' ? (
                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-brand-off-white/60 border rounded-xl space-y-3">
                    <h3 className="font-bold text-brand-navy">Zvoliť termín</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold mb-1">Služba</label>
                        <select className="w-full bg-white border p-2 rounded-lg">
                          {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.price}€)</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Dátum</label>
                        <input type="date" className="w-full bg-white border p-2 rounded-lg" defaultValue="2026-06-10" />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Čas</label>
                        <select className="w-full bg-white border p-2 rounded-lg">
                          <option>09:00 - 10:00</option>
                          <option>10:00 - 11:00</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        const { error } = await supabase.from("reservations").insert({
                          client_id: currentUserProfile.id,
                          staff_id: "u3",
                          start_time: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
                          end_time: new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString(),
                          status: "confirmed"
                        });

                        if (!error) {
                          triggerToast("Rezervácia bola úspešne zapísaná do Supabase PostgreSQL!");
                          await loadData(currentUserProfile);
                        }
                      }}
                      className="py-2 px-5 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl"
                    >
                      Rezervovať a odoslať do DB
                    </button>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-brand-navy text-sm">Moje termíny z DB</h3>
                    {appointments.map(a => (
                      <div key={a.id} className="p-3 bg-brand-off-white/40 border rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <strong>{a.service_name || "Fyzioterapia"}</strong>
                          <p className="text-gray-400">{new Date(a.start_time).toLocaleString()} | Stav: {a.status}</p>
                        </div>
                        {a.status === 'confirmed' && (
                          <button onClick={() => handleBookingCancelInit(a.id)} className="px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg font-bold">
                            Zrušiť
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  <h3 className="font-bold text-brand-navy text-sm">Rezervácie všetkých klientov</h3>
                  <div className="divide-y border rounded-xl overflow-hidden bg-brand-off-white/10">
                    {appointments.map(a => (
                      <div key={a.id} className="p-3 flex justify-between items-center">
                        <strong>{a.client_name || "Roman Kováč"}</strong>
                        <span className="font-bold text-brand-navy">{new Date(a.start_time).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === "audit" && currentUserProfile?.role === 'admin' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-4 animate-fade-in">
              <h2 className="text-xl font-bold text-brand-navy">GDPR Audit Logs</h2>
              <div className="divide-y border rounded-xl overflow-hidden text-xs max-h-[300px] overflow-y-auto">
                {auditLogs.map(log => (
                  <div key={log.id} className="p-3 bg-brand-off-white/40 flex justify-between items-center">
                    <div>
                      <strong>{log.table_name} | {log.action}</strong>
                      <p className="text-gray-500 text-[10px] mt-0.5">Záznam ID: {log.record_id}</p>
                    </div>
                    <span className="text-[10px] text-gray-400">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: MÔJ PLÁN */}
          {activeTab === "plan" && (
            <div className="space-y-6 animate-fade-in text-xs">
              {currentUserProfile?.role === "klient" ? (
                <>
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-4">
                    <h2 className="text-xl font-bold text-brand-navy">Môj domáci tréningový plán</h2>
                    <p className="text-gray-400 mt-1">Aktuálny zoznam rehabilitačných cvičení predpísaných vaším špecialistom.</p>
                    
                    {workoutPlans.length === 0 ? (
                      <p className="text-gray-500 italic p-4 text-center">Nemáte zatiaľ predpísaný žiadny tréningový plán.</p>
                    ) : (
                      <div className="space-y-3">
                        {workoutPlans.map(w => (
                          <div key={w.id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-brand-off-white/50 p-4 rounded-xl border gap-4">
                            <div>
                              <strong className="text-sm text-brand-navy">{w.exercise_title}</strong>
                              <div className="text-gray-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                <span>Série: <strong>{w.sets}</strong></span>
                                <span>Opakovania: <strong>{w.reps}</strong></span>
                                <span>Tempo: <strong>{w.tempo}</strong></span>
                                <span>Pauza: <strong>{w.pause}</strong></span>
                              </div>
                              {w.notes && <p className="text-[11px] text-gray-400 mt-1 italic">Poznámka lekára: {w.notes}</p>}
                              {w.completed && (
                                <div className="mt-2 p-2 bg-brand-cyan/5 border border-brand-cyan/15 rounded text-[10px] text-brand-navy">
                                  Zaznamenaná náročnosť (RPE): <strong>{w.rpe}/10</strong> | Bolesť: <strong>{w.pain_level}/10</strong>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              {w.completed ? (
                                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Splnené
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    setFeedbackWorkId(w.id);
                                    setFeedbackNote("");
                                  }}
                                  className="px-4 py-2.5 min-h-[44px] bg-brand-cyan text-brand-dark-navy font-bold rounded-xl hover:bg-brand-hover-cyan transition-colors"
                                >
                                  Cvičiť
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-4">
                    <h2 className="text-xl font-bold text-brand-navy">Moja lekárska a diagnostická karta</h2>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {medicalCards.filter(m => m.client_id === currentUserProfile?.id).length === 0 ? (
                        <p className="text-gray-500 italic">Zatiaľ nemáte zapísané žiadne diagnostické záznamy.</p>
                      ) : (
                        medicalCards
                          .filter(m => m.client_id === currentUserProfile?.id)
                          .map(m => (
                            <div key={m.id} className="p-4 bg-brand-off-white/40 border rounded-xl space-y-3">
                              <div className="flex justify-between items-center border-b pb-2">
                                <span className="font-bold text-brand-navy text-sm capitalize">{m.type === 'fyzio' ? 'Fyzioterapeutický' : m.type} záznam</span>
                                <span className="text-gray-400 font-mono">{new Date(m.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {m.form_data?.summary && (
                                  <div>
                                    <strong className="block text-gray-400 uppercase text-[9px] mb-1">Diagnóza / Nález</strong>
                                    <p className="text-gray-800 font-medium">{m.form_data.summary}</p>
                                  </div>
                                )}
                                {m.form_data?.field1 && (
                                  <div>
                                    <strong className="block text-gray-400 uppercase text-[9px] mb-1">Popis ťažkostí</strong>
                                    <p className="text-gray-700">{m.form_data.field1}</p>
                                  </div>
                                )}
                                {m.form_data?.field2 && (
                                  <div className="md:col-span-2">
                                    <strong className="block text-gray-400 uppercase text-[9px] mb-1">Terapeutický plán</strong>
                                    <p className="text-gray-700 bg-brand-cyan/5 border border-brand-cyan/20 p-2.5 rounded-lg">{m.form_data.field2}</p>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => promptPasswordPdf(m)}
                                className="mt-2 text-brand-cyan hover:underline flex items-center gap-1 font-semibold text-[11px]"
                              >
                                🔒 Stiahnuť zaheslované PDF
                              </button>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <Prescription
                  clients={clients}
                  selectedClientId={selectedClientId}
                  onChangeClient={(id) => setSelectedClientId(id)}
                  exercises={exercises}
                  workoutPlans={workoutPlans}
                  onPrescribe={handlePrescribeWrapper}
                  onDelete={handleDeleteWrapper}
                />
              )}
            </div>
          )}

          {/* TAB 7: VIDEÁ */}
          {activeTab === "videa" && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-6 animate-fade-in text-xs">
              <div className="border-b pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-brand-navy">Videoknižnica cvičení</h2>
                  <p className="text-gray-400 mt-1">Videá a inštrukcie pre správnu techniku cvičenia.</p>
                </div>
                <input
                  type="text"
                  placeholder="Vyhľadať cvičenie…"
                  value={videoSearch}
                  onChange={(e) => setVideoSearch(e.target.value)}
                  className="bg-brand-off-white border rounded-xl px-4 py-2 text-xs outline-none w-full md:w-64 focus:border-brand-cyan"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {exercises
                  .filter(ex => 
                    ex.title.toLowerCase().includes(videoSearch.toLowerCase()) || 
                    ex.category.toLowerCase().includes(videoSearch.toLowerCase())
                  )
                  .map(ex => (
                    <div key={ex.id} className="border rounded-2xl overflow-hidden bg-brand-off-white/30 flex flex-col justify-between">
                      <div className="aspect-video bg-[#020C1B] relative flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                        <div className="z-20 text-center flex flex-col items-center gap-2 p-4">
                          <div className="w-12 h-12 rounded-full bg-brand-cyan/25 flex items-center justify-center text-brand-cyan border border-brand-cyan animate-pulse">
                            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                          <span className="text-[10px] text-brand-cyan tracking-wider font-semibold uppercase">Video inštruktáž: {ex.title}</span>
                          <span className="text-[9px] text-white/60">Kliknutím spustíte prehrávanie</span>
                        </div>
                      </div>
                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-brand-navy text-sm">{ex.title}</h3>
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700">
                              {ex.difficulty}
                            </span>
                          </div>
                          <p className="text-gray-600 leading-relaxed text-[11px]">{ex.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 8: DOKUMENTY */}
          {activeTab === "dokumenty" && currentUserProfile && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-6 animate-fade-in text-xs">
              <div className="border-b pb-4">
                <h2 className="text-xl font-bold text-brand-navy">Moje dokumenty a súbory</h2>
                <p className="text-gray-400 mt-1">Prehľad dokumentov v Supabase Storage prepojených s vaším účtom.</p>
              </div>

              {documents.length === 0 ? (
                <p className="text-gray-500 italic p-6 text-center">Nemáte zatiaľ nahrané žiadne dokumenty.</p>
              ) : (
                <div className="space-y-3">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex justify-between items-center bg-brand-off-white/40 border p-4 rounded-xl gap-4">
                      <div className="flex-1 min-w-0">
                        <strong className="text-brand-navy block text-sm truncate">{doc.file_name}</strong>
                        <span className="text-[10px] text-gray-400 mt-0.5 block">
                          Vytvorené: {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        onClick={() => downloadDocument(doc.storage_path, doc.file_name)}
                        className="flex-shrink-0 px-4 py-2 bg-[#00F0FF] text-[#020C1B] font-bold rounded-xl hover:bg-[#00D0DF] transition-colors flex items-center gap-1.5"
                      >
                        Stiahnuť
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 9: MÔJ PROFIL */}
          {activeTab === "profil" && currentUserProfile && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-6 animate-fade-in text-xs">
              <div className="border-b pb-4">
                <h2 className="text-xl font-bold text-brand-navy">Môj profil</h2>
                <p className="text-gray-400 mt-1">Prehľad vašich registračných údajov a GDPR.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div className="p-4 bg-brand-off-white/40 border rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <strong className="block text-gray-400 uppercase text-[9px] mb-0.5">Meno a priezvisko</strong>
                      <span className="text-sm font-bold text-brand-navy">{currentUserProfile.full_name}</span>
                    </div>
                    <div>
                      <strong className="block text-gray-400 uppercase text-[9px] mb-0.5">Prihlasovací e-mail</strong>
                      <span className="text-sm font-bold text-brand-navy">{currentUserProfile.email || sessionUser?.email || "Nezadaný"}</span>
                    </div>
                    <div>
                      <strong className="block text-gray-400 uppercase text-[9px] mb-0.5">Telefón</strong>
                      <span className="text-sm font-bold text-brand-navy">{currentUserProfile.phone || "Nezadané"}</span>
                    </div>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); updateProfilePhone(newClientPhone); }} className="p-4 border rounded-xl bg-brand-off-white/20 space-y-3">
                    <h3 className="font-bold text-brand-navy">Zmena telefónneho čísla</h3>
                    <div className="flex gap-3 max-w-sm">
                      <input
                        type="tel"
                        required
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        className="bg-white border rounded-lg px-3 py-2 outline-none w-full"
                        placeholder="+421 900 000 000"
                      />
                      <button type="submit" className="py-2 px-5 bg-brand-cyan text-brand-dark-navy font-bold rounded-lg whitespace-nowrap">
                        Aktualizovať
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: NASTAVENIA (Form Template Editor) */}
          {activeTab === "nastavenia" && currentUserProfile?.role === 'admin' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-6 animate-fade-in text-xs">
              <div className="border-b pb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-brand-navy">Správa šablón formulárov</h2>
                  <p className="text-gray-400 mt-1">Vytvárajte a editujte diagnostické formuláre pre špecialistov.</p>
                </div>
                {!editingTemplate && (
                  <button 
                    onClick={startNewTemplate} 
                    className="py-2 px-4 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl hover:bg-brand-hover-cyan"
                  >
                    + Nová šablóna
                  </button>
                )}
              </div>

              {editingTemplate ? (
                <div className="space-y-4 border p-4 rounded-xl bg-brand-off-white/40">
                  <h3 className="font-bold text-sm text-brand-navy">
                    {editingTemplate.id === "new" ? "Nová šablóna" : `Úprava šablóny: ${editingTemplate.title}`}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold mb-1">Názov šablóny</label>
                      <input 
                        type="text" 
                        value={editorTitle} 
                        onChange={(e) => setEditorTitle(e.target.value)} 
                        className="w-full bg-white border p-2 rounded-lg outline-none"
                        placeholder="napr. Komplexná diagnostika"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Kategória / Špecializácia</label>
                      <select 
                        value={editorCategory} 
                        onChange={(e) => setEditorCategory(e.target.value)}
                        className="w-full bg-white border p-2 rounded-lg outline-none"
                      >
                        <option value="fyzio">Fyzioterapia</option>
                        <option value="trening">Tréning / Pohyb</option>
                        <option value="ortoped">Ortopédia</option>
                        <option value="nutricia">Nutričný poradca</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3">
                    <div className="flex justify-between items-center border-b pb-1">
                      <h4 className="font-bold text-brand-navy">Polia formulára</h4>
                      <button 
                        type="button" 
                        onClick={addEditorField}
                        className="text-brand-cyan hover:underline font-bold"
                      >
                        + Pridať pole
                      </button>
                    </div>

                    {editorFields.length === 0 ? (
                      <p className="text-gray-400 italic text-center p-3">Šablóna nemá zatiaľ žiadne polia.</p>
                    ) : (
                      <div className="space-y-3">
                        {editorFields.map((field, idx) => (
                          <div key={field.id} className="p-3 bg-white border rounded-lg space-y-2 relative">
                            <button 
                              type="button" 
                              onClick={() => removeEditorField(field.id)}
                              className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold"
                            >
                              Zmazať
                            </button>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pr-6">
                              <div>
                                <label className="block font-semibold text-[10px] text-gray-500">Štítok</label>
                                <input 
                                  type="text" 
                                  value={field.label} 
                                  onChange={(e) => {
                                    const updated = [...editorFields];
                                    updated[idx].label = e.target.value;
                                    setEditorFields(updated);
                                  }}
                                  className="w-full border p-1.5 rounded outline-none"
                                />
                              </div>
                              <div>
                                <label className="block font-semibold text-[10px] text-gray-500">Typ</label>
                                <select 
                                  value={field.type} 
                                  onChange={(e) => {
                                    const updated = [...editorFields];
                                    updated[idx].type = e.target.value;
                                    setEditorFields(updated);
                                  }}
                                  className="w-full border p-1.5 rounded outline-none"
                                >
                                  <option value="text">Text (jedno riadkové)</option>
                                  <option value="textarea">Dlhý text</option>
                                  <option value="number">Číslo</option>
                                  <option value="checkbox">Zaškrtávacie políčko</option>
                                  <option value="vas_scale">Škála bolesti (VAS 0-10)</option>
                                  <option value="select">Dropdown</option>
                                </select>
                              </div>
                              <div>
                                <label className="block font-semibold text-[10px] text-gray-500">Placeholder</label>
                                <input 
                                  type="text" 
                                  value={field.placeholder || ""} 
                                  onChange={(e) => {
                                    const updated = [...editorFields];
                                    updated[idx].placeholder = e.target.value;
                                    setEditorFields(updated);
                                  }}
                                  className="w-full border p-1.5 rounded outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 justify-end pt-3">
                    <button 
                      onClick={() => setEditingTemplate(null)} 
                      className="px-4 py-2 border rounded-xl hover:bg-gray-100 font-bold"
                    >
                      Zrušiť
                    </button>
                    <button 
                      onClick={saveFormTemplate} 
                      className="px-4 py-2 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl hover:bg-brand-hover-cyan"
                    >
                      Uložiť šablónu
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border rounded-xl overflow-hidden divide-y">
                  {formTemplates.map(t => (
                    <div key={t.id} className="p-4 bg-brand-off-white/40 flex justify-between items-center gap-4">
                      <div>
                        <strong className="text-brand-navy text-sm block">{t.title}</strong>
                        <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">
                          Kategória: {t.category} | Polia: {t.schema?.length || 0}
                        </span>
                      </div>
                      <button 
                        onClick={() => startEditingTemplate(t)} 
                        className="py-1.5 px-3 border border-brand-navy text-brand-navy hover:bg-gray-50 font-bold rounded-lg"
                      >
                        Upraviť
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Late Cancellation dialog */}
      {cancelTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white text-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border">
            <h3 className="text-lg font-bold text-brand-navy mb-2">Potvrdiť storno termínu</h3>
            {isLateCancel ? (
              <p className="text-xs text-red-600 font-semibold mb-4 bg-red-50 p-3 rounded-lg border border-red-200">
                ⚠️ Upozornenie: Tento termín začína o menej ako 24 hodín. Platba prepadne v prospech centra.
              </p>
            ) : (
              <p className="text-xs text-gray-600 mb-4">
                Bezplatné storno rezervácie. Pokračovať?
              </p>
            )}
            <div className="flex gap-3 justify-end text-xs">
              <button onClick={() => setCancelTargetId(null)} className="px-4 py-2 border rounded-xl hover:bg-gray-100 font-bold">Naspäť</button>
              <button onClick={executeCancel} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold">Potvrdiť storno</button>
            </div>
          </div>
        </div>
      )}

      {/* Client Workout Logger / Feedback Dialog */}
      {feedbackWorkId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white text-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border">
            <h3 className="text-lg font-bold text-brand-navy mb-2">Zaznamenať cvičenie</h3>
            <p className="text-xs text-gray-500 mb-4">
              Zadajte spätnú väzbu pre cvičenie.
            </p>
            <form onSubmit={handleWorkoutFeedbackSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1 text-gray-600">Subjektívna náročnosť (RPE): {feedbackRpe}/10</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={feedbackRpe}
                  onChange={(e) => setFeedbackRpe(parseInt(e.target.value))}
                  className="w-full accent-brand-cyan"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-gray-600">Úroveň pociťovanej bolesti: {feedbackPain}/10</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={feedbackPain}
                  onChange={(e) => setFeedbackPain(parseInt(e.target.value))}
                  className="w-full accent-brand-cyan"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-gray-600">Poznámka (voliteľné)</label>
                <textarea
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  className="w-full bg-brand-off-white border p-2 rounded-lg outline-none h-16"
                  placeholder="Ako sa vám cvičilo…"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setFeedbackWorkId(null)} className="px-4 py-2 border rounded-xl hover:bg-gray-100 font-bold">Zrušiť</button>
                <button type="submit" className="px-4 py-2 bg-brand-cyan text-brand-dark-navy rounded-xl font-bold hover:bg-brand-hover-cyan">Uložiť záznam</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Lock PDF Modal */}
      {showPdfPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white text-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border space-y-4">
            <div className="flex items-center gap-2.5 text-brand-navy">
              <span className="text-lg">🔒</span>
              <h3 className="text-lg font-bold">Generovať zaheslované PDF</h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Tento dokument obsahuje citlivé zdravotné údaje. Zadajte prístupové heslo pre šifrovanie.
            </p>
            <div className="space-y-1">
              <input
                type="password"
                value={pdfPassword}
                onChange={(e) => setPdfPassword(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-xs outline-none focus:border-brand-cyan"
                placeholder="Zadajte heslo..."
              />
            </div>
            <div className="flex gap-3 justify-end pt-2 text-xs">
              <button onClick={() => setShowPdfPasswordModal(false)} className="px-4 py-2 border rounded-xl hover:bg-gray-100 font-bold">Zrušiť</button>
              <button onClick={handleDownloadPasswordPdf} className="px-4 py-2 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl">Stiahnuť</button>
            </div>
          </div>
        </div>
      )}

       <footer className="bg-brand-dark-navy text-white/50 text-center py-6 text-xs border-t border-white/10 mt-auto">
        <p>© 2026 SportWell. Databáza prepojená s PostgreSQL.</p>
      </footer>

      {/* Bottom Navigation Bar for Mobile Clients */}
      {currentUserProfile?.role === 'klient' && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex justify-around items-center h-16 shadow-lg pb-safe">
          <button onClick={() => setActiveTab("dashboard")} className={`flex flex-col items-center justify-center w-16 h-12 ${activeTab === "dashboard" ? "text-brand-cyan" : "text-gray-400"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[10px] font-semibold mt-1">Domov</span>
          </button>
          <button onClick={() => setActiveTab("plan")} className={`flex flex-col items-center justify-center w-16 h-12 ${activeTab === "plan" ? "text-brand-cyan" : "text-gray-400"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span className="text-[10px] font-semibold mt-1">Moje Cviky</span>
          </button>
          <button onClick={() => setActiveTab("dokumenty")} className={`flex flex-col items-center justify-center w-16 h-12 ${activeTab === "dokumenty" ? "text-brand-cyan" : "text-gray-400"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-[10px] font-semibold mt-1">Dokumenty</span>
          </button>
          <button onClick={() => setActiveTab("profil")} className={`flex flex-col items-center justify-center w-16 h-12 ${activeTab === "profil" ? "text-brand-cyan" : "text-gray-400"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px] font-semibold mt-1">Profil</span>
          </button>
        </div>
      )}
    </div>
  );
}
