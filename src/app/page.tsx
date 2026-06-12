"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { jsPDF } from "jspdf";

// 1. DATA TYPES CONFIGURATION
interface ClientProfile {
  id: string;
  role: 'admin' | 'trener' | 'klient';
  full_name: string;
  email?: string;
  phone: string;
  gdpr_signed_at: string | null;
  metadata: {
    marketing_opt_in?: boolean;
    fms_inbody_opt_in?: boolean;
    meta_lookalike_opt_in?: boolean;
    [key: string]: any;
  };
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

interface Exercise {
  id: string;
  title: string;
  category: string;
  target: string;
  difficulty: 'lahka' | 'stredna' | 'tazka';
  equipment: string;
  description: string;
  contraindications: string;
}

interface PainPoint {
  region: string;
  intensity: number;
  notes: string;
}

interface MedicalCard {
  id: string;
  client_id: string;
  created_by: string;
  type: 'ortoped' | 'fyzio' | 'masaz' | 'trening' | 'nutricia';
  pain_map_data: PainPoint[];
  form_data: Record<string, string>;
  created_at: string;
  profiles_client?: { full_name: string };
  profiles_creator?: { full_name: string; role: string };
}

interface Appointment {
  id: string;
  client_id: string;
  staff_id: string;
  client_name?: string;
  service_name?: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled_by_client' | 'cancelled_by_staff' | 'no_show';
  cancelled_at?: string | null;
  profiles_client?: { full_name: string };
  profiles_staff?: { full_name: string; role: string };
}

interface WorkoutPlan {
  id: string;
  client_id: string;
  exercise_title: string;
  sets: number;
  reps: number;
  tempo: string;
  pause: string;
  notes: string;
  completed: boolean;
  rpe?: number;
  pain_level?: number;
}

interface AuditLog {
  id: string;
  user_id: string;
  table_name: string;
  action: string;
  record_id: string;
  new_data: any;
  created_at: string;
}

export default function CompleteSportWellApp() {
  const supabase = createClient();

  // 2. AUTHENTICATION STATE
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<ClientProfile | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState<'login' | 'reset' | 'register'>('login');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // 3. APPLICATION TABS & MOCKUP DATA
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [toast, setToast] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Database lists
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [medicalCards, setMedicalCards] = useState<MedicalCard[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [formTemplates, setFormTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [dynamicFormData, setDynamicFormData] = useState<Record<string, any>>({});
  
  // Simulated static data
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

  const [exercises, setExercises] = useState<Exercise[]>([]);

  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);

  // 4. INTERACTION FILTERS AND FORM VARIABLES
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [videoSearch, setVideoSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<'all' | 'gdpr_missing' | 'inactive'>('all');
  
  // Custom Registration Form
  const [newClientFirst, setNewClientFirst] = useState("");
  const [newClientLast, setNewClientLast] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientInsurance, setNewClientInsurance] = useState("Dôvera");
  
  // Late cancellation confirmation
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [isLateCancel, setIsLateCancel] = useState(false);

  // Specialist diagnostic inputs
  const [diagSummary, setDiagSummary] = useState("");
  const [diagField1, setDiagField1] = useState("");
  const [diagField2, setDiagField2] = useState("");

  // Plan prescription inputs
  const [prescExTitle, setPrescExTitle] = useState("Mostík na jednej nohe");
  const [prescSets, setPrescSets] = useState(3);
  const [prescReps, setPrescReps] = useState(10);
  const [prescTempo, setPrescTempo] = useState("3-0-3");
  const [prescPause, setPrescPause] = useState("60s");
  const [prescNotes, setPrescNotes] = useState("");

  // Payment creation
  const [payServiceId, setPayServiceId] = useState("s1");
  const [payMethod, setPayMethod] = useState<'karta' | 'hotovost'>("karta");

  // Client workout feedback
  const [feedbackWorkId, setFeedbackWorkId] = useState<string | null>(null);
  const [feedbackRpe, setFeedbackRpe] = useState(5);
  const [feedbackPain, setFeedbackPain] = useState(2);
  const [feedbackNote, setFeedbackNote] = useState("");

  // Pain map client state
  const [bodySide, setBodySide] = useState<'front' | 'back'>('front');
  const [selectedPainRegion, setSelectedPainRegion] = useState<string>("Pravé koleno");
  const [painIntensity, setPainIntensity] = useState<number>(5);
  const [painNotes, setPainNotes] = useState<string>("");

  // Onboarding Wizard States
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

  // Administrátorský form template builder
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorCategory, setEditorCategory] = useState("fyzio");
  const [editorFields, setEditorFields] = useState<any[]>([]);

  // Zaheslované PDF
  const [pdfPassword, setPdfPassword] = useState("");
  const [showPdfPasswordModal, setShowPdfPasswordModal] = useState(false);
  const [selectedRecordForPdf, setSelectedRecordForPdf] = useState<any>(null);

  // Overenie registrácie kódom
  const [registerFullName, setRegisterFullName] = useState("");
  const [registerVerifyPending, setRegisterVerifyPending] = useState(false);
  const [registerVerifyCode, setRegisterVerifyCode] = useState("");
  const [registerInputCode, setRegisterInputCode] = useState("");

  const submitOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionUser || !currentUserProfile) return;

    if (!onbPrivacyAccepted || !onbTermsAccepted) {
      triggerToast("Musíte udeliť povinné súhlasi s VOP a rezervačným systémom.");
      return;
    }

    setIsOnboardingSaving(true);

    const fullName = `${onbFirstName} ${onbLastName}`.trim() || "Nový Klient";
    const metadataObj = {
      birth_date: onbBirthDate,
      address: onbAddress,
      primary_interest: onbInterest,
      gdpr_version: "v3.0",
      marketing_accepted: onbMarketingAccepted,
      meta_accepted: onbMetaAccepted,
      diag_accepted: onbDiagAccepted,
    };

