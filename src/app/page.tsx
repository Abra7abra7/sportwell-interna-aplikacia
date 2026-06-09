"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";

// 1. DATA TYPES CONFIGURATION
interface ClientProfile {
  id: string;
  role: 'admin' | 'ortoped' | 'fyzioterapeut' | 'maser' | 'trener' | 'nutricny' | 'klient';
  first_name: string;
  last_name: string;
  phone: string;
  gdpr_accepted_at: string | null;
  gdpr_version: string | null;
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
  profiles_client?: { first_name: string; last_name: string };
  profiles_creator?: { first_name: string; last_name: string; role: string };
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
  profiles_client?: { first_name: string; last_name: string };
  profiles_staff?: { first_name: string; last_name: string; role: string };
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
  const [authMode, setAuthMode] = useState<'login' | 'reset'>('login');
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

  const [exercises] = useState<Exercise[]>([
    { id: "e1", title: "Mostík na jednej nohe", category: "Koleno / Core", target: "Gluteus, hamstringy", difficulty: "stredna", equipment: "Bez pomôcok", description: "Lež na chrbte, pokrč kolená. Zdvihni jednu nohu a vystri vystretú. Zodvihni panvu hore so stiahnutím zadku.", contraindications: "Akútna bolesť krížov" },
    { id: "e2", title: "Plank na lakťoch", category: "Core / Chrbát", target: "Hlboké brušné svalstvo", difficulty: "lahka", equipment: "Podložka", description: "Drž telo v jednej rovine na lakťoch a špičkách. Neprehýbaj sa v krížoch.", contraindications: "Vysoký krvný tlak" },
    { id: "e3", title: "Rotácia ramena s elastickou gumou", category: "Rameno", target: "Rotátorová manžeta", difficulty: "stredna", equipment: "Elastický pás", description: "Drž lakeť pri tele v uhle 90 stupňov. Pomaly rotuj predlaktie smerom von proti odporu gumy.", contraindications: "Akútny zápal ramena" }
  ]);

  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([
    { id: "w1", client_id: "c1", exercise_title: "Mostík na jednej nohe", sets: 3, reps: 10, tempo: "3-0-3", pause: "60s", notes: "Udržiavať panvu v rovine", completed: false },
    { id: "w2", client_id: "c1", exercise_title: "Plank na lakťoch", sets: 4, reps: 30, tempo: "Výdrž", pause: "45s", notes: "Nezadržiavať dych", completed: false }
  ]);

