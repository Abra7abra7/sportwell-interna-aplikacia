"use client";

import React, { useState, useMemo } from "react";

// 1. DATA TYPES CONFIGURATION
interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  last_visit: string;
  insurance: string;
  gdpr_accepted: boolean;
  gdpr_version: string | null;
  gdpr_accepted_at: string | null;
  diagnoses: string[];
  contraindications: string[];
  medications: string[];
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

interface ExaminationRecord {
  id: string;
  client_id: string;
  client_name: string;
  expert_name: string;
  type: 'ortoped' | 'fyzio' | 'trening' | 'nutricia';
  date: string;
  summary: string;
  fields: Record<string, string>;
}

interface Appointment {
  id: string;
  client_id: string;
  client_name: string;
  staff_id: string;
  staff_name: string;
  service_name: string;
  start_time: string;
  status: 'confirmed' | 'cancelled_by_client' | 'cancelled_by_staff' | 'no_show';
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

export default function CompleteSportWellApp() {
  // 2. ACTIVE USER/ROLE STATE
  const [activeRole, setActiveRole] = useState<'admin' | 'ortoped' | 'fyzioterapeut' | 'maser' | 'trener' | 'nutricny' | 'klient'>('klient');
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const isEmployee = activeRole !== "klient";
  const [toast, setToast] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };


  // 3. SEED DATABASES STATE
  const [clients, setClients] = useState<Client[]>([
    { id: "c1", first_name: "Roman", last_name: "Kováč", email: "roman.kovac@email.sk", phone: "+421 905 123 456", status: "active", last_visit: "2026-06-01", insurance: "Dôvera", gdpr_accepted: true, gdpr_version: "v1.0", gdpr_accepted_at: "2026-06-01T08:00:00Z", diagnoses: ["Bolesť krížov", "Distorzia pravého kolena"], contraindications: ["Extrémna rotácia trupu"], medications: ["Voltaren pri záťaži"] },
    { id: "c2", first_name: "Jana", last_name: "Novotná", email: "jana.novotna@email.sk", phone: "+421 908 999 888", status: "active", last_visit: "2026-05-28", insurance: "VšZP", gdpr_accepted: false, gdpr_version: null, gdpr_accepted_at: null, diagnoses: ["Skolióza", "Stuhnutý krk"], contraindications: ["Skoky", "Dopady"], medications: [] },
    { id: "c3", first_name: "Peter", last_name: "Baláž", email: "peter.balaz@email.sk", phone: "+421 907 444 555", status: "inactive", last_visit: "2026-04-12", insurance: "Union", gdpr_accepted: true, gdpr_version: "v1.0", gdpr_accepted_at: "2026-04-01T09:00:00Z", diagnoses: ["Ruptúra rotátorovej manžety"], contraindications: ["Tlaky nad hlavu"], medications: ["Novalgina"] }
  ]);

  const [services, setServices] = useState<Service[]>([
    { id: "s1", name: "Fyzioterapia - Vstupné vyšetrenie", price: 45, duration_min: 50, category: "fyzio" },
    { id: "s2", name: "Rehabilitačný tréning", price: 35, duration_min: 60, category: "trening" },
    { id: "s3", name: "Športová masáž chrbta", price: 25, duration_min: 30, category: "masaz" },
    { id: "s4", name: "Ortopedická konzultácia", price: 60, duration_min: 20, category: "ortoped" },
    { id: "s5", name: "Nutričná diagnostika", price: 40, duration_min: 45, category: "nutricia" }
  ]);

  const [payments, setPayments] = useState<Payment[]>([
    { id: "p1", client_name: "Roman Kováč", service_name: "Fyzioterapia - Vstupné vyšetrenie", amount: 45, method: "karta", invoice_number: "20260001", status: "zaplatene", created_at: "2026-06-01T09:00:00Z" },
    { id: "p2", client_name: "Peter Baláž", service_name: "Športová masáž chrbta", amount: 25, method: "hotovost", invoice_number: "20260002", status: "zaplatene", created_at: "2026-04-12T15:30:00Z" }
  ]);