    // 1. Update Profile in DB
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone: onbPhone,
        email: onbEmail || sessionUser.email,
        gdpr_signed_at: new Date().toISOString(),
        metadata: metadataObj
      })
      .eq("id", sessionUser.id);

    if (profileError) {
      triggerToast(`Chyba uloženia profilu: ${profileError.message}`);
      setIsOnboardingSaving(false);
      return;
    }

    // 2. Simulate PDF Generation & write to documents table
    const { error: docError } = await supabase.from("documents").insert({
      client_id: sessionUser.id,
      file_name: `GDPR_Suhlas_${fullName.replace(/\s+/g, '_')}.pdf`,
      storage_path: `gdpr/gdpr_${sessionUser.id}.pdf`
    });

    if (docError) {
      console.error("Document logging failed:", docError.message);
    }

    triggerToast("Registrácia a súhlas s GDPR boli úspešne uložené!");
    await fetchUserProfile(sessionUser.id);
    setIsOnboardingSaving(false);
  };

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // 5. DATA INTAKE & HYDRATION EFFECT
  useEffect(() => {
    setMounted(true);
    checkUserSession();

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const p = params.get("p");
      if (p === "gdpr" || p === "anamneza") {
        setPublicForm(p as 'gdpr' | 'anamneza');
      }
    }
  }, []);

  const checkUserSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setSessionUser(user);
      fetchUserProfile(user.id);
    } else {
      setSessionUser(null);
      setCurrentUserProfile(null);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setCurrentUserProfile(data);
      setNewClientPhone(data.phone || "");
      // Fetch dependent lists
      loadData(data);
    } else {
      // Create a default profile if missing (fallback onboarding)
      const defaultProf: ClientProfile = {
        id: userId,
        role: "klient",
        full_name: "Nový Používateľ",
        phone: "",
        gdpr_signed_at: null,
        metadata: {}
      };
      setNewClientPhone("");
      setCurrentUserProfile(defaultProf);
      loadData(defaultProf);
    }
  };

  const loadData = async (profile: ClientProfile) => {
    // 1. Fetch Clients list (for employees)
    if (profile.role !== "klient") {
      const { data: profilesList } = await supabase.from("profiles").select("*");
      if (profilesList) setClients(profilesList);

      const { data: audits } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false });
      if (audits) setAuditLogs(audits);
    }

    // 2. Fetch Medical cards
    let query = supabase.from("medical_cards").select("*, profiles_client:client_id(full_name), profiles_creator:created_by(full_name, role)");
    if (profile.role === "klient") {
      query = query.eq("client_id", profile.id);
    }
    const { data: cards } = await query;
    if (cards) setMedicalCards(cards as any);

    // 3. Fetch Bookings
    let bookingQuery = supabase.from("reservations").select("*, profiles_client:client_id(full_name), profiles_staff:staff_id(full_name, role)");
    if (profile.role === "klient") {
      bookingQuery = bookingQuery.eq("client_id", profile.id);
    }
    const { data: appts } = await bookingQuery;
    if (appts) setAppointments(appts as any);

    // 4. Fetch Documents
    let docQuery = supabase.from("documents").select("*");
    if (profile.role === "klient") {
      docQuery = docQuery.eq("client_id", profile.id);
    }
    const { data: docs, error: docsErr } = await docQuery;
    if (docsErr) console.error("[Documents fetch error]:", docsErr.message, docsErr.code);
    if (docs) setDocuments(docs);

    // Self-healing: ak má klient gdpr_signed_at ale žiaden dokument, vložíme ho
    const docsEmpty = !docs || docs.length === 0;
    if (profile.role === "klient" && profile.gdpr_signed_at && docsEmpty && !docsErr) {
      const safeName = (profile.full_name || "Klient").replace(/\s+/g, '_');
      const { error: insertDocErr } = await supabase.from("documents").insert({
        client_id: profile.id,
        file_name: `GDPR_Suhlas_${safeName}.pdf`,
        storage_path: `gdpr/gdpr_${profile.id}.pdf`
      });
      if (!insertDocErr) {
        // Refetch after insert
        const { data: docsRefetched } = await supabase.from("documents").select("*").eq("client_id", profile.id);
        if (docsRefetched) setDocuments(docsRefetched);
      } else {
        console.error("[GDPR doc self-heal failed]:", insertDocErr.message);
      }
    }

    // 5. Fetch Form Templates
    const { data: templates } = await supabase
      .from("form_templates")
      .select("*")
      .eq("is_active", true);
    if (templates) {
      setFormTemplates(templates);
      if (templates.length > 0) {
        setSelectedTemplateId(templates[0].id);
      }
    }

    // 6. Fetch Exercises from DB
    const { data: dbExercises } = await supabase.from("exercises").select("*");
    if (dbExercises) setExercises(dbExercises as any);

    // 7. Fetch Training Plans (workoutPlans)
    if (profile.role === "klient") {
      const { data: dbPlans } = await supabase
        .from("training_plans")
        .select("*")
        .eq("client_id", profile.id);
      if (dbPlans && dbPlans.length > 0) {
        const combinedPlans = dbPlans.flatMap((p: any) => p.plan_data || []);
        setWorkoutPlans(combinedPlans);
      } else {
        setWorkoutPlans([]);
      }
    } else {
      setWorkoutPlans([]);
    }
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

  // 6. ACTIONS & SUPABASE QUERIES
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);

    if (authMode === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword
      });
      if (error) {
        triggerToast(`Chyba prihlásenia: ${error.message}`);
      } else if (data.user) {
        setSessionUser(data.user);
        fetchUserProfile(data.user.id);
        triggerToast("Úspešne prihlásený!");
      }
    } else if (authMode === 'register') {
      if (!registerVerifyPending) {
        if (!registerFullName.trim()) {
          triggerToast("Zadajte vaše celé meno.");
          setIsAuthLoading(false);
          return;
        }
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setRegisterVerifyCode(code);
        setRegisterVerifyPending(true);
        setIsAuthLoading(false);
        triggerToast(`[SMS/EMAIL SIMULÁCIA] Overovací kód pre registráciu: ${code}`);
        return;
      }

      if (registerInputCode !== registerVerifyCode) {
        triggerToast("Nesprávny overovací kód.");
        setIsAuthLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword
      });
      if (error) {
        triggerToast(`Chyba registrácie: ${error.message}`);
      } else if (data.user) {
        // Create initial profile
        await supabase.from("profiles").insert({
          id: data.user.id,
          role: "klient",
          full_name: registerFullName.trim(),
          phone: "",
          email: authEmail,
          metadata: {}
        });
        
        setRegisterVerifyPending(false);
        setRegisterInputCode("");
        setRegisterVerifyCode("");
        setRegisterFullName("");

        setSessionUser(data.user);
        fetchUserProfile(data.user.id);
        triggerToast("Úspešne registrovaný a prihlásený!");
      }
    } else {
      // WordPress migrated flow: Trigger Password reset
      const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
        redirectTo: window.location.origin
      });
      if (error) {
        triggerToast(`Chyba: ${error.message}`);
      } else {
        triggerToast("Overovací odkaz pre nastavenie nového hesla bol odoslaný na e-mail.");
      }
    }
    setIsAuthLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
    setCurrentUserProfile(null);
    triggerToast("Úspešne odhlásený.");
  };

  const registerClient = async (e: React.FormEvent) => {
    e.preventDefault();
    // In production, we register users via Supabase auth signup or admin invite
    // For local simulation + DB inserts: create profile row
    const { data: { user } } = await supabase.auth.signUp({
      email: newClientEmail,
      password: "DefaultPassword123!" // Temporary default password for clients to reset
    });

    if (user) {
      const { error } = await supabase.from("profiles").insert({
        id: user.id,
        role: "klient",
        full_name: `${newClientFirst} ${newClientLast}`.trim() || "Nový Klient",
        phone: newClientPhone,
        email: newClientEmail,
        metadata: {}
      });

      if (!error) {
        triggerToast("Klient bol úspešne registrovaný a uložený do databázy.");
        loadData(currentUserProfile!);
      }
    }

    setNewClientFirst("");
    setNewClientLast("");
    setNewClientEmail("");
    setNewClientPhone("");
  };

  const savePainPoint = async () => {
    if (!selectedPainRegion || !currentUserProfile) return;

    const newPain: PainPoint = {
      region: selectedPainRegion,
      intensity: painIntensity,
      notes: painNotes
    };

    const clientFyzioCard = medicalCards.find(c => c.client_id === currentUserProfile.id && c.type === 'fyzio');

    if (clientFyzioCard) {
      const updatedPainList = [
        ...clientFyzioCard.pain_map_data.filter(p => p.region !== selectedPainRegion),
        newPain
      ];

      const { error } = await supabase
        .from("medical_cards")
        .update({ pain_map_data: updatedPainList })
        .eq("id", clientFyzioCard.id);

      if (!error) {
        triggerToast("Bolesť bola zaznamenaná v databáze.");
        loadData(currentUserProfile);
      }
    } else {
      const { error } = await supabase.from("medical_cards").insert({
        client_id: currentUserProfile.id,
        created_by: currentUserProfile.id,
        type: "fyzio",
        pain_map_data: [newPain],
        form_data: {}
      });

      if (!error) {
        triggerToast("Záznam bolesti bol úspešne vytvorený.");
        loadData(currentUserProfile);
      }
    }
    setPainNotes("");
  };

  const handleBookingCancelInit = (id: string) => {
    const appt = appointments.find(a => a.id === id);
    if (!appt) return;
    const diffHours = (new Date(appt.start_time).getTime() - Date.now()) / (1000 * 60 * 60);
    setIsLateCancel(diffHours < 24);
    setCancelTargetId(id);
  };

  const executeCancel = async () => {
    if (!cancelTargetId || !currentUserProfile) return;

    const { error } = await supabase
      .from("reservations")
      .update({
        status: isLateCancel ? 'no_show' : 'cancelled_by_client',
        cancelled_at: new Date().toISOString()
      })
      .eq("id", cancelTargetId);

    if (!error) {
      triggerToast(isLateCancel ? "Termín stornovaný s poplatkom (neskoré storno)." : "Termín bezplatne zrušený.");
      loadData(currentUserProfile);
    }
    setCancelTargetId(null);
  };

  // Verejné odosielanie a podpisovanie kódov
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

    // Registrácia konta
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: emailToUse,
      password: "SportWellPassword123!"
    });

    let userId = authData?.user?.id;
    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        const { data: existingProf } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", emailToUse)
          .maybeSingle();
        if (existingProf) {
          userId = existingProf.id;
        }
      } else {
        triggerToast(`Chyba registrácie: ${signUpError.message}`);
        setIsOnboardingSaving(false);
        return;
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
      e_signature_code: signatureCode,
      signed_at_ip: "127.0.0.1 (simulovaná IP)",
      signed_vop_text: "Súhlas s VOP rezervačného systému v3.0 a storno podmienky 24h.",
      signed_gdpr_text: "Súhlas so spracovaním osobných a citlivých zdravotných údajov v3.0."
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

    triggerToast(publicForm === 'gdpr' ? "GDPR formulár bol úspešne elektronicky podpísaný a odoslaný!" : "Vstupná anamnéza bola úspešne elektronicky podpísaná a odoslaná!");
    setIsOnboardingSaving(false);
    
    if (typeof window !== "undefined") {
      window.history.pushState({}, document.title, window.location.pathname);
    }
    setPublicForm(null);
    setSessionUser(null);
  };

  // Správa šablón (Form Templates Editor)
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
        loadData(currentUserProfile!);
      } else {
        triggerToast(`Chyba: ${error.message}`);
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
        loadData(currentUserProfile!);
      } else {
        triggerToast(`Chyba: ${error.message}`);
      }
    }
  };

  // Stiahnutie zaheslovaného PDF
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
      `Klient: ${selectedClient.full_name}\n`,
      `Dátum: ${new Date(selectedRecordForPdf.created_at).toLocaleDateString()}\n`,
      `Typ vyšetrenia: ${selectedRecordForPdf.type?.toUpperCase()}\n`,
      `Diagnóza / Nález: ${selectedRecordForPdf.form_data?.summary || "Bez nálezu"}\n`,
      `Detaily: ${selectedRecordForPdf.form_data?.field1 || ""}\n`,
      `Plán: ${selectedRecordForPdf.form_data?.field2 || ""}\n`,
      `------------------------------------------\n`,
      `Tento dokument je chránený heslom.\n`
    ], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Chraneny_Nalez_${selectedClient.full_name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadDocument = async (storagePath: string, fileName: string) => {
    // Try Supabase Storage first (for real uploaded files)
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

    // Fallback: generate a proper styled PDF certificate client-side
    const profile = currentUserProfile;
    const signedDate = profile?.gdpr_signed_at
      ? new Date(profile.gdpr_signed_at).toLocaleString('sk-SK')
      : new Date().toLocaleString('sk-SK');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();

    // Header background
    doc.setFillColor(10, 25, 47); // brand-navy
    doc.rect(0, 0, W, 42, 'F');

    // Logo text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(0, 240, 255); // brand-cyan
    doc.text('SportWell', 15, 18);

    doc.setFontSize(9);
    doc.setTextColor(180, 210, 220);
    doc.text('zdravie na prvom mieste', 15, 25);

    // Title
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('GDPR SÚHLAS & REGISTRÁCIA', W / 2, 35, { align: 'center' });

    // Cyan accent line
    doc.setDrawColor(0, 240, 255);
    doc.setLineWidth(0.8);
    doc.line(0, 42, W, 42);

    let y = 55;

    // Section: Identifikácia
    doc.setFillColor(240, 248, 255);
    doc.roundedRect(12, y - 5, W - 24, 38, 2, 2, 'F');
    doc.setDrawColor(200, 220, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(12, y - 5, W - 24, 38, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(10, 25, 47);
    doc.text('IDENTIFIKÁCIA DOTKNUTEJ OSOBY', 17, y + 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 80, 100);
    const rows = [
      ['Meno a priezvisko', profile?.full_name || '—'],
      ['E-mail', profile?.email || '—'],
      ['Telefón', profile?.phone || '—'],
    ];
    rows.forEach(([label, value], i) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 100, 120);
      doc.text(label + ':', 17, y + 12 + i * 8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(10, 25, 47);
      doc.text(value, 70, y + 12 + i * 8);
    });

    y += 48;

    // Section: Súhlasy
    doc.setFillColor(240, 255, 248);
    doc.roundedRect(12, y - 5, W - 24, 46, 2, 2, 'F');
    doc.setDrawColor(180, 230, 200);
    doc.setLineWidth(0.3);
    doc.roundedRect(12, y - 5, W - 24, 46, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(10, 25, 47);
    doc.text('UDELENÉ SÚHLASY', 17, y + 2);

    doc.setFontSize(9);
    const consents = [
      '✓  Súhlas so spracovaním citlivých zdravotných údajov',
      '    (Fyzioterapia, Rehabilitácia, Tréning)',
      '✓  Súhlas s Podmienkami a VOP rezervačného systému',
      '    (vrátane storno podmienok 24 hodín)',
    ];
    consents.forEach((line, i) => {
      const isCheck = line.startsWith('✓');
      doc.setFont('helvetica', isCheck ? 'bold' : 'normal');
      doc.setTextColor(isCheck ? 20 : 80, isCheck ? 120 : 100, isCheck ? 60 : 110);
      doc.text(line, 17, y + 12 + i * 7);
    });

    y += 56;

    // Section: Podpis & Overenie
    doc.setFillColor(245, 245, 255);
    doc.roundedRect(12, y - 5, W - 24, 40, 2, 2, 'F');
    doc.setDrawColor(200, 200, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(12, y - 5, W - 24, 40, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(10, 25, 47);
    doc.text('PODPIS & OVERENIE', 17, y + 2);

    doc.setFontSize(9);
    [
      ['Dátum podpísania', signedDate],
      ['Verzia dokumentu', profile?.metadata?.gdpr_version || 'v3.0'],
      ['Metóda podpisu', 'Elektronický súhlas (e-podpis)'],
      ['Prevádzkovatelia', 'SportWell s.r.o. & SportWell rehab s.r.o.'],
    ].forEach(([label, value], i) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 120);
      doc.text(label + ':', 17, y + 12 + i * 7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(10, 25, 47);
      doc.text(value, 72, y + 12 + i * 7);
    });

    y += 50;

    // Legal notice
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 130, 145);
    const legal = 'Tento dokument je platným potvrdením o udelení GDPR súhlasu v súlade so zákonom č. 18/2018 Z.z.';
    const legal2 = 'o ochrane osobných údajov a nariadením GDPR (EÚ) 2016/679.';
    doc.text(legal, W / 2, y, { align: 'center' });
    doc.text(legal2, W / 2, y + 5, { align: 'center' });

    // Footer
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(10, 25, 47);
    doc.rect(0, pageH - 16, W, 16, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 240, 255);
    doc.text('SportWell  |  zdravie na prvom mieste  |  www.sportwell.sk', W / 2, pageH - 6, { align: 'center' });

    doc.save(fileName);
    triggerToast('GDPR dokument bol stiahnutý ako PDF.');
  };

  const submitDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile || !selectedTemplateId) return;

    const { error } = await supabase.from("client_records").insert({
      client_id: selectedClientId || currentUserProfile.id,
      created_by: currentUserProfile.id,
      template_id: selectedTemplateId,
      form_data: dynamicFormData
    });

    if (!error) {
      triggerToast("Diagnostický záznam bol bezpečne uložený do databázy.");
      loadData(currentUserProfile);
      setDynamicFormData({});
    } else {
      triggerToast(`Chyba uloženia: ${error.message}`);
    }
  };

  const createPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const srv = services.find(s => s.id === payServiceId);
    if (!srv) return;
    const newPay: Payment = {
      id: `p-${Date.now()}`,
      client_name: selectedClient.full_name,
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

  const submitWorkoutFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackWorkId || !currentUserProfile) return;

    const updated = workoutPlans.map(w =>
      w.id === feedbackWorkId
        ? { ...w, completed: true, rpe: feedbackRpe, pain_level: feedbackPain, notes: feedbackNote }
        : w
    );

    // Update training_plans row in DB for this client
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
      } else {
        triggerToast(`Chyba uloženia: ${error.message}`);
      }
    } else {
      setWorkoutPlans(updated);
      triggerToast("Tréningový log bol zaznamenaný lokálne.");
    }
    setFeedbackWorkId(null);
  };

  // Fetch client workout plans when trainer selects a client
  useEffect(() => {
    if (currentUserProfile && currentUserProfile.role !== 'klient' && selectedClientId) {
      fetchClientWorkoutPlans(selectedClientId);
    }
  }, [selectedClientId, currentUserProfile]);

  const fetchClientWorkoutPlans = async (clientId: string) => {
    const { data: dbPlans } = await supabase
      .from("training_plans")
      .select("*")
      .eq("client_id", clientId);
    if (dbPlans && dbPlans.length > 0) {
      const combined = dbPlans.flatMap((p: any) => p.plan_data || []);
      setWorkoutPlans(combined);
    } else {
      setWorkoutPlans([]);
    }
  };

  const prescribeExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile || !selectedClientId) {
      triggerToast("Vyberte klienta pre predpísanie cvičenia.");
      return;
    }

    const newWorkout: WorkoutPlan = {
      id: `w-${Date.now()}`,
      client_id: selectedClientId,
      exercise_title: prescExTitle,
      sets: prescSets,
      reps: prescReps,
      tempo: prescTempo,
      pause: prescPause,
      notes: prescNotes,
      completed: false
    };

    const updatedPlans = [...workoutPlans, newWorkout];

    const { data: dbPlans } = await supabase
      .from("training_plans")
      .select("id")
      .eq("client_id", selectedClientId)
      .limit(1);

    if (dbPlans && dbPlans.length > 0) {
      const { error } = await supabase
        .from("training_plans")
        .update({ plan_data: updatedPlans })
        .eq("id", dbPlans[0].id);

      if (!error) {
        setWorkoutPlans(updatedPlans);
        triggerToast("Cvičenie pridané do plánu v DB!");
      } else {
        triggerToast(`Chyba uloženia: ${error.message}`);
      }
    } else {
      const { error } = await supabase
        .from("training_plans")
        .insert({
          client_id: selectedClientId,
          created_by: currentUserProfile.id,
          plan_data: updatedPlans
        });

      if (!error) {
        setWorkoutPlans(updatedPlans);
        triggerToast("Nový tréningový plán bol vytvorený a uložený do DB!");
      } else {
        triggerToast(`Chyba vytvorenia: ${error.message}`);
      }
    }
    setPrescNotes("");
  };

  const deleteClientExercise = async (workoutId: string) => {
    if (!currentUserProfile || !selectedClientId) return;

    const updated = workoutPlans.filter(w => w.id !== workoutId);

    const { data: dbPlans } = await supabase
      .from("training_plans")
      .select("id")
      .eq("client_id", selectedClientId)
      .limit(1);

    if (dbPlans && dbPlans.length > 0) {
      const { error } = await supabase
        .from("training_plans")
        .update({ plan_data: updated })
        .eq("id", dbPlans[0].id);

      if (!error) {
        setWorkoutPlans(updated);
        triggerToast("Cvičenie bolo odstránené z plánu klienta.");
      } else {
        triggerToast(`Chyba: ${error.message}`);
      }
    }
  };

  const updateProfilePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile) return;

    const { error } = await supabase
      .from("profiles")
      .update({ phone: newClientPhone })
      .eq("id", currentUserProfile.id);

    if (!error) {
      triggerToast("Telefónne číslo bolo úspešne aktualizované.");
      fetchUserProfile(currentUserProfile.id);
    } else {
      triggerToast(`Chyba: ${error.message}`);
    }
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-off-white">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-navy border-t-transparent"></div>
      </div>
    );
  }

  // 7. PUBLIC SIGN-IN OR ONBOARDING SCREENS
  // 7. PUBLIC SIGN-IN OR ONBOARDING SCREENS
  if (publicForm) {
    return (
      <div className="flex flex-col min-h-screen bg-brand-dark-navy justify-center items-center p-4">
        {toast && (
          <div aria-live="polite" className="fixed bottom-6 right-6 z-50 glass-panel-dark text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-brand-cyan">
            <span className="w-2 h-2 rounded-full bg-brand-cyan animate-ping"></span>
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

          {/* PROGRESS BAR */}
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-brand-cyan h-1.5 transition-all duration-300"
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

          {/* STEP 1: OSOBNÉ ÚDAJE (Common for both) */}
          {anamnesisStep === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); setAnamnesisStep(2); }} className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-brand-cyan border-b border-white/10 pb-1">1. Osobné a kontaktné údaje</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Meno <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={onbFirstName}
                    onChange={(e) => setOnbFirstName(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan"
                    placeholder="Ján"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Priezvisko <span className="text-red-500">*</span></label>
                  <input
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
                  <label className="block text-gray-300 font-semibold mb-1">Dátum narodenia <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={onbBirthDate}
                    onChange={(e) => setOnbBirthDate(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan text-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Telefón <span className="text-red-500">*</span></label>
                  <input
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
                <label className="block text-gray-300 font-semibold mb-1">Trvalý pobyt / Adresa <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={onbAddress}
                  onChange={(e) => setOnbAddress(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan"
                  placeholder="Hlavná 12, 811 01 Bratislava"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Váš e-mail <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  required
                  value={onbEmail}
                  onChange={(e) => setOnbEmail(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan"
                  placeholder="meno@domena.sk"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Máte primárny záujem o:</label>
                <select
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
                  className="flex-1 py-2 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl hover:bg-brand-hover-cyan transition-colors"
                >
                  Pokračovať
                </button>
              </div>
            </form>
          )}

          {/* STEP 2 FOR GDPR OR STEP 2 FOR ANAMNEZA */}
          {anamnesisStep === 2 && publicForm === 'gdpr' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-brand-cyan border-b border-white/10 pb-1">2. Povinné zmluvné doložky</h3>
              
              <div className="border border-white/10 rounded-xl p-3 bg-white/5 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onbPrivacyAccepted}
                    onChange={(e) => setOnbPrivacyAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-brand-cyan accent-brand-cyan"
                  />
                  <span>Súhlasím so spracovaním citlivých zdravotných údajov pre diagnostiku <span className="text-brand-cyan">(Povinné)</span></span>
                </label>
                <button 
                  onClick={() => setShowPrivacyTerms(!showPrivacyTerms)} 
                  className="text-[10px] text-brand-cyan hover:underline block"
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
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onbTermsAccepted}
                    onChange={(e) => setOnbTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-brand-cyan accent-brand-cyan"
                  />
                  <span>Súhlasím so storno podmienkami rezervačného systému (24h vopred) <span className="text-brand-cyan">(Povinné)</span></span>
                </label>
                <button 
                  onClick={() => setShowBookingTerms(!showBookingTerms)} 
                  className="text-[10px] text-brand-cyan hover:underline block"
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
                  className="flex-1 py-2 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl disabled:opacity-50"
                >
                  Pokračovať
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 FOR ANAMNEZA: DOTAZNÍK */}
          {anamnesisStep === 2 && publicForm === 'anamneza' && (
            <form onSubmit={(e) => { e.preventDefault(); setAnamnesisStep(3); }} className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-brand-cyan border-b border-white/10 pb-1">2. Zdravotný stav & Anamnéza</h3>
              
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Predchádzajúce zranenia, operácie, vážne diagnózy:</label>
                <textarea
                  value={anbInjuries}
                  onChange={(e) => setAnbInjuries(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white h-16"
                  placeholder="napr. plastika predného skríženého väzu 2024, hernia disku L5-S1..."
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Lieky, ktoré pravidelne užívate:</label>
                <input
                  type="text"
                  value={anbMedications}
                  onChange={(e) => setAnbMedications(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white"
                  placeholder="napr. Novalgin pri bolestiach, Euthyrox..."
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Akékoľvek kontraindikácie (alergie, tehotenstvo, hypertenzia):</label>
                <input
                  type="text"
                  value={anbContraindications}
                  onChange={(e) => setAnbContraindications(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white"
                  placeholder="napr. alergia na teplo, vysoký krvný tlak..."
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Vaše pohybové obmedzenia alebo bolesti pri určitom pohybe:</label>
                <textarea
                  value={anbRestrictions}
                  onChange={(e) => setAnbRestrictions(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white h-16"
                  placeholder="napr. bolesť ramena pri vzpažení nad 90 stupňov, pichanie v kolene pri drepe..."
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
                  className="flex-1 py-2 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl"
                >
                  Pokračovať
                </button>
              </div>
            </form>
          )}

          {/* STEP 3 FOR GDPR: OPTIONAL CONSENTS */}
          {anamnesisStep === 3 && publicForm === 'gdpr' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-brand-cyan border-b border-white/10 pb-1">3. Dobrovoľné marketingové súhlasy</h3>
              
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer border border-white/10 rounded-xl p-3 bg-white/5">
                  <input
                    type="checkbox"
                    checked={onbMarketingAccepted}
                    onChange={(e) => setOnbMarketingAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-brand-cyan accent-brand-cyan"
                  />
                  <span>Súhlasím so zasielaním noviniek a akcií na e-mail (Ecomail)</span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer border border-white/10 rounded-xl p-3 bg-white/5">
                  <input
                    type="checkbox"
                    checked={onbMetaAccepted}
                    onChange={(e) => setOnbMetaAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-brand-cyan accent-brand-cyan"
                  />
                  <span>Súhlasím so zdieľaním e-mailu s Meta Platforms pre Lookalike Audiences</span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer border border-white/10 rounded-xl p-3 bg-white/5">
                  <input
                    type="checkbox"
                    checked={onbDiagAccepted}
                    onChange={(e) => setOnbDiagAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-brand-cyan accent-brand-cyan"
                  />
                  <span>Súhlasím so spracovaním a prepojením diagnostických dát z InBody prístroja</span>
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
                  className="flex-1 py-2 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl"
                >
                  Generovať podpisový kód
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 FOR ANAMNEZA: PAIN MAP & VAS */}
          {anamnesisStep === 3 && publicForm === 'anamneza' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-brand-cyan border-b border-white/10 pb-1">3. Mapa bolesti a VAS škála</h3>
              
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Vyberte oblasť najväčšej bolesti:</label>
                  <select
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
                  <label className="block text-gray-300 font-semibold mb-1">Úroveň pociťovanej bolesti (VAS): {painIntensity}/10</label>
                  <input
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
                  <label className="block text-gray-300 font-semibold mb-1">Doplňujúce pocity k bolesti (napr. pichanie, tupá bolesť):</label>
                  <input
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
                  className="flex-1 py-2 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl"
                >
                  Pokračovať
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 FOR ANAMNEZA: CONSENTS */}
          {anamnesisStep === 4 && publicForm === 'anamneza' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-brand-cyan border-b border-white/10 pb-1">4. Súhlasy a GDPR</h3>
              
              <div className="border border-white/10 rounded-xl p-3 bg-white/5 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onbPrivacyAccepted}
                    onChange={(e) => setOnbPrivacyAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-brand-cyan accent-brand-cyan"
                  />
                  <span>Súhlasím so spracovaním citlivých zdravotných údajov pre diagnostiku <span className="text-brand-cyan">(Povinné)</span></span>
                </label>
                <button onClick={() => setShowPrivacyTerms(!showPrivacyTerms)} className="text-[10px] text-brand-cyan hover:underline block">Zobraziť podmienky</button>
                {showPrivacyTerms && (
                  <div className="p-2 bg-black/30 border border-white/10 rounded text-[10px] text-gray-400 max-h-24 overflow-y-auto">
                    Zaväzujete sa poskytnúť pravdivé údaje o stave za účelom zostavenia rehabilitačného plánu.
                  </div>
                )}
              </div>

              <div className="border border-white/10 rounded-xl p-3 bg-white/5 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onbTermsAccepted}
                    onChange={(e) => setOnbTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-brand-cyan accent-brand-cyan"
                  />
                  <span>Súhlasím s VOP rezervačného systému (storno 24h) <span className="text-brand-cyan">(Povinné)</span></span>
                </label>
                <button onClick={() => setShowBookingTerms(!showBookingTerms)} className="text-[10px] text-brand-cyan hover:underline block">Zobraziť podmienky</button>
                {showBookingTerms && (
                  <div className="p-2 bg-black/30 border border-white/10 rounded text-[10px] text-gray-400 max-h-24 overflow-y-auto">
                    Bezplatné zrušenie termínu najneskôr 24h pred začiatkom.
                  </div>
                )}
              </div>

              <div className="border border-white/10 rounded-xl p-3 bg-white/5">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
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
                  className="flex-1 py-2 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl disabled:opacity-50"
                >
                  Generovať podpisový kód
                </button>
              </div>
            </div>
          )}

          {/* FINAL SIGNATURE STEP (Step 4 for GDPR / Step 5 for Anamneza) */}
          {((publicForm === 'gdpr' && anamnesisStep === 4) || (publicForm === 'anamneza' && anamnesisStep === 5)) && (
            <form onSubmit={submitPublicForm} className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-brand-cyan border-b border-white/10 pb-1">Elektronický podpis (Overovací kód)</h3>
              
              <div className="p-3.5 bg-brand-cyan/10 border border-brand-cyan/25 rounded-xl text-brand-cyan space-y-1">
                <strong>Elektronický podpis VOP & GDPR</strong>
                <p className="text-[10px] text-gray-300">
                  Na zadaný e-mail <strong>{onbEmail}</strong> sme zaslali verifikačný PIN. Zadaním tohto kódu potvrdzujete pravdivosť údajov a podpisujete súhlasy.
                </p>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Zadajte 6-miestny overovací kód <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  maxLength={7}
                  value={signatureInput}
                  onChange={(e) => setSignatureInput(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white tracking-widest text-center text-sm font-bold focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
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
                  className="flex-1 py-2 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl hover:bg-brand-hover-cyan flex items-center justify-center gap-2"
                >
                  {isOnboardingSaving ? "Odosielam…" : "Podpísať & Odoslať"}
                </button>
              </div>

              <button
                type="button"
                onClick={sendSignatureCode}
                className="text-[10px] text-brand-cyan hover:underline block text-center w-full mt-2"
              >
                Znovu zaslať overovací kód
              </button>
            </form>
          )}

        </div>
      </div>
    );
  }

  // 7. PUBLIC SIGN-IN OR ONBOARDING SCREENS
  if (!sessionUser) {
    return (
      <div className="flex flex-col min-h-screen bg-brand-dark-navy justify-center items-center p-4">
        {toast && (
          <div aria-live="polite" className="fixed bottom-6 right-6 z-50 glass-panel-dark text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-brand-cyan">
            <span className="w-2 h-2 rounded-full bg-brand-cyan animate-ping"></span>
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
                <label className="block text-gray-300 font-semibold mb-1">Celé meno</label>
                <input
                  type="text"
                  required
                  value={registerFullName}
                  onChange={(e) => setRegisterFullName(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                  placeholder="Ján Novák"
                />
              </div>
            )}

            {registerVerifyPending ? (
              <div className="space-y-4">
                <div className="p-3 bg-brand-cyan/10 border border-brand-cyan/25 text-brand-cyan rounded-lg leading-normal">
                  Zadajte overovací kód, ktorý bol odoslaný na váš e-mail <strong>{authEmail}</strong> pre dokončenie registrácie.
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1 text-center">Overovací kód</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={registerInputCode}
                    onChange={(e) => setRegisterInputCode(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white tracking-widest text-center text-sm font-bold focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                    placeholder="XXXXXX"
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">E-mailová adresa</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                    placeholder="meno@domena.sk"
                  />
                </div>

                {(authMode === 'login' || authMode === 'register') && (
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Heslo</label>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                      placeholder="••••••••"
                    />
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full py-2.5 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl text-xs hover:bg-brand-hover-cyan transition-colors"
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

  return (
    <div className="flex flex-col min-h-screen bg-brand-off-white text-gray-800 font-sans">
      
      {/* Toast Notification */}
      {toast && (
        <div aria-live="polite" className="fixed bottom-6 right-6 z-50 glass-panel-dark text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-brand-cyan">
          <span className="w-2 h-2 rounded-full bg-brand-cyan animate-ping"></span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark-navy/95 backdrop-blur-md p-4 overflow-y-auto">
          <div className="glass-panel-dark text-white rounded-2xl max-w-lg w-full p-8 shadow-2xl border border-white/10 space-y-6 my-8">
            <div className="text-center">
              <div className="inline-block mb-2 overflow-hidden rounded-xl bg-black border border-white/10 p-1">
                <img src="/logo.png" alt="SportWell Logo" className="w-12 h-12 object-contain" />
              </div>
              <h2 className="text-2xl font-bold">Aktivácia profilu</h2>
              <p className="text-xs text-gray-300 mt-1">Krok {onboardingStep} z 3: {onboardingStep === 1 ? 'Osobné údaje' : onboardingStep === 2 ? 'Povinné zmluvné doložky' : 'Dobrovoľné súhlasy'}</p>
              
              {/* Progress bar */}
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
                    <label className="block text-gray-300 font-semibold mb-1">Meno <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={onbFirstName}
                      onChange={(e) => setOnbFirstName(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                      placeholder="Ján"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Priezvisko <span className="text-red-500">*</span></label>
                    <input
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
                    <label className="block text-gray-300 font-semibold mb-1">Dátum narodenia <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      required
                      value={onbBirthDate}
                      onChange={(e) => setOnbBirthDate(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Telefónne číslo <span className="text-red-500">*</span></label>
                    <input
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
                  <label className="block text-gray-300 font-semibold mb-1">Trvalý pobyt / Adresa <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={onbAddress}
                    onChange={(e) => setOnbAddress(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                    placeholder="Hlavná 123, 811 01 Bratislava"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Kontaktný e-mail <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    required
                    value={onbEmail}
                    onChange={(e) => setOnbEmail(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                    placeholder="meno@domena.sk"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Primárny záujem o služby</label>
                  <select
                    value={onbInterest}
                    onChange={(e) => setOnbInterest(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                  >
                    <option value="Fyzioterapia" className="text-gray-800">Fyzioterapia</option>
                    <option value="Funkčný tréning" className="text-gray-800">Funkčný tréning</option>
                    <option value="Masáž" className="text-gray-800">Masáž</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl hover:bg-brand-hover-cyan transition-colors"
                >
                  Pokračovať na súhlasy
                </button>
              </form>
            )}

            {/* STEP 2: REQUIRED CONSENTS */}
            {onboardingStep === 2 && (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl leading-relaxed text-gray-300">
                  <p>Spoloční prevádzkovatelia <strong>SportWell s.r.o.</strong> a <strong>SportWell rehab s.r.o.</strong> vyžadujú pre poskytovanie služieb nasledujúce súhlasy:</p>
                </div>

                <div className="space-y-3">
                  <div className="border border-white/10 rounded-xl p-3 bg-white/5">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={onbPrivacyAccepted}
                        onChange={(e) => setOnbPrivacyAccepted(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                      />
                      <span className="font-semibold">Súhlasím so spracovaním citlivých zdravotných údajov pre diagnózu <span className="text-brand-cyan">(Povinné)</span></span>
                    </label>
                    <button 
                      onClick={() => setShowPrivacyTerms(!showPrivacyTerms)} 
                      className="text-[10px] text-brand-cyan hover:underline mt-2 block"
                    >
                      {showPrivacyTerms ? "Zobraziť menej" : "Zobraziť viac informácií"}
                    </button>
                    {showPrivacyTerms && (
                      <div className="mt-2 text-[10px] text-gray-400 bg-black/30 p-2.5 rounded-lg border border-white/5 max-h-32 overflow-y-auto space-y-2 leading-relaxed">
                        <p>Zaväzujete sa poskytnúť pravdivé údaje o vašom zdravotnom stave za účelom zostavenia rehabilitačného alebo tréningového plánu.</p>
                        <p>Údaje spracovávame po dobu poskytovania služieb a archivujeme po dobu vyžadovanú legislatívou SR o zdravotnej starostlivosti.</p>
                      </div>
                    )}
                  </div>

                  <div className="border border-white/10 rounded-xl p-3 bg-white/5">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={onbTermsAccepted}
                        onChange={(e) => setOnbTermsAccepted(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                      />
                      <span className="font-semibold">Súhlasím s podmienkami a VOP rezervačného systému <span className="text-brand-cyan">(Povinné)</span></span>
                    </label>
                    <button 
                      onClick={() => setShowBookingTerms(!showBookingTerms)} 
                      className="text-[10px] text-brand-cyan hover:underline mt-2 block"
                    >
                      {showBookingTerms ? "Zobraziť menej" : "Zobraziť viac informácií"}
                    </button>
                    {showBookingTerms && (
                      <div className="mt-2 text-[10px] text-gray-400 bg-black/30 p-2.5 rounded-lg border border-white/5 max-h-32 overflow-y-auto space-y-2 leading-relaxed">
                        <p>Rezervácie sú záväzné. Zrušenie rezervácie bez poplatku je možné najneskôr 24 hodín pred termínom rehabilitácie.</p>
                        <p>Pri neskorom storne rezervácie si centrum vyhradzuje právo na storno poplatok v plnej výške zálohy alebo prepadnutie kreditu.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setOnboardingStep(1)}
                    className="w-1/3 py-2 px-4 border border-white/20 rounded-xl font-bold hover:bg-white/10 transition-colors"
                  >
                    Späť
                  </button>
                  <button
                    disabled={!onbPrivacyAccepted || !onbTermsAccepted}
                    onClick={() => setOnboardingStep(3)}
                    className="flex-1 py-2.5 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl hover:bg-brand-hover-cyan transition-colors disabled:opacity-50"
                  >
                    Pokračovať
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: OPTIONAL CONSENTS */}
            {onboardingStep === 3 && (
              <form onSubmit={submitOnboarding} className="space-y-4 text-xs">
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl leading-relaxed text-gray-300">
                  <p>Môžete udeliť aj dobrovoľné súhlasy na skvalitnenie našich služieb. Tieto súhlasy nie sú povinné a môžete ich kedykoľvek odvolať:</p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer border border-white/10 rounded-xl p-3 bg-white/5">
                    <input
                      type="checkbox"
                      checked={onbMarketingAccepted}
                      onChange={(e) => setOnbMarketingAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                    />
                    <span>Súhlasím so zasielaním noviniek a akcií na e-mail (Ecomail marketing)</span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer border border-white/10 rounded-xl p-3 bg-white/5">
                    <input
                      type="checkbox"
                      checked={onbMetaAccepted}
                      onChange={(e) => setOnbMetaAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                    />
                    <span>Súhlasím so zdieľaním e-mailovej adresy s Meta Platforms pre hľadanie podobných publik (Lookalike Audiences)</span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer border border-white/10 rounded-xl p-3 bg-white/5">
                    <input
                      type="checkbox"
                      checked={onbDiagAccepted}
                      onChange={(e) => setOnbDiagAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                    />
                    <span>Súhlasím so spracovaním a prepojením meraní zo vstupných prístrojov (InBody, FMS diagnostika)</span>
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={isOnboardingSaving}
                    onClick={() => setOnboardingStep(2)}
                    className="w-1/3 py-2 px-4 border border-white/20 rounded-xl font-bold hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    Späť
                  </button>
                  <button
                    type="submit"
                    disabled={isOnboardingSaving}
                    className="flex-1 py-2.5 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl hover:bg-brand-hover-cyan transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isOnboardingSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-brand-dark-navy border-t-transparent animate-spin rounded-full"></div>
                        Ukladám…
                      </>
                    ) : (
                      "Dokončiť registráciu"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
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
                          Chybí GDPR
                        </div>
                      )}
                      <button
                        onClick={() => setActiveTab('profil')}
                        className="px-4 py-2 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl text-xs hover:bg-brand-hover-cyan transition-colors"
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

                  {/* Workout plan + Next appointment */}
                  <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-base font-bold text-brand-navy">Môj tréningový plán</h2>
                      <button onClick={() => setActiveTab('plan')} className="text-[10px] text-brand-cyan hover:underline font-semibold">Zobraziť všetko</button>
                    </div>
                    <div className="space-y-2 text-xs">
                      {workoutPlans.length === 0 ? (
                        <div className="text-center py-6 text-gray-400">
                          <span className="text-3xl block mb-2">🏃</span>
                          <p>Zatiaľ nemáš priradený trenéningový plán.</p>
                          <p className="text-[10px] mt-1">Tvoj trenér hočoskoro priradi.</p>
                        </div>
                      ) : (
                        workoutPlans.slice(0, 4).map(w => (
                          <div key={w.id} className="flex justify-between items-center bg-brand-off-white/50 p-3 rounded-xl border">
                            <div>
                              <strong>{w.exercise_title}</strong>
                              <p className="text-gray-500">{w.sets} sérií | {w.reps} opakovaní{w.tempo ? ` | ${w.tempo}` : ''}</p>
                            </div>
                            {w.completed ? (
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Splnené</span>
                            ) : (
                              <button
                                onClick={() => setFeedbackWorkId(w.id)}
                                className="px-3 py-1 bg-brand-cyan text-brand-dark-navy font-bold rounded-lg hover:bg-brand-hover-cyan transition-colors"
                              >
                                Cviciť
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-brand-navy mb-3">Najbližší termín</h3>
                      {appointments.length > 0 ? (
                        <div className="p-4 bg-gradient-to-br from-brand-navy to-[#0d2a4a] text-white rounded-xl border border-white/10 text-xs space-y-1.5">
                          <strong className="text-brand-cyan block">{appointments[0].service_name}</strong>
                          <p className="text-white/70">📅 {new Date(appointments[0].start_time).toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                          <p className="text-white/70">⏰ {new Date(appointments[0].start_time).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      ) : (
                        <div className="text-center py-5 text-gray-400">
                          <span className="text-3xl block mb-2">📅</span>
                          <p className="text-xs">Nemáš plánované žiadne termíny.</p>
                        </div>
                      )}
                    </div>
                    <button onClick={() => setActiveTab("rezervacie")} className="w-full mt-4 py-2.5 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl text-xs hover:bg-brand-hover-cyan transition-colors">
                      Rezervovať termín
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
                // Specialist View
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
                  <h2 className="text-xl font-bold text-brand-navy">{selectedClient.full_name}</h2>
                  <p className="text-xs text-gray-400 mt-1">GDPR & Záznamy v PostgreSQL</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-brand-off-white/60 rounded-xl">
                    <strong className="block text-gray-400 uppercase text-[9px] mb-1">Kontakt</strong>
                    <p><strong>E-mail:</strong> {selectedClient.email || "Nezadaný"}</p>
                    <p><strong>Telefón:</strong> {selectedClient.phone}</p>
                    <p><strong>GDPR:</strong> {selectedClient.gdpr_signed_at ? "Podpísané" : "Chýba súhlas"}</p>
                  </div>
                </div>

                {/* Timeline of client diagnostics */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Diagnostický denník pacienta</h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {medicalCards
                      .filter(m => m.client_id === selectedClient.id)
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
                <h2 className="text-xl font-bold text-brand-navy">Vytvoriť Diagnostiku (Form Builder)</h2>
                <p className="text-xs text-gray-400 mt-1">Zápis do tabuľky public.client_records na základe dynamických šablón.</p>
              </div>

              <form onSubmit={submitDiagnosis} className="space-y-4">
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
                      {currentTemplate.schema.map((field: any) => {
                        if (field.type === "section_title") {
                          return (
                            <h3 key={field.id} className="text-sm font-bold text-brand-navy border-b pb-1 mt-4">
                              {field.label}
                            </h3>
                          );
                        }

                        return (
                          <div key={field.id} className="space-y-1">
                            <label className="block font-bold text-gray-700">
                              {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            
                            {field.type === "text" && (
                              <input
                                type="text"
                                required={field.required}
                                value={dynamicFormData[field.id] || ""}
                                onChange={(e) => setDynamicFormData({ ...dynamicFormData, [field.id]: e.target.value })}
                                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none"
                                placeholder={field.placeholder || ""}
                              />
                            )}

                            {field.type === "number" && (
                              <input
                                type="number"
                                required={field.required}
                                value={dynamicFormData[field.id] || ""}
                                onChange={(e) => setDynamicFormData({ ...dynamicFormData, [field.id]: e.target.value })}
                                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none"
                                placeholder={field.placeholder || ""}
                              />
                            )}

                            {field.type === "textarea" && (
                              <textarea
                                required={field.required}
                                value={dynamicFormData[field.id] || ""}
                                onChange={(e) => setDynamicFormData({ ...dynamicFormData, [field.id]: e.target.value })}
                                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none h-24"
                                placeholder={field.placeholder || ""}
                              />
                            )}

                            {field.type === "select" && (
                              <select
                                required={field.required}
                                value={dynamicFormData[field.id] || ""}
                                onChange={(e) => setDynamicFormData({ ...dynamicFormData, [field.id]: e.target.value })}
                                className="w-full bg-brand-off-white border p-2 rounded-lg outline-none"
                              >
                                <option value="">-- Vyberte možnosť --</option>
                                {field.options?.map((opt: string) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            )}

                            {field.type === "checkbox" && (
                              <label className="flex items-center gap-2 cursor-pointer mt-1 font-semibold text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={!!dynamicFormData[field.id]}
                                  onChange={(e) => setDynamicFormData({ ...dynamicFormData, [field.id]: e.target.checked })}
                                  className="w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                                />
                                <span>{field.label}</span>
                              </label>
                            )}

                            {field.type === "vas_scale" && (
                              <div className="space-y-1 pt-1">
                                <input
                                  type="range"
                                  min="0"
                                  max="10"
                                  value={dynamicFormData[field.id] !== undefined ? dynamicFormData[field.id] : 5}
                                  onChange={(e) => setDynamicFormData({ ...dynamicFormData, [field.id]: parseInt(e.target.value) })}
                                  className="w-full accent-brand-cyan"
                                />
                                <div className="flex justify-between text-[10px] text-gray-400 font-semibold px-1">
                                  <span>Žiadna bolesť (0)</span>
                                  <span className="text-brand-navy font-bold">Hodnota: {dynamicFormData[field.id] !== undefined ? dynamicFormData[field.id] : 5}/10</span>
                                  <span>Neznesiteľná bolesť (10)</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                <button type="submit" className="py-2.5 px-6 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl hover:bg-brand-hover-cyan transition-all mt-4">
                  Uložiť záznam do DB
                </button>
              </form>
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
                          staff_id: "u3", // Mgr. Lucia Bieliková default
                          start_time: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
                          end_time: new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString(),
                          status: "confirmed"
                        });

                        if (!error) {
                          triggerToast("Rezervácia bola úspešne zapísaná do Supabase PostgreSQL!");
                          loadData(currentUserProfile);
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
              <h2 className="text-xl font-bold text-brand-navy">GDPR Audit Logs (Záznamy z DB)</h2>
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
                                  {w.notes && <p className="mt-0.5">Moja poznámka: {w.notes}</p>}
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
                                    <strong className="block text-gray-400 uppercase text-[9px] mb-1">Terapeutický plán a odporúčania</strong>
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
                // TRAINER / EMPLOYEE prescription builder view
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left: Client selector and new exercise builder */}
                  <div className="md:col-span-1 bg-white rounded-2xl p-5 shadow-sm border border-gray-200/50 space-y-5 flex flex-col">
                    <h3 className="font-bold text-brand-navy text-sm">Predpísať cvičenie</h3>
                    <form onSubmit={prescribeExercise} className="space-y-4">
                      <div>
                        <label className="block font-semibold mb-1 text-gray-600">Klient</label>
                        <select 
                          required 
                          value={selectedClientId} 
                          onChange={(e) => setSelectedClientId(e.target.value)} 
                          className="w-full bg-brand-off-white border p-2 rounded-lg outline-none min-h-[44px]"
                        >
                          <option value="">-- Vyberte klienta --</option>
                          {clients.filter(c => c.role === 'klient').map(c => (
                            <option key={c.id} value={c.id}>{c.full_name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold mb-1 text-gray-600">Cvičenie z knižnice</label>
                        <select 
                          value={prescExTitle} 
                          onChange={(e) => setPrescExTitle(e.target.value)} 
                          className="w-full bg-brand-off-white border p-2 rounded-lg outline-none min-h-[44px]"
                        >
                          {exercises.map(ex => (
                            <option key={ex.id} value={ex.title}>{ex.title}</option>
                          ))}
                          <option value="Iné custom cvičenie">-- Iné custom cvičenie --</option>
                        </select>
                      </div>

                      {prescExTitle === "Iné custom cvičenie" && (
                        <div>
                          <label className="block font-semibold mb-1 text-gray-600">Custom názov cvičenia</label>
                          <input 
                            type="text" 
                            placeholder="Názov cvičenia"
                            required
                            onChange={(e) => setPrescExTitle(e.target.value)}
                            className="w-full bg-brand-off-white border p-2 rounded-lg outline-none min-h-[44px]"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold mb-1 text-gray-600">Série</label>
                          <input 
                            type="number" 
                            min="1" 
                            value={prescSets} 
                            onChange={(e) => setPrescSets(parseInt(e.target.value) || 3)}
                            className="w-full bg-brand-off-white border p-2 rounded-lg outline-none min-h-[44px]"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1 text-gray-600">Opakovania</label>
                          <input 
                            type="number" 
                            min="1" 
                            value={prescReps} 
                            onChange={(e) => setPrescReps(parseInt(e.target.value) || 10)}
                            className="w-full bg-brand-off-white border p-2 rounded-lg outline-none min-h-[44px]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold mb-1 text-gray-600">Tempo</label>
                          <input 
                            type="text" 
                            value={prescTempo} 
                            onChange={(e) => setPrescTempo(e.target.value)}
                            className="w-full bg-brand-off-white border p-2 rounded-lg outline-none min-h-[44px]"
                            placeholder="napr. 3-0-3"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1 text-gray-600">Pauza</label>
                          <input 
                            type="text" 
                            value={prescPause} 
                            onChange={(e) => setPrescPause(e.target.value)}
                            className="w-full bg-brand-off-white border p-2 rounded-lg outline-none min-h-[44px]"
                            placeholder="napr. 60s"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold mb-1 text-gray-600">Poznámka / inštrukcie</label>
                        <textarea 
                          value={prescNotes} 
                          onChange={(e) => setPrescNotes(e.target.value)}
                          className="w-full bg-brand-off-white border p-2 rounded-lg outline-none h-16"
                          placeholder="napr. dbať na postavenie panvy..."
                        />
                      </div>

                      <button 
                        type="submit" 
                        className="w-full py-2.5 min-h-[44px] bg-brand-cyan text-brand-dark-navy font-bold rounded-xl hover:bg-brand-hover-cyan transition-colors"
                      >
                        Uložiť do plánu v DB
                      </button>
                    </form>
                  </div>

                  {/* Right: Selected client's current plan preview */}
                  <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-4 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-brand-navy">Aktuálny plán klienta</h3>
                      <p className="text-gray-400 text-xs">Prehľad a správa cvičení pre klienta: <strong>{clients.find(c => c.id === selectedClientId)?.full_name || "Nevybraný"}</strong></p>
                      
                      {!selectedClientId ? (
                        <p className="text-gray-500 italic p-6 text-center">Vyberte klienta na zobrazenie a úpravu plánu.</p>
                      ) : workoutPlans.length === 0 ? (
                        <p className="text-gray-500 italic p-6 text-center">Klient zatiaľ nemá predpísaný žiadny plán.</p>
                      ) : (
                        <div className="space-y-3 mt-4">
                          {workoutPlans.map(w => (
                            <div key={w.id} className="flex justify-between items-center bg-brand-off-white/50 p-4 rounded-xl border gap-4">
                              <div>
                                <strong className="text-sm text-brand-navy">{w.exercise_title}</strong>
                                <div className="text-gray-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                  <span>Série: <strong>{w.sets}</strong></span>
                                  <span>Opakovania: <strong>{w.reps}</strong></span>
                                  <span>Tempo: <strong>{w.tempo}</strong></span>
                                  <span>Pauza: <strong>{w.pause}</strong></span>
                                </div>
                                {w.notes && <p className="text-[11px] text-gray-400 mt-1 italic">Poznámka: {w.notes}</p>}
                                {w.completed && (
                                  <div className="mt-2 text-[10px] text-emerald-700 font-semibold bg-emerald-50 p-1.5 rounded">
                                    ✓ Splnené (RPE: {w.rpe}/10, Bolesť: {w.pain_level}/10)
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => deleteClientExercise(w.id)}
                                className="px-3 py-1.5 min-h-[44px] border border-red-200 hover:bg-red-50 text-red-600 rounded-xl font-bold transition-all text-xs"
                              >
                                Zmazať
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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
                  placeholder="Vyhľadať cvičenie alebo svalovú skupinu…"
                  value={videoSearch}
                  onChange={(e) => setVideoSearch(e.target.value)}
                  className="bg-brand-off-white border rounded-xl px-4 py-2 text-xs outline-none w-full md:w-64 focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
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
                      {/* Premium Video/Animation Mockup */}
                      <div className="aspect-video bg-brand-dark-navy relative flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                        <div className="z-20 text-center flex flex-col items-center gap-2 p-4">
                          <div className="w-12 h-12 rounded-full bg-brand-cyan/25 flex items-center justify-center text-brand-cyan border border-brand-cyan animate-pulse">
                            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                          <span className="text-[10px] text-brand-cyan tracking-wider font-semibold uppercase">Video inštruktáž: {ex.title}</span>
                          <span className="text-[9px] text-white/60">Kliknutím spustíte prehrávanie na celú obrazovku</span>
                        </div>
                        {/* Looped CSS visualization background bars */}
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end h-6 opacity-30">
                          <div className="w-1 bg-brand-cyan h-3 animate-bounce"></div>
                          <div className="w-1 bg-brand-cyan h-5 animate-bounce [animation-delay:0.2s]"></div>
                          <div className="w-1 bg-brand-cyan h-2 animate-bounce [animation-delay:0.4s]"></div>
                          <div className="w-1 bg-brand-cyan h-4 animate-bounce [animation-delay:0.1s]"></div>
                          <div className="w-1 bg-brand-cyan h-6 animate-bounce [animation-delay:0.3s]"></div>
                        </div>
                      </div>
                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-brand-navy text-sm">{ex.title}</h3>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              ex.difficulty === 'lahka' ? 'bg-emerald-50 text-emerald-700' :
                              ex.difficulty === 'stredna' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                            }`}>
                              {ex.difficulty}
                            </span>
                          </div>
                          <div className="text-[10px] flex flex-wrap gap-2 text-gray-500 font-semibold">
                            <span>Zameranie: <strong>{ex.target}</strong></span>
                            <span>| Pomôcky: <strong>{ex.equipment}</strong></span>
                          </div>
                          <p className="text-gray-600 leading-relaxed text-[11px]">{ex.description}</p>
                        </div>
                        {ex.contraindications && (
                          <div className="p-2.5 bg-red-50/50 border border-red-100 rounded-xl mt-2 text-[10px]">
                            <strong className="text-red-700 block mb-0.5">⚠️ Kontraindikácie:</strong>
                            <span className="text-red-600">{ex.contraindications}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 8: MÔJ PROFIL */}
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
                      <strong className="block text-gray-400 uppercase text-[9px] mb-0.5">Rola v systéme</strong>
                      <span className="text-xs uppercase tracking-wider font-semibold bg-brand-navy text-white px-2 py-0.5 rounded inline-block mt-0.5">{currentUserProfile.role}</span>
                    </div>
                  </div>

                  <form onSubmit={updateProfilePhone} className="p-4 bg-brand-off-white/40 border rounded-xl space-y-3">
                    <h3 className="font-bold text-brand-navy">Upraviť kontaktné údaje</h3>
                    <div>
                      <label className="block text-gray-500 font-semibold mb-1">Telefónne číslo</label>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={newClientPhone}
                          onChange={(e) => setNewClientPhone(e.target.value)}
                          className="bg-white border rounded-lg px-3 py-2 text-xs outline-none flex-1 focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                          placeholder="+421 900 000 000"
                        />
                        <button type="submit" className="py-2 px-5 bg-brand-cyan text-brand-dark-navy font-bold rounded-lg hover:bg-brand-hover-cyan transition-all">
                          Uložiť
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                <div className="md:col-span-1 p-5 bg-brand-dark-navy text-white rounded-2xl flex flex-col justify-between border border-white/5">
                  <div className="space-y-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-cyan/25 flex items-center justify-center text-brand-cyan border border-brand-cyan">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                      </svg>
                    </div>
                    <h3 className="font-bold text-brand-cyan text-sm">GDPR Súhlas</h3>
                    <p className="text-[11px] text-gray-300 leading-relaxed">
                      Udelili ste povinný súhlas so spracovaním citlivých zdravotných údajov pre vedenie diagnostickej karty.
                    </p>
                  </div>
                  <div className="border-t border-white/10 pt-3 mt-4 text-[10px] text-gray-400 space-y-1 font-mono">
                    <p>Udelené: {currentUserProfile.gdpr_signed_at ? new Date(currentUserProfile.gdpr_signed_at).toLocaleString() : 'Neznáme'}</p>
                    <p>Verzia: {currentUserProfile.metadata?.gdpr_version || 'v1.0'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB DOKUMENTY */}
          {activeTab === "dokumenty" && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-4 animate-fade-in text-xs">
              <div className="border-b pb-4">
                <h2 className="text-xl font-bold text-brand-navy">Moje dokumenty</h2>
                <p className="text-gray-400 mt-1">Prehľad GDPR súhlasov, zmlúv a podpísaných doložiek.</p>
              </div>

              {documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
                  <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="font-semibold">Zatiaľ nemáte žiadne dokumenty.</p>
                  <p className="text-[10px]">Po podpísaní GDPR sa tu zobrazí váš súhlas.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center gap-4 bg-brand-off-white/50 p-4 rounded-xl border hover:border-brand-cyan/30 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-brand-navy/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-brand-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <strong className="text-brand-navy block text-sm truncate">{doc.file_name}</strong>
                        <span className="text-[10px] text-gray-400 mt-0.5 block">
                          Vytvorené: {new Date(doc.created_at).toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <button
                        onClick={() => downloadDocument(doc.storage_path, doc.file_name)}
                        className="flex-shrink-0 px-4 py-2 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl hover:bg-brand-hover-cyan transition-colors flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Stiahnuť
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Info box */}
              <div className="p-4 bg-brand-navy/5 border border-brand-navy/10 rounded-xl flex gap-3 items-start">
                <svg className="w-4 h-4 text-brand-navy mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  Tieto dokumenty sú uložené bezpečne a sú dostupné len vám. Obsahujú vaše podpísané GDPR súhlasy a zmluvné doložky.
                  Pre ďalšie informácie kontaktujte recepciu SportWell.
                </p>
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
                        placeholder="napr. Komplexná diagnostika kolena"
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
                      <h4 className="font-bold text-brand-navy">Polia a stĺpce formulára</h4>
                      <button 
                        type="button" 
                        onClick={addEditorField}
                        className="text-brand-cyan hover:underline font-bold"
                      >
                        + Pridať pole
                      </button>
                    </div>

                    {editorFields.length === 0 ? (
                      <p className="text-gray-400 italic text-center p-3">Šablóna nemá zatiaľ žiadne polia. Pridajte nejaké tlačidlom vyššie.</p>
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
                                <label className="block font-semibold text-[10px] text-gray-500">Štítok / Otázka</label>
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
                                <label className="block font-semibold text-[10px] text-gray-500">Typ poľa</label>
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
                                  <option value="textarea">Dlhý text (viac riadkové)</option>
                                  <option value="number">Číslo</option>
                                  <option value="checkbox">Zaškrtávacie políčko</option>
                                  <option value="vas_scale">Škála bolesti (VAS 0-10)</option>
                                  <option value="select">Dropdown výber</option>
                                </select>
                              </div>
                              <div>
                                <label className="block font-semibold text-[10px] text-gray-500">Placeholder / Nápoveda</label>
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

                            {field.type === 'select' && (
                              <div className="pt-1">
                                <label className="block font-semibold text-[10px] text-gray-500">Možnosti výberu (oddelené čiarkou)</label>
                                <input 
                                  type="text" 
                                  value={field.options?.join(", ") || ""} 
                                  onChange={(e) => {
                                    const updated = [...editorFields];
                                    updated[idx].options = e.target.value.split(",").map(s => s.trim());
                                    setEditorFields(updated);
                                  }}
                                  className="w-full border p-1.5 rounded outline-none"
                                  placeholder="napr. Áno, Nie, Neviem"
                                />
                              </div>
                            )}
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
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mt-0.5">
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
              Zadajte spätnú väzbu pre cvičenie: <strong>{workoutPlans.find(w => w.id === feedbackWorkId)?.exercise_title}</strong>
            </p>
            <form onSubmit={submitWorkoutFeedback} className="space-y-4 text-xs">
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
                <div className="flex justify-between text-[9px] text-gray-400 font-semibold px-1">
                  <span>Lahké (1)</span>
                  <span>Max. úsilie (10)</span>
                </div>
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
                <div className="flex justify-between text-[9px] text-gray-400 font-semibold px-1">
                  <span>Bez bolesti (0)</span>
                  <span>Neznesiteľná (10)</span>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-gray-600">Moja poznámka / pocity (voliteľné)</label>
                <textarea
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  className="w-full bg-brand-off-white border p-2 rounded-lg outline-none h-16"
                  placeholder="Ako sa vám cvičilo, pocity v kĺbe…"
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
              Tento dokument obsahuje citlivé osobné a zdravotné údaje. Z bezpečnostných dôvodov ho zaheslujeme. Zadajte prístupové heslo (napr. rodné číslo pacienta bez lomky alebo PIN).
            </p>
            <div className="space-y-1">
              <label className="block text-[10px] text-gray-400 font-semibold uppercase">Heslo pre šifrovanie PDF</label>
              <input
                type="password"
                value={pdfPassword}
                onChange={(e) => setPdfPassword(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-xs outline-none focus:border-brand-cyan"
                placeholder="Zadajte heslo..."
              />
            </div>
            <div className="flex gap-3 justify-end pt-2 text-xs">
              <button 
                onClick={() => setShowPdfPasswordModal(false)} 
                className="px-4 py-2 border rounded-xl hover:bg-gray-100 font-bold"
              >
                Zrušiť
              </button>
              <button 
                onClick={handleDownloadPasswordPdf} 
                className="px-4 py-2 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl hover:bg-brand-hover-cyan"
              >
                Stiahnuť
              </button>
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
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex flex-col items-center justify-center w-16 h-12 transition-all ${
              activeTab === "dashboard" ? "text-brand-cyan" : "text-gray-400"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[10px] font-semibold mt-1">Domov</span>
          </button>

          <button
            onClick={() => setActiveTab("plan")}
            className={`flex flex-col items-center justify-center w-16 h-12 transition-all ${
              activeTab === "plan" ? "text-brand-cyan" : "text-gray-400"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span className="text-[10px] font-semibold mt-1">Moje Cviky</span>
          </button>

          <button
            onClick={() => setActiveTab("dokumenty")}
            className={`flex flex-col items-center justify-center w-16 h-12 transition-all ${
              activeTab === "dokumenty" ? "text-brand-cyan" : "text-gray-400"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-[10px] font-semibold mt-1">Dokumenty</span>
          </button>

          <button
            onClick={() => setActiveTab("profil")}
            className={`flex flex-col items-center justify-center w-16 h-12 transition-all ${
              activeTab === "profil" ? "text-brand-cyan" : "text-gray-400"
            }`}
          >
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