  // 4. INTERACTION FILTERS AND FORM VARIABLES
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
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

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // 5. DATA INTAKE & HYDRATION EFFECT
  useEffect(() => {
    setMounted(true);
    checkUserSession();
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
      // Fetch dependent lists
      loadData(data);
    } else {
      // Create a default profile if missing (fallback onboarding)
      const defaultProf: ClientProfile = {
        id: userId,
        role: "klient",
        first_name: "Nový",
        last_name: "Používateľ",
        phone: "",
        gdpr_accepted_at: null,
        gdpr_version: null
      };
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
    let query = supabase.from("medical_cards").select("*, profiles_client:client_id(first_name, last_name), profiles_creator:created_by(first_name, last_name, role)");
    if (profile.role === "klient") {
      query = query.eq("client_id", profile.id);
    }
    const { data: cards } = await query;
    if (cards) setMedicalCards(cards as any);

    // 3. Fetch Bookings
    let bookingQuery = supabase.from("reservations").select("*, profiles_client:client_id(first_name, last_name), profiles_staff:staff_id(first_name, last_name, role)");
    if (profile.role === "klient") {
      bookingQuery = bookingQuery.eq("client_id", profile.id);
    }
    const { data: appts } = await bookingQuery;
    if (appts) setAppointments(appts as any);
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
        { id: "plan", label: "Môj plán" },
        { id: "videa", label: "Videá" },
        { id: "rezervacie", label: "Rezervácie" },
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
      const matchSearch = `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;
      if (clientFilter === 'gdpr_missing') return !c.gdpr_accepted_at;
      if (clientFilter === 'inactive') return c.role === 'klient' && !c.gdpr_accepted_at;
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
        first_name: newClientFirst,
        last_name: newClientLast,
        phone: newClientPhone
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

  const submitDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile) return;

    const diagType = currentUserProfile.role === 'ortoped' ? 'ortoped' : currentUserProfile.role === 'fyzioterapeut' ? 'fyzio' : currentUserProfile.role === 'trener' ? 'trening' : 'nutricia';
    
    const { error } = await supabase.from("medical_cards").insert({
      client_id: selectedClientId || currentUserProfile.id,
      created_by: currentUserProfile.id,
      type: diagType,
      pain_map_data: [],
      form_data: {
        summary: diagSummary,
        field1: diagField1,
        field2: diagField2
      }
    });

    if (!error) {
      triggerToast("Diagnostický záznam bol bezpečne uložený do databázy.");
      loadData(currentUserProfile);
      setDiagSummary("");
      setDiagField1("");
      setDiagField2("");
    }
  };

  const createPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const srv = services.find(s => s.id === payServiceId);
    if (!srv) return;
    const newPay: Payment = {
      id: `p-${Date.now()}`,
      client_name: `${selectedClient.first_name} ${selectedClient.last_name}`,
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

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-off-white">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-navy border-t-transparent"></div>
      </div>
    );
  }

  // 7. PUBLIC SIGN-IN OR ONBOARDING SCREENS
  if (!sessionUser) {
    return (
      <div className="flex flex-col min-h-screen bg-brand-dark-navy justify-center items-center p-4">
        <div className="glass-panel-dark text-white rounded-2xl max-w-sm w-full p-8 shadow-2xl border border-white/10 space-y-6">
          <div className="text-center">
            <div className="inline-block p-4 rounded-xl brand-gradient mb-3">
              <span className="text-2xl font-bold">SW</span>
            </div>
            <h2 className="text-xl font-bold">SportWell Klientsky Portál</h2>
            <p className="text-xs text-gray-400 mt-1">Pre prístup k vašim diagnostikám a tréningom.</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
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

            {authMode === 'login' && (
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

            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full py-2.5 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl text-xs hover:bg-brand-hover-cyan transition-colors"
            >
              {isAuthLoading ? "Počkajte…" : authMode === 'login' ? "Prihlásiť sa" : "Aktivovať účet (Reset hesla)"}
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'reset' : 'login')}
              className="text-brand-cyan hover:underline text-[10px]"
            >
              {authMode === 'login' ? "Máte u nás účet z WordPressu? Aktivujte ho tu" : "Naspäť na prihlásenie"}
            </button>
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
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
              <span className="text-brand-navy font-bold text-xl">SW</span>
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

      {/* GDPR Concent Blocker if missing */}
      {currentUserProfile && currentUserProfile.role === "klient" && !currentUserProfile.gdpr_accepted_at && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark-navy/95 backdrop-blur-md p-4">
          <div className="glass-panel-dark text-white rounded-2xl max-w-lg w-full p-8 shadow-2xl border border-white/10 space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Aktivácia klientskeho profilu</h2>
              <p className="text-xs text-gray-300 mt-1">Pre prístup k vašej lekárskej karte musíte udeliť súhlas s GDPR.</p>
            </div>
            
            <div className="space-y-3 pt-3 border-t border-white/10 text-xs">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan accent-brand-cyan"
                  onChange={async (e) => {
                    if (e.target.checked) {
                      const { error } = await supabase
                        .from("profiles")
                        .update({
                          gdpr_accepted_at: new Date().toISOString(),
                          gdpr_version: "v1.0"
                        })
                        .eq("id", currentUserProfile.id);

                      if (!error) {
                        triggerToast("Súhlas s GDPR bol úspešne zaznamenaný.");
                        fetchUserProfile(currentUserProfile.id);
                      }
                    }
                  }}
                />
                <span>
                  Súhlasím so spracovaním citlivých zdravotných údajov pre účely diagnostiky a vedenia zdravotnej karty. <strong className="text-brand-cyan">(Povinné pre pokračovanie)</strong>
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Grid */}
      <div className="max-w-6xl mx-auto w-full px-4 py-8 flex flex-col md:flex-row gap-8 flex-1">
        
        {/* Navigation Sidebar */}
        <aside className="md:w-64 flex flex-col gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 px-3">Menu</h3>
            <nav className="flex flex-col gap-1">
              {navigationItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
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
                  <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-4">
                    <h2 className="text-xl font-bold text-brand-navy">Môj tréningový plán</h2>
                    <div className="space-y-2 text-xs">
                      {workoutPlans.map(w => (
                        <div key={w.id} className="flex justify-between items-center bg-brand-off-white/50 p-3 rounded-xl border">
                          <div>
                            <strong>{w.exercise_title}</strong>
                            <p className="text-gray-500">{w.sets} sérií | {w.reps} opakovaní</p>
                          </div>
                          {w.completed ? (
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">Splnené</span>
                          ) : (
                            <button
                              onClick={() => setFeedbackWorkId(w.id)}
                              className="px-3 py-1 bg-brand-cyan text-brand-dark-navy font-bold rounded-lg"
                            >
                              Cvičiť
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-brand-navy mb-2">Najbližší termín</h3>
                      {appointments.length > 0 ? (
                        <div className="p-3 bg-brand-off-white rounded-xl border text-xs">
                          <strong>{appointments[0].service_name}</strong>
                          <p className="text-gray-500 mt-1">Čas: {new Date(appointments[0].start_time).toLocaleString()}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">Nemáš plánované žiadne termíny.</p>
                      )}
                    </div>
                    <button onClick={() => setActiveTab("rezervacie")} className="w-full mt-4 py-2 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl text-xs hover:bg-brand-hover-cyan">
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
                      <span>{c.first_name} {c.last_name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-6">
                <div className="border-b pb-4">
                  <h2 className="text-xl font-bold text-brand-navy">{selectedClient.first_name} {selectedClient.last_name}</h2>
                  <p className="text-xs text-gray-400 mt-1">GDPR & Záznamy v PostgreSQL</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-brand-off-white/60 rounded-xl">
                    <strong className="block text-gray-400 uppercase text-[9px] mb-1">Kontakt</strong>
                    <p><strong>Telefón:</strong> {selectedClient.phone}</p>
                    <p><strong>GDPR:</strong> {selectedClient.gdpr_accepted_at ? "Podpísané" : "Chýba súhlas"}</p>
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
                        </div>
                      ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: DIAGNOSTIKA */}
          {activeTab === "diagnostika" && isEmployee && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-6 animate-fade-in">
              <div className="border-b pb-4">
                <h2 className="text-xl font-bold text-brand-navy">Vytvoriť Diagnostiku (PostgreSQL)</h2>
                <p className="text-xs text-gray-400 mt-1">Zápis do tabuľky public.medical_cards.</p>
              </div>

              <form onSubmit={submitDiagnosis} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1">Klient</label>
                    <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} className="w-full bg-brand-off-white border p-2 rounded-lg outline-none">
                      {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Zhrnutie nálezu</label>
                    <input type="text" required value={diagSummary} onChange={(e) => setDiagSummary(e.target.value)} className="w-full bg-brand-off-white border p-2 rounded-lg outline-none" placeholder="Zhrňujúca diagnóza…" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1">Hlavný popis diagnostiky</label>
                    <textarea required value={diagField1} onChange={(e) => setDiagField1(e.target.value)} className="w-full bg-brand-off-white border p-2 rounded-lg outline-none h-24" placeholder="Zadajte detailný popis…" />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Odporúčaný terapeutický plán</label>
                    <textarea required value={diagField2} onChange={(e) => setDiagField2(e.target.value)} className="w-full bg-brand-off-white border p-2 rounded-lg outline-none h-24" placeholder="Telesné obmedzenia, dĺžka cvičenia…" />
                  </div>
                </div>

                <button type="submit" className="py-2.5 px-6 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl hover:bg-brand-hover-cyan transition-all">
                  Uložiť diagnostiku do DB
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

      <footer className="bg-brand-dark-navy text-white/50 text-center py-6 text-xs border-t border-white/10 mt-auto">
        <p>© 2026 SportWell. Databáza prepojená s PostgreSQL.</p>
      </footer>
    </div>
  );
}