  const [exercises] = useState<Exercise[]>([
    { id: "e1", title: "Mostík na jednej nohe", category: "Koleno / Core", target: "Gluteus, hamstringy", difficulty: "stredna", equipment: "Bez pomôcok", description: "Lež na chrbte, pokrč kolená. Zdvihni jednu nohu a vystri vystretú. Zodvihni panvu hore so stiahnutím zadku.", contraindications: "Akútna bolesť krížov" },
    { id: "e2", title: "Plank na lakťoch", category: "Core / Chrbát", target: "Hlboké brušné svalstvo", difficulty: "lahka", equipment: "Podložka", description: "Drž telo v jednej rovine na lakťoch a špičkách. Neprehýbaj sa v krížoch.", contraindications: "Vysoký krvný tlak" },
    { id: "e3", title: "Rotácia ramena s elastickou gumou", category: "Rameno", target: "Rotátorová manžeta", difficulty: "stredna", equipment: "Elastický pás", description: "Drž lakeť pri tele v uhle 90 stupňov. Pomaly rotuj predlaktie smerom von proti odporu gumy.", contraindications: "Akútny zápal ramena" }
  ]);

  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: "a1", client_id: "c1", client_name: "Roman Kováč", staff_id: "u3", staff_name: "Mgr. Lucia Bieliková", service_name: "Fyzioterapia - Vstupné vyšetrenie", start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), status: "confirmed" }, // ~2 hours away
    { id: "a2", client_id: "c1", client_name: "Roman Kováč", staff_id: "u5", staff_name: "Bc. Martin Švec", service_name: "Rehabilitačný tréning", start_time: new Date(Date.now() + 27 * 60 * 60 * 1000).toISOString(), status: "confirmed" } // ~27 hours away
  ]);

  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([
    { id: "w1", client_id: "c1", exercise_title: "Mostík na jednej nohe", sets: 3, reps: 10, tempo: "3-0-3", pause: "60s", notes: "Udržiavať panvu v rovine", completed: false },
    { id: "w2", client_id: "c1", exercise_title: "Plank na lakťoch", sets: 4, reps: 30, tempo: "Výdrž", pause: "45s", notes: "Nezadržiavať dych", completed: false }
  ]);

  const [examinations, setExaminations] = useState<ExaminationRecord[]>([
    { id: "ex1", client_id: "c1", client_name: "Roman Kováč", expert_name: "MUDr. Ján Stano (Ortopéd)", type: "ortoped", date: "2026-05-15", summary: "Distorzia kolena, podozrenie na meniscus", fields: { obj_nalez: "Opuch prítomný, palpácia kĺbovej štrbiny bolestivá.", odporucanie: "Šetriaci režim, MR kolenného kĺbu." } },
    { id: "ex2", client_id: "c1", client_name: "Roman Kováč", expert_name: "Mgr. Lucia Bieliková (Fyzio)", type: "fyzio", date: "2026-06-01", summary: "Znížený ROM krížov, svalová disbalancia", fields: { rom_testy: "Flexia obmedzená, bolesť v lumbálnej zóne.", terapia: "Manuálne uvoľnenie, predpis core cvičení." } }
  ]);

  const [auditLogs, setAuditLogs] = useState<any[]>([
    { id: "al1", user: "Administrátor", action: "CREATE", details: "Vytvorený profil používateľa Roman Kováč", date: "2026-06-01T08:00:00Z" }
  ]);

  // 4. INTERACTION FILTERS AND FORM VARIABLES
  const [selectedClientId, setSelectedClientId] = useState<string>("c1");
  const [searchTerm, setSearchTerm] = useState("");
  const [clientFilter, setClientFilter] = useState<'all' | 'gdpr_missing' | 'inactive'>('all');
  
  // Custom Form fields
  const [newClientFirst, setNewClientFirst] = useState("");
  const [newClientLast, setNewClientLast] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientInsurance, setNewClientInsurance] = useState("Dôvera");
  
  // Late cancellation confirmation state
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [isLateCancel, setIsLateCancel] = useState(false);

  // Specialist diagnostic form inputs
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

  // Payment creation (eKasa)
  const [payServiceId, setPayServiceId] = useState("s1");
  const [payMethod, setPayMethod] = useState<'karta' | 'hotovost'>("karta");

  // Client workout feedback
  const [feedbackWorkId, setFeedbackWorkId] = useState<string | null>(null);
  const [feedbackRpe, setFeedbackRpe] = useState(5);
  const [feedbackPain, setFeedbackPain] = useState(2);
  const [feedbackNote, setFeedbackNote] = useState("");

  const addAudit = (action: string, details: string) => {
    const activeName = activeRole === 'admin' ? "Administrátor" : activeRole === 'klient' ? "Roman Kováč" : "Odborný personál";
    setAuditLogs(prev => [
      { id: `al-${Date.now()}`, user: activeName, action, details, date: new Date().toISOString() },
      ...prev
    ]);
  };

  // 5. NAVIGATION OPTIONS MAPPING PER ROLE (Section 6 of plan)
  const navigationItems = useMemo(() => {
    if (activeRole === 'admin') {
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
    if (activeRole === 'klient') {
      return [
        { id: "dashboard", label: "Dashboard" },
        { id: "plan", label: "Môj plán" },
        { id: "videa", label: "Videá" },
        { id: "rezervacie", label: "Rezervácie" },
        { id: "profil", label: "Môj profil" }
      ];
    }
    // Specialists (Physio, Coach, Ortho, Nutritionist)
    return [
      { id: "dashboard", label: "Dashboard" },
      { id: "klienti", label: "Moji klienti" },
      { id: "diagnostika", label: "Diagnostika" },
      { id: "plan", label: "Domáce plány" },
      { id: "videokniznica", label: "Videoknižnica" },
      { id: "rezervacie", label: "Rezervácie" }
    ];
  }, [activeRole]);

  // Filtered clients list
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchSearch = `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;
      if (clientFilter === 'gdpr_missing') return !c.gdpr_accepted;
      if (clientFilter === 'inactive') return c.status === 'inactive';
      return true;
    });
  }, [clients, searchTerm, clientFilter]);

  // Selected client profile details
  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId) || clients[0];
  }, [clients, selectedClientId]);

  // 6. BUSINESS LOGIC HANDLERS
  const registerClient = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `c-${Date.now()}`;
    const newC: Client = {
      id: newId,
      first_name: newClientFirst,
      last_name: newClientLast,
      email: newClientEmail,
      phone: newClientPhone,
      status: 'active',
      last_visit: new Date().toISOString().split('T')[0],
      insurance: newClientInsurance,
      gdpr_accepted: false,
      gdpr_version: null,
      gdpr_accepted_at: null,
      diagnoses: [],
      contraindications: [],
      medications: []
    };
    setClients(prev => [...prev, newC]);
    setSelectedClientId(newId);
    addAudit("CREATE", `Nový klient zaregistrovaný: ${newClientFirst} ${newClientLast}`);
    triggerToast("Klient bol úspešne registrovaný. Vyžiadajte súhlas s GDPR.");
    setNewClientFirst("");
    setNewClientLast("");
    setNewClientEmail("");
    setNewClientPhone("");
  };

  const handleBookingCancelInit = (id: string) => {
    const appt = appointments.find(a => a.id === id);
    if (!appt) return;
    const diffHours = (new Date(appt.start_time).getTime() - Date.now()) / (1000 * 60 * 60);
    setIsLateCancel(diffHours < 24);
    setCancelTargetId(id);
  };

  const executeCancel = () => {
    if (!cancelTargetId) return;
    setAppointments(prev => prev.map(a => a.id === cancelTargetId ? { ...a, status: isLateCancel ? 'no_show' : 'cancelled_by_client' } : a));
    addAudit("UPDATE", `Rezervácia ${cancelTargetId} stornovaná (${isLateCancel ? "Neskoré storno" : "Bezplatné storno"}).`);
    triggerToast(isLateCancel ? "Termín stornovaný s prepadnutím zálohy." : "Termín bol bezplatne zrušený.");
    setCancelTargetId(null);
  };

  const submitDiagnosis = (e: React.FormEvent) => {
    e.preventDefault();
    const diagType = activeRole === 'ortoped' ? 'ortoped' : activeRole === 'fyzioterapeut' ? 'fyzio' : activeRole === 'trener' ? 'trening' : 'nutricia';
    const expertName = profiles.find(p => p.role === activeRole)?.first_name || "Špecialista";
    
    const newRecord: ExaminationRecord = {
      id: `ex-${Date.now()}`,
      client_id: selectedClientId,
      client_name: `${selectedClient.first_name} ${selectedClient.last_name}`,
      expert_name: `${expertName} (${activeRole.toUpperCase()})`,
      type: diagType,
      date: new Date().toISOString().split('T')[0],
      summary: diagSummary,
      fields: {
        field1: diagField1,
        field2: diagField2
      }
    };
    setExaminations(prev => [newRecord, ...prev]);
    addAudit("INSERT", `Pridané diagnostické vyšetrenie špecialistom ${expertName} pre klienta.`);
    triggerToast("Záznam o diagnostike bol úspešne uložený.");
    setDiagSummary("");
    setDiagField1("");
    setDiagField2("");
  };

  const submitPrescription = (e: React.FormEvent) => {
    e.preventDefault();
    const newPlan: WorkoutPlan = {
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
    setWorkoutPlans(prev => [...prev, newPlan]);
    addAudit("INSERT", `Predpísané cvičenie "${prescExTitle}" pre klienta.`);
    triggerToast("Tréningový plán bol úspešne predpísaný a odoslaný klientovi.");
    setPrescNotes("");
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
    addAudit("INSERT", `Vystavený pokladničný doklad eKasa pre klienta.`);
    triggerToast("Platba bola úspešne zúčtovaná a vytlačená do eKasy.");
  };

  const submitWorkoutFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackWorkId) return;

    setWorkoutPlans(prev => prev.map(w => w.id === feedbackWorkId ? { ...w, completed: true, rpe: feedbackRpe, pain_level: feedbackPain } : w));
    
    // Auto-alert if pain exceeds 4/10
    if (feedbackPain > 4) {
      triggerToast("⚠️ Bolesť presiahla 4/10! Pridelenému fyzioterapeutovi bola zaslaná notifikácia.");
      addAudit("ALERT", `Klient hlási vysokú bolesť (${feedbackPain}/10) pri cvičení.`);
    } else {
      triggerToast("Výborné! Tréning bol zaznamenaný a splnený.");
    }
    
    setFeedbackWorkId(null);
    setFeedbackNote("");
  };

  const profiles = [
    { role: 'klient', first_name: 'Roman' },
    { role: 'ortoped', first_name: 'MUDr. Ján' },
    { role: 'fyzioterapeut', first_name: 'Mgr. Lucia' },
    { role: 'maser', first_name: 'Peter' },
    { role: 'trener', first_name: 'Bc. Martin' },
    { role: 'nutricny', first_name: 'Ing. Silvia' },
    { role: 'admin', first_name: 'Administrátor' }
  ];

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-off-white">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-navy border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-brand-off-white text-gray-800 font-sans">
      
      {/* Toast Alert */}
      {toast && (
        <div aria-live="polite" className="fixed bottom-6 right-6 z-50 glass-panel-dark text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-brand-cyan">
          <span className="w-2 h-2 rounded-full bg-brand-cyan animate-ping"></span>
          <span>{toast}</span>
        </div>
      )}

      {/* Dev RBAC Bar */}
      <div className="bg-brand-dark-navy text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md z-40 border-b border-white/10">
        <span className="font-bold text-xs tracking-wide text-gray-300">Rola (RBAC):</span>
        <div className="flex flex-wrap gap-2">
          {profiles.map(p => (
            <button
              key={p.role}
              onClick={() => {
                setActiveRole(p.role as any);
                setActiveTab("dashboard");
              }}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                activeRole === p.role 
                  ? "bg-brand-cyan text-brand-dark-navy shadow"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              {p.first_name}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Header */}
      <header className="brand-gradient text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
              <span className="text-brand-navy font-bold text-xl">SW</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">SportWell</h1>
              <p className="text-xs text-brand-light-cyan">Tvoja cesta k uzdraveniu a športovej kondícii.</p>
            </div>
          </div>
          <div className="text-xs bg-white/20 px-3 py-1 rounded-full uppercase tracking-wider font-semibold">
            Rola: {activeRole}
          </div>
        </div>
      </header>

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

        {/* Content Workspace */}
        <main className="flex-1 flex flex-col gap-6">

          {/* ==================== SCREEN 1: DASHBOARD ==================== */}
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Clients View / Dashboard info */}
              {activeRole === 'klient' ? (
                <>
                  <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-4">
                    <h2 className="text-xl font-bold text-brand-navy">Ahoj, Roman! Tvoj dnešný plán</h2>
                    <div className="p-4 bg-brand-off-white/50 border rounded-xl space-y-3">
                      <h3 className="text-sm font-bold"> Checklist cvičení</h3>
                      <div className="space-y-2">
                        {workoutPlans.map(w => (
                          <div key={w.id} className="flex justify-between items-center bg-white p-3 rounded-lg border text-xs shadow-sm">
                            <div>
                              <strong className="block text-gray-700">{w.exercise_title}</strong>
                              <span className="text-gray-400">{w.sets} série | {w.reps} opakovaní</span>
                            </div>
                            {w.completed ? (
                              <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">Splnené</span>
                            ) : (
                              <button
                                onClick={() => setFeedbackWorkId(w.id)}
                                className="px-3 py-1 bg-brand-cyan text-brand-dark-navy font-bold rounded-lg hover:bg-brand-hover-cyan transition-all"
                              >
                                Cvičiť
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-brand-navy mb-2">Najbližší termín</h3>
                      {appointments.filter(a => a.status === 'confirmed').length > 0 ? (
                        <div className="p-3 bg-brand-off-white rounded-xl border">
                          <strong className="text-xs uppercase text-gray-400 block">Služba</strong>
                          <span className="text-sm font-bold block">{appointments[0].service_name}</span>
                          <span className="text-xs text-gray-500 block mt-1">Sprevádza: {appointments[0].staff_name}</span>
                          <span className="text-xs text-brand-navy block font-semibold mt-1">Čas: {new Date(appointments[0].start_time).toLocaleString()}</span>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">Nemáš naplánované žiadne nadchádzajúce termíny.</p>
                      )}
                    </div>
                    <button onClick={() => setActiveTab("rezervacie")} className="w-full mt-4 py-2 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl text-xs hover:bg-brand-hover-cyan transition-all">
                      Rezervovať ďalší termín
                    </button>
                  </div>
                </>
              ) : activeRole === 'admin' ? (
                <>
                  <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-4">
                    <h2 className="text-xl font-bold text-brand-navy">Mesačný prehľad centra (Manažment)</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-brand-navy text-white rounded-xl shadow-inner">
                        <span className="text-xs opacity-70 block">Mesačné tržby</span>
                        <span className="text-2xl font-bold">12 450 €</span>
                      </div>
                      <div className="p-4 bg-brand-off-white rounded-xl border">
                        <span className="text-xs text-gray-400 block font-semibold">Vyťaženosť centra</span>
                        <span className="text-2xl font-bold text-brand-navy">87%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-4">
                    <h3 className="font-bold text-brand-navy">Rýchla registrácia klienta</h3>
                    <form onSubmit={registerClient} className="space-y-3 text-xs">
                      <input type="text" placeholder="Meno" required value={newClientFirst} onChange={(e) => setNewClientFirst(e.target.value)} className="w-full bg-brand-off-white border p-2 rounded-lg outline-none" />
                      <input type="text" placeholder="Priezvisko" required value={newClientLast} onChange={(e) => setNewClientLast(e.target.value)} className="w-full bg-brand-off-white border p-2 rounded-lg outline-none" />
                      <input type="email" placeholder="E-mail" required value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} className="w-full bg-brand-off-white border p-2 rounded-lg outline-none" />
                      <input type="tel" placeholder="Telefón" required value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} className="w-full bg-brand-off-white border p-2 rounded-lg outline-none" />
                      <button type="submit" className="w-full py-2 bg-brand-cyan text-brand-dark-navy font-bold rounded-lg hover:bg-brand-hover-cyan transition-all">Zaregistrovať klienta</button>
                    </form>
                  </div>
                </>
              ) : (
                // Specialist View
                <>
                  <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-4">
                    <h2 className="text-xl font-bold text-brand-navy">Môj dnešný harmonogram</h2>
                    <div className="space-y-2">
                      {appointments
                        .filter(a => a.status === 'confirmed')
                        .map(a => (
                          <div key={a.id} className="flex justify-between items-center bg-brand-off-white/50 p-3 rounded-lg border text-xs">
                            <div>
                              <strong className="block text-brand-navy">{a.client_name}</strong>
                              <span className="text-gray-500">{a.service_name}</span>
                            </div>
                            <span className="text-brand-navy font-bold">{new Date(a.start_time).toLocaleTimeString()}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-brand-navy mb-2">Rýchle akcie</h3>
                      <div className="space-y-2">
                        <button onClick={() => { setActiveTab("diagnostika"); }} className="w-full py-2 bg-brand-off-white hover:bg-brand-navy hover:text-white border text-gray-700 text-left px-3 text-xs font-semibold rounded-lg transition-all">
                          Vytvoriť diagnostiku
                        </button>
                        <button onClick={() => { setActiveTab("plan"); }} className="w-full py-2 bg-brand-off-white hover:bg-brand-navy hover:text-white border text-gray-700 text-left px-3 text-xs font-semibold rounded-lg transition-all">
                          Predpísať tréningový plán
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

            </div>
          )}

          {/* ==================== SCREEN 2: KLIENTI ==================== */}
          {activeTab === "klienti" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              {/* Clients searchable directory */}
              <div className="md:col-span-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-200/50 flex flex-col gap-4">
                <h3 className="font-bold text-brand-navy text-sm">Adresár klientov</h3>
                <input
                  type="text"
                  placeholder="Hľadať meno, e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-brand-off-white border rounded-lg px-3 py-2 text-xs outline-none"
                />

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase text-gray-400 px-2">Filtre</span>
                  <button onClick={() => setClientFilter('all')} className={`text-left px-3 py-1.5 rounded-lg text-xs font-medium ${clientFilter === 'all' ? 'bg-brand-navy text-white' : 'hover:bg-gray-100'}`}>Všetci</button>
                  <button onClick={() => setClientFilter('gdpr_missing')} className={`text-left px-3 py-1.5 rounded-lg text-xs font-medium ${clientFilter === 'gdpr_missing' ? 'bg-brand-navy text-white' : 'hover:bg-gray-100'}`}>Bez podpisu GDPR</button>
                  <button onClick={() => setClientFilter('inactive')} className={`text-left px-3 py-1.5 rounded-lg text-xs font-medium ${clientFilter === 'inactive' ? 'bg-brand-navy text-white' : 'hover:bg-gray-100'}`}>Neaktívni</button>
                </div>

                <div className="space-y-1 divide-y mt-2 max-h-[300px] overflow-y-auto pr-1">
                  {filteredClients.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClientId(c.id)}
                      className={`w-full text-left p-3 rounded-lg text-xs transition-all flex justify-between items-center ${
                        selectedClientId === c.id ? "bg-brand-cyan/20 border-l-4 border-brand-cyan font-bold" : "hover:bg-gray-50"
                      }`}
                    >
                      <div>
                        <span className="block text-gray-700">{c.first_name} {c.last_name}</span>
                        <span className="text-[10px] text-gray-400">{c.email}</span>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${c.status === 'active' ? 'bg-emerald-500' : 'bg-red-400'}`}></span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Client detailed Card C2 */}
              <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-6">
                <div className="border-b pb-4">
                  <h2 className="text-xl font-bold text-brand-navy">{selectedClient.first_name} {selectedClient.last_name}</h2>
                  <p className="text-xs text-gray-400 mt-1">Dátový profil pacienta a GDPR nastavenia</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-brand-off-white/60 rounded-xl">
                    <strong className="block text-gray-400 uppercase text-[9px] mb-1">Osobné informácie</strong>
                    <p><strong>Telefón:</strong> {selectedClient.phone}</p>
                    <p><strong>Poisťovňa:</strong> {selectedClient.insurance}</p>
                    <p><strong>Posledná návšteva:</strong> {selectedClient.last_visit}</p>
                  </div>

                  <div className="p-3 bg-brand-off-white/60 rounded-xl flex flex-col justify-between">
                    <div>
                      <strong className="block text-gray-400 uppercase text-[9px] mb-1">GDPR Súhlasy (MVP 1)</strong>
                      <p><strong>Status:</strong> {selectedClient.gdpr_accepted ? <span className="text-emerald-600 font-bold">Podpísané</span> : <span className="text-red-500 font-bold">Chýba súhlas</span>}</p>
                      {selectedClient.gdpr_accepted && <p className="text-[10px] text-gray-500 mt-1">Verzia: {selectedClient.gdpr_version} | Z dňa: {new Date(selectedClient.gdpr_accepted_at!).toLocaleDateString()}</p>}
                    </div>
                    {!selectedClient.gdpr_accepted && (
                      <button
                        onClick={() => {
                          setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, gdpr_accepted: true, gdpr_version: "v1.0", gdpr_accepted_at: new Date().toISOString() } : c));
                          addAudit("UPDATE", `Získaný podpis GDPR od ${selectedClient.first_name} ${selectedClient.last_name}`);
                          triggerToast("GDPR súhlas bol úspešne podpísaný a PDF uložené.");
                        }}
                        className="mt-2 py-1.5 bg-brand-navy hover:bg-brand-dark-navy text-white font-bold rounded-lg text-[10px]"
                      >
                        Vyžiadať & Podpísať GDPR
                      </button>
                    )}
                  </div>
                </div>

                {/* Medical History */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Diagnózy a kontraindikácie (RBAC Ochrana)</h4>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {selectedClient.diagnoses.map((d, i) => <span key={i} className="bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-lg"><strong>Diagnóza:</strong> {d}</span>)}
                    {selectedClient.contraindications.map((c, i) => <span key={i} className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-lg"><strong>Kontraindikácia:</strong> {c}</span>)}
                  </div>
                </div>

                {/* Timeline of treatments */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">História vyšetrení</h4>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {examinations.filter(e => e.client_id === selectedClient.id).map(e => (
                      <div key={e.id} className="p-3 bg-brand-off-white/40 border rounded-lg text-xs">
                        <div className="flex justify-between font-bold text-brand-navy">
                          <span>{e.expert_name}</span>
                          <span className="text-gray-400">{e.date}</span>
                        </div>
                        <p className="mt-1 font-medium text-gray-700">{e.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ==================== SCREEN 3: DIAGNOSTIKA ==================== */}
          {activeTab === "diagnostika" && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-6 animate-fade-in">
              <div className="border-b pb-4">
                <h2 className="text-xl font-bold text-brand-navy">Lekárska & Rehabilitačná Diagnostika</h2>
                <p className="text-xs text-gray-400 mt-1">Vyberte pacienta a zadajte diagnostické záznamy.</p>
              </div>

              <div className="p-4 bg-brand-off-white/50 rounded-xl text-xs space-y-2">
                <p><strong>Vybraný pacient:</strong> {selectedClient.first_name} {selectedClient.last_name}</p>
                <p><strong>Aktívna šablóna formulára:</strong> {activeRole.toUpperCase()}</p>
              </div>

              {activeRole === 'klient' ? (
                <p className="text-xs text-gray-500">Táto funkcia je prístupná iba pre lekárov a trénerov centers.</p>
              ) : (
                <form onSubmit={submitDiagnosis} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold mb-1">Celkové zhrnutie / Záver vyšetrenia</label>
                    <input type="text" required value={diagSummary} onChange={(e) => setDiagSummary(e.target.value)} className="w-full bg-brand-off-white border p-3 rounded-lg outline-none" placeholder="Základná zhrňujúca diagnóza…" />
                  </div>

                  {activeRole === 'ortoped' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold mb-1">Objektívny Ortopedický Nález</label>
                        <textarea required value={diagField1} onChange={(e) => setDiagField1(e.target.value)} className="w-full bg-brand-off-white border p-3 rounded-lg outline-none h-24" placeholder="Napr. držanie chrbtice, hybnosť kĺbov…" />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">Lekárske Odporúčania & Zákazy</label>
                        <textarea required value={diagField2} onChange={(e) => setDiagField2(e.target.value)} className="w-full bg-brand-off-white border p-3 rounded-lg outline-none h-24" placeholder="Čomu sa vyvarovať, doporučený fyzioterapeut…" />
                      </div>
                    </div>
                  )}

                  {activeRole === 'fyzioterapeut' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold mb-1">ROM Testy a hybnosť (Range of Motion)</label>
                        <textarea required value={diagField1} onChange={(e) => setDiagField1(e.target.value)} className="w-full bg-brand-off-white border p-3 rounded-lg outline-none h-24" placeholder="Napr. ROM krčnej chrbtice v stupňoch…" />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">Vykonaná mobilizačná terapia</label>
                        <textarea required value={diagField2} onChange={(e) => setDiagField2(e.target.value)} className="w-full bg-brand-off-white border p-3 rounded-lg outline-none h-24" placeholder="Popis mobilizačných hmatov a trakcí…" />
                      </div>
                    </div>
                  )}

                  {activeRole === 'trener' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold mb-1">Výkonnostné a pohybové testy (Test sily/FMS)</label>
                        <textarea required value={diagField1} onChange={(e) => setDiagField1(e.target.value)} className="w-full bg-brand-off-white border p-3 rounded-lg outline-none h-24" placeholder="Sila dolných končatín, stabilita trupu…" />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">Odporúčané limity pre záťaž</label>
                        <textarea required value={diagField2} onChange={(e) => setDiagField2(e.target.value)} className="w-full bg-brand-off-white border p-3 rounded-lg outline-none h-24" placeholder="Max pulz, váhy pre drepy a mŕtve ťahy…" />
                      </div>
                    </div>
                  )}

                  {activeRole === 'nutricny' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold mb-1">Stravovacie návyky a metabolizmus</label>
                        <textarea required value={diagField1} onChange={(e) => setDiagField1(e.target.value)} className="w-full bg-brand-off-white border p-3 rounded-lg outline-none h-24" placeholder="Antropometria, percento tuku, frekvencia jedál…" />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">Nutričný cieľ (Kalórie a Makrá)</label>
                        <textarea required value={diagField2} onChange={(e) => setDiagField2(e.target.value)} className="w-full bg-brand-off-white border p-3 rounded-lg outline-none h-24" placeholder="Nastavenie denného kalorického príjmu a pitného režimu…" />
                      </div>
                    </div>
                  )}

                  <button type="submit" className="py-2.5 px-6 rounded-xl font-bold text-white bg-brand-cyan hover:bg-brand-hover-cyan transition-colors cursor-pointer">
                    Uložiť a Uzamknúť diagnostiku
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ==================== SCREEN 4: TRÉNINGY / PLÁNY ==================== */}
          {activeTab === "plan" && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-6 animate-fade-in">
              <div className="border-b pb-4">
                <h2 className="text-xl font-bold text-brand-navy">Tréningové zaťaženie a domáce plány</h2>
                <p className="text-xs text-gray-400 mt-1">
                  {isEmployee ? "Predpísať cvičenia klientovi do domáceho plánu." : "Zoznam a precvičovanie cvičení."}
                </p>
              </div>

              {isEmployee ? (
                <form onSubmit={submitPrescription} className="space-y-4 text-xs">
                  <div className="p-3 bg-brand-off-white rounded-xl">
                    <strong>Pacient:</strong> {selectedClient.first_name} {selectedClient.last_name}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold mb-1">Vybrať cvičenie z knižnice</label>
                      <select value={prescExTitle} onChange={(e) => setPrescExTitle(e.target.value)} className="w-full bg-brand-off-white border p-2 rounded-lg outline-none">
                        {exercises.map(ex => <option key={ex.id} value={ex.title}>{ex.title}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold mb-1">Série</label>
                        <input type="number" value={prescSets} onChange={(e) => setPrescSets(parseInt(e.target.value))} className="w-full bg-brand-off-white border p-2 rounded-lg outline-none" />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">Opakovania</label>
                        <input type="number" value={prescReps} onChange={(e) => setPrescReps(parseInt(e.target.value))} className="w-full bg-brand-off-white border p-2 rounded-lg outline-none" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block font-bold mb-1">Tempo cvičenia</label>
                      <input type="text" value={prescTempo} onChange={(e) => setPrescTempo(e.target.value)} className="w-full bg-brand-off-white border p-2 rounded-lg outline-none" placeholder="3-0-3" />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Pauza</label>
                      <input type="text" value={prescPause} onChange={(e) => setPrescPause(e.target.value)} className="w-full bg-brand-off-white border p-2 rounded-lg outline-none" placeholder="60s" />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Poznámka / Dôležité limity</label>
                      <input type="text" value={prescNotes} onChange={(e) => setPrescNotes(e.target.value)} className="w-full bg-brand-off-white border p-2 rounded-lg outline-none" placeholder="Vyhnúť sa prepnutiu kĺbu…" />
                    </div>
                  </div>

                  <button type="submit" className="py-2.5 px-6 rounded-xl font-bold text-white bg-brand-cyan hover:bg-brand-hover-cyan transition-colors cursor-pointer">
                    Predpísať & Odoslať do aplikácie
                  </button>
                </form>
              ) : (
                // Client view (My Plan checklist)
                <div className="space-y-4">
                  {workoutPlans.filter(w => w.client_id === "c1").map(w => (
                    <div key={w.id} className="p-4 border rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-brand-off-white/40">
                      <div>
                        <h4 className="font-bold text-brand-navy">{w.exercise_title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{w.sets} sérií po {w.reps} opakovaní | Tempo: {w.tempo} | Pauza: {w.pause}</p>
                        {w.notes && <p className="text-xs italic text-gray-400 mt-1">Poznámka špecialistu: {w.notes}</p>}
                      </div>
                      <div>
                        {w.completed ? (
                          <span className="text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-bold block text-center">✓ Splnené</span>
                        ) : (
                          <button
                            onClick={() => setFeedbackWorkId(w.id)}
                            className="px-4 py-2 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl text-xs hover:bg-brand-hover-cyan transition-all cursor-pointer"
                          >
                            Cvičiť a vyhodnotiť
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== SCREEN 5: VIDEOKNIŽNICA ==================== */}
          {activeTab === "videokniznica" && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-6 animate-fade-in">
              <div className="border-b pb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-brand-navy">Videoknižnica cvičení</h2>
                  <p className="text-xs text-gray-400 mt-1">Správna technika cvikov predpísaná pre domáci plán.</p>
                </div>
                {activeRole === 'admin' && (
                  <button onClick={() => triggerToast("Formulár pre nahratie videa zobrazený.")} className="py-2 px-4 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl text-xs hover:bg-brand-hover-cyan">
                    + Nahrať nové video
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {exercises.map(ex => (
                  <div key={ex.id} className="border rounded-xl overflow-hidden shadow-sm flex flex-col justify-between bg-brand-off-white/20">
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] bg-brand-navy text-white px-2 py-0.5 rounded font-bold uppercase">{ex.category}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          ex.difficulty === 'lahka' ? 'bg-green-100 text-green-700' : ex.difficulty === 'stredna' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {ex.difficulty}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-gray-800">{ex.title}</h4>
                      <p className="text-xs text-gray-600 line-clamp-3">{ex.description}</p>
                      <div className="text-[10px] text-gray-400">
                        <strong>Pomôcky:</strong> {ex.equipment}
                      </div>
                    </div>
                    
                    <div className="bg-brand-off-white/40 p-3 border-t flex justify-end">
                      {isEmployee && (
                        <button
                          onClick={() => {
                            setPrescExTitle(ex.title);
                            setActiveTab("plan");
                            triggerToast(`Vybrané cvičenie: ${ex.title}`);
                          }}
                          className="px-3 py-1.5 bg-brand-navy text-white rounded-lg text-xs font-bold hover:bg-brand-dark-navy transition-all"
                        >
                          Predpísať klientovi
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== SCREEN 6: REZERVÁCIE ==================== */}
          {activeTab === "rezervacie" && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-6 animate-fade-in">
              <div className="border-b pb-4">
                <h2 className="text-xl font-bold text-brand-navy">Rezervačný systém a termíny</h2>
                <p className="text-xs text-gray-400 mt-1">Prihlásenie, storno pravidlá a obsadenosť špecialistov.</p>
              </div>

              {activeRole === 'klient' ? (
                <div className="space-y-4">
                  <div className="p-4 bg-brand-off-white/60 border rounded-xl space-y-3">
                    <h3 className="text-sm font-bold text-brand-navy">Naplánovať nový termín</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold mb-1">Výber služby</label>
                        <select className="w-full bg-white border p-2 rounded-lg outline-none">
                          {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.price}€)</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Dátum</label>
                        <input type="date" className="w-full bg-white border p-2 rounded-lg outline-none" min="2026-06-09" defaultValue="2026-06-10" />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Čas slotu</label>
                        <select className="w-full bg-white border p-2 rounded-lg outline-none">
                          <option>09:00 - 10:00</option>
                          <option>10:00 - 11:00</option>
                          <option>14:00 - 15:00</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const newAppt: Appointment = {
                          id: `a-${Date.now()}`,
                          client_id: "c1",
                          client_name: "Roman Kováč",
                          staff_id: "u3",
                          staff_name: "Mgr. Lucia Bieliková",
                          service_name: "Fyzioterapia - Vstupné vyšetrenie",
                          start_time: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
                          status: "confirmed"
                        };
                        setAppointments(prev => [...prev, newAppt]);
                        addAudit("INSERT", "Rezervovaný nový termín klientom Roman Kováč.");
                        triggerToast("Rezervácia bola úspešne vytvorená. Potvrdenie odoslané na e-mail.");
                      }}
                      className="py-2 px-5 bg-brand-cyan hover:bg-brand-hover-cyan text-brand-dark-navy font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Rezervovať termín
                    </button>
                  </div>

                  {/* Client appointments lists */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-brand-navy text-sm">Moje termíny</h3>
                    {appointments.map(a => (
                      <div key={a.id} className="p-3 bg-brand-off-white/40 border rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <strong className="block text-gray-700">{a.service_name}</strong>
                          <span className="text-gray-400">{a.staff_name} | {new Date(a.start_time).toLocaleString()}</span>
                          <span className={`block w-fit text-[9px] font-bold uppercase mt-1 px-1.5 py-0.5 rounded ${
                            a.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {a.status}
                          </span>
                        </div>
                        {a.status === 'confirmed' && (
                          <button
                            onClick={() => handleBookingCancelInit(a.id)}
                            className="px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg font-bold"
                          >
                            Zrušiť
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Admin/Specialist scheduling calendar
                <div className="space-y-4 text-xs">
                  <p className="text-gray-500">Nasledujúce termíny plánované na vašu prevádzku:</p>
                  <div className="divide-y border rounded-xl overflow-hidden bg-brand-off-white/10">
                    {appointments.map(a => (
                      <div key={a.id} className="p-3 flex justify-between items-center">
                        <div>
                          <strong>{a.client_name}</strong>
                          <span className="text-gray-400 ml-2">({a.service_name})</span>
                        </div>
                        <span className="font-mono font-bold text-brand-navy">{new Date(a.start_time).toLocaleString("sk-SK")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== SCREEN 7: PLATBY & eKASA ==================== */}
          {activeTab === "platby" && activeRole === 'admin' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-6 animate-fade-in">
              <div className="border-b pb-4">
                <h2 className="text-xl font-bold text-brand-navy">eKasa pokladňa a platby</h2>
                <p className="text-xs text-gray-400 mt-1">Zúčtovanie platieb priamo naviazaných na typ služby a rezervácie.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* eKasa payment trigger */}
                <div className="md:col-span-1 p-4 bg-brand-off-white/60 border rounded-xl flex flex-col gap-4 text-xs">
                  <h3 className="font-bold text-brand-navy">Zúčtovať rezerváciu (Pokladňa)</h3>
                  <form onSubmit={createPayment} className="space-y-3">
                    <div>
                      <label className="block font-semibold mb-1">Pacient</label>
                      <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} className="w-full bg-white border p-2 rounded-lg outline-none">
                        {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Poskytnutá služba</label>
                      <select value={payServiceId} onChange={(e) => setPayServiceId(e.target.value)} className="w-full bg-white border p-2 rounded-lg outline-none">
                        {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.price}€)</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Platobná metóda</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input type="radio" checked={payMethod === 'karta'} onChange={() => setPayMethod('karta')} /> Karta
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" checked={payMethod === 'hotovost'} onChange={() => setPayMethod('hotovost')} /> Hotovosť
                        </label>
                      </div>
                    </div>

                    <button type="submit" className="w-full py-2 bg-brand-cyan hover:bg-brand-hover-cyan text-brand-dark-navy font-bold rounded-lg cursor-pointer">
                      Zúčtovať a Tlačiť doklad
                    </button>
                  </form>
                </div>

                {/* History of bills */}
                <div className="md:col-span-2 space-y-3">
                  <h3 className="font-bold text-brand-navy text-sm">Vystavené pokladničné doklady</h3>
                  <div className="divide-y border rounded-xl overflow-hidden text-xs bg-brand-off-white/10">
                    {payments.map(p => (
                      <div key={p.id} className="p-3 flex justify-between items-center">
                        <div>
                          <strong className="block text-gray-700">{p.client_name}</strong>
                          <span className="text-gray-400">{p.service_name} | eKasa doklad: #{p.invoice_number}</span>
                        </div>
                        <div className="text-right">
                          <strong className="block text-brand-navy">{p.amount} €</strong>
                          <span className="text-[10px] text-gray-400 font-bold uppercase">{p.method}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ==================== SCREEN 8: REPORTY ==================== */}
          {activeTab === "reporty" && activeRole === 'admin' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-6 animate-fade-in">
              <div className="border-b pb-4">
                <h2 className="text-xl font-bold text-brand-navy">Analytické reporty a štatistiky</h2>
                <p className="text-xs text-gray-400 mt-1">Prehľad vyťaženosti a výkonnosti tímu.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-brand-off-white rounded-xl border space-y-2 text-xs">
                  <h4 className="font-bold text-brand-navy">Distribúcia Diagnóz</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between"><span>Bolesť krížov</span> <strong>45%</strong></div>
                    <div className="flex justify-between"><span>Po-operačné kolená</span> <strong>35%</strong></div>
                    <div className="flex justify-between"><span>Ramenný kĺb</span> <strong>20%</strong></div>
                  </div>
                </div>

                <div className="p-4 bg-brand-off-white rounded-xl border space-y-2 text-xs">
                  <h4 className="font-bold text-brand-navy">Vyťaženosť špecialistov</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between"><span>Mgr. Lucia Bieliková</span> <strong>94%</strong></div>
                    <div className="flex justify-between"><span>Bc. Martin Švec</span> <strong>80%</strong></div>
                    <div className="flex justify-between"><span>Peter Varga</span> <strong>75%</strong></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== SCREEN 9: AUDIT LOGS ==================== */}
          {activeTab === "audit" && activeRole === 'admin' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-4 animate-fade-in">
              <h2 className="text-xl font-bold text-brand-navy">GDPR Auditný Log zmien</h2>
              <div className="divide-y border rounded-xl overflow-hidden text-xs max-h-[300px] overflow-y-auto">
                {auditLogs.map(log => (
                  <div key={log.id} className="p-3 bg-brand-off-white/40 flex justify-between items-center">
                    <div>
                      <strong>{log.user} ({log.action})</strong>
                      <p className="text-gray-500 mt-0.5">{log.details}</p>
                    </div>
                    <span className="text-[10px] text-gray-400">{new Date(log.date).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== SCREEN 10: CLIENT PROFILE ==================== */}
          {activeTab === "profil" && activeRole === 'klient' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-6 animate-fade-in">
              <div className="border-b pb-4">
                <h2 className="text-xl font-bold text-brand-navy">Môj Profil & Nastavenia</h2>
                <p className="text-xs text-gray-400 mt-1">Nastavenia súhlasov a GDPR export dát.</p>
              </div>

              <div className="p-4 bg-brand-off-white rounded-xl text-xs space-y-1">
                <p><strong>Meno:</strong> Roman Kováč</p>
                <p><strong>E-mail:</strong> roman.kovac@email.sk</p>
                <p><strong>Zdravotná poisťovňa:</strong> Dôvera</p>
              </div>

              <div className="space-y-3 border-t pt-4">
                <h3 className="text-sm font-bold text-brand-navy">Moje GDPR Súhlasy</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 bg-emerald-50 text-emerald-800 rounded-lg">
                    <span>Spracovanie osobných a zdravotných údajov</span>
                    <strong>Podpísané</strong>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-emerald-50 text-emerald-800 rounded-lg">
                    <span>Zasielanie domáceho plánu a videonávodov</span>
                    <strong>Podpísané</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  triggerToast("Súbor GDPR_export_Roman_Kovac.json bol stiahnutý.");
                  addAudit("EXPORT", "Klient vyžiadal kompletný GDPR export dát.");
                }}
                className="py-2.5 px-5 bg-brand-navy hover:bg-brand-dark-navy text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Stiahnuť kompletný export mojich dát (JSON)
              </button>
            </div>
          )}

          {/* ==================== SCREEN 11: NASTAVENIA ==================== */}
          {activeTab === "nastavenia" && activeRole === 'admin' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-4 animate-fade-in">
              <h2 className="text-xl font-bold text-brand-navy">Globálne nastavenia aplikácie</h2>
              <div className="p-4 bg-brand-off-white rounded-xl text-xs space-y-3">
                <div>
                  <label className="block font-semibold mb-1">Storno lehota (v hodinách)</label>
                  <input type="number" defaultValue={24} className="bg-white border p-2 rounded-lg outline-none" />
                </div>
                <div>
                  <button onClick={() => triggerToast("Záloha databázy PostgreSQL prebehla úspešne.")} className="py-2 px-4 bg-brand-navy text-white font-bold rounded-lg hover:bg-brand-dark-navy">
                    Vytvoriť zálohu databázy
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* RPE/Pain rating modal for client workouts */}
      {feedbackWorkId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white text-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border">
            <h3 className="text-lg font-bold text-brand-navy mb-4">Vyhodnotenie cvičenia</h3>
            
            <form onSubmit={submitWorkoutFeedback} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Ako ťažké to bolo? (RPE Škála 1-10)</label>
                <input type="range" min="1" max="10" value={feedbackRpe} onChange={(e) => setFeedbackRpe(parseInt(e.target.value))} className="w-full accent-brand-cyan" />
                <span className="block text-center font-bold mt-1">Obtiažnosť: {feedbackRpe}/10</span>
              </div>

              <div>
                <label className="block font-semibold mb-1">Pocit bolesti pri záťaži (VAS Škála 0-10)</label>
                <input type="range" min="0" max="10" value={feedbackPain} onChange={(e) => setFeedbackPain(parseInt(e.target.value))} className="w-full accent-brand-cyan" />
                <span className={`block text-center font-bold mt-1 ${feedbackPain > 4 ? "text-red-600" : "text-gray-700"}`}>
                  Bolesť: {feedbackPain}/10
                </span>
              </div>

              <div>
                <label className="block font-semibold mb-1">Poznámka pre terapeuta</label>
                <input type="text" value={feedbackNote} onChange={(e) => setFeedbackNote(e.target.value)} className="w-full border p-2 rounded-lg outline-none" placeholder="Cítil som mierne ťahanie v kolene…" />
              </div>

              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setFeedbackWorkId(null)} className="px-4 py-2 border rounded-xl hover:bg-gray-100 font-bold">Zrušiť</button>
                <button type="submit" className="px-4 py-2 bg-brand-cyan text-brand-dark-navy font-bold rounded-xl hover:bg-brand-hover-cyan">Uložiť výsledok</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation confirmation dialog */}
      {cancelTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white text-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border">
            <h3 className="text-lg font-bold text-brand-navy mb-2">Potvrdiť stornovanie termínu</h3>
            {isLateCancel ? (
              <p className="text-xs text-red-600 font-semibold mb-4 bg-red-50 p-3 rounded-lg border border-red-200">
                ⚠️ Upozornenie: Tento termín začína o menej ako 24 hodín. Zrušenie je považované za neskoré a záloha prepadne v prospech SportWell.
              </p>
            ) : (
              <p className="text-xs text-gray-600 mb-4">
                Tento termín začína o viac ako 24 hodín. Storno je zadarmo a bez poplatku.
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
        <p>© 2026 SportWell. Všetky práva vyhradené. Brand Identita & Odborné programy.</p>
      </footer>
    </div>
  );
}
