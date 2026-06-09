"use client";

import React, { useState, useEffect, useRef } from "react";

// Types matching Supabase DB spec
interface Profile {
  id: string;
  role: 'admin' | 'ortoped' | 'fyzioterapeut' | 'maser' | 'trener' | 'nutricny' | 'klient';
  first_name: string;
  last_name: string;
  phone: string;
  gdpr_accepted_at: string | null;
  gdpr_version: string | null;
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
  created_by_name: string;
  type: 'ortoped' | 'fyzio' | 'masaz' | 'trening' | 'nutricia';
  pain_map_data: PainPoint[];
  form_data: Record<string, string>;
  created_at: string;
}

interface Reservation {
  id: string;
  client_id: string;
  client_name: string;
  staff_id: string;
  staff_name: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled_by_client' | 'cancelled_by_staff' | 'no_show';
  cancelled_at?: string | null;
}

interface AuditLog {
  id: string;
  user_name: string;
  table_name: string;
  action: string;
  record_id: string;
  new_data: string;
  created_at: string;
}

export default function SportWellDashboard() {
  // 1. RBAC & Current User State
  const [activeRole, setActiveRole] = useState<'admin' | 'ortoped' | 'fyzioterapeut' | 'maser' | 'trener' | 'nutricny' | 'klient'>('klient');
  const [clientGdprAccepted, setClientGdprAccepted] = useState(false);
  const [clientOnboarded, setClientOnboarded] = useState(false);
  const [activeTab, setActiveTab] = useState("prehlad");

  // Onboarding Form State
  const [onboardingFirstName, setOnboardingFirstName] = useState("Roman");
  const [onboardingLastName, setOnboardingLastName] = useState("Kováč");
  const [onboardingPhone, setOnboardingPhone] = useState("+421 905 123 456");
  const [onboardingInsurance, setOnboardingInsurance] = useState("Dôvera");
  const [gdprChecked1, setGdprChecked1] = useState(false);
  const [gdprChecked2, setGdprChecked2] = useState(false);
  const [gdprChecked3, setGdprChecked3] = useState(false);
  const [isSubmittingGdpr, setIsSubmittingGdpr] = useState(false);

  // 2. Mock Database State
  const [profiles, setProfiles] = useState<Profile[]>([
    { id: "u1", role: "klient", first_name: "Roman", last_name: "Kováč", phone: "+421 905 123 456", gdpr_accepted_at: null, gdpr_version: null },
    { id: "u2", role: "ortoped", first_name: "MUDr. Ján", last_name: "Stano", phone: "+421 908 111 222", gdpr_accepted_at: "2026-01-10T12:00:00Z", gdpr_version: "v1.0" },
    { id: "u3", role: "fyzioterapeut", first_name: "Mgr. Lucia", last_name: "Bieliková", phone: "+421 907 333 444", gdpr_accepted_at: "2026-01-10T12:00:00Z", gdpr_version: "v1.0" },
    { id: "u4", role: "maser", first_name: "Peter", last_name: "Varga", phone: "+421 905 555 666", gdpr_accepted_at: "2026-01-10T12:00:00Z", gdpr_version: "v1.0" },
    { id: "u5", role: "trener", first_name: "Bc. Martin", last_name: "Švec", phone: "+421 904 777 888", gdpr_accepted_at: "2026-01-10T12:00:00Z", gdpr_version: "v1.0" },
    { id: "u6", role: "admin", first_name: "Administrátor", last_name: "SportWell", phone: "+421 900 000 000", gdpr_accepted_at: "2026-01-10T12:00:00Z", gdpr_version: "v1.0" },
  ]);

  const [medicalCards, setMedicalCards] = useState<MedicalCard[]>([
    {
      id: "mc1",
      client_id: "u1",
      created_by: "u2",
      created_by_name: "MUDr. Ján Stano (Ortopéd)",
      type: "ortoped",
      pain_map_data: [{ region: "Pravé koleno", intensity: 7, notes: "Bolestivý ohyb nad 90 stupňov, podozrenie na meniscus." }],
      form_data: { anamneza: "Pacient po distorzii kolenného kĺbu počas behu.", zaver: "Indikovaná magnetická rezonancia (MR) a fyzikálna terapia." },
      created_at: "2026-05-15T09:00:00Z"
    },
    {
      id: "mc2",
      client_id: "u1",
      created_by: "u3",
      created_by_name: "Mgr. Lucia Bieliková (Fyzio)",
      type: "fyzio",
      pain_map_data: [{ region: "Kríže", intensity: 5, notes: "Tupá bolesť pri dlhom sedení." }],
      form_data: { diagnostika: "Mierne predsunuté držanie tela, oslabené hlboké stabilizačné svaly chrbtice.", plan: "Cvičenia na posilnenie core, mobilizačné techniky." },
      created_at: "2026-05-20T14:30:00Z"
    }
  ]);

  const [reservations, setReservations] = useState<Reservation[]>([
    {
      id: "res1",
      client_id: "u1",
      client_name: "Roman Kováč",
      staff_id: "u3",
      staff_name: "Mgr. Lucia Bieliková (Fyzio)",
      start_time: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(), // ~26 hours from now (cancellable)
      end_time: new Date(Date.now() + 27 * 60 * 60 * 1000).toISOString(),
      status: "confirmed"
    },
    {
      id: "res2",
      client_id: "u1",
      client_name: "Roman Kováč",
      staff_id: "u4",
      staff_name: "Peter Varga (Masér)",
      start_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // ~3 hours from now (late cancellation warning)
      end_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      status: "confirmed"
    }
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { id: "a1", user_name: "MUDr. Ján Stano", table_name: "medical_cards", action: "INSERT", record_id: "mc1", new_data: "Vytvorená ortopedická karta - pacient Roman Kováč", created_at: "2026-05-15T09:00:00Z" },
    { id: "a2", user_name: "Mgr. Lucia Bieliková", table_name: "medical_cards", action: "INSERT", record_id: "mc2", new_data: "Vytvorená fyzioterapeutická karta - pacient Roman Kováč", created_at: "2026-05-20T14:30:00Z" }
  ]);

  // 3. UI Interaction State
  const [selectedPainRegion, setSelectedPainRegion] = useState<string>("Pravé koleno");
  const [painIntensity, setPainIntensity] = useState<number>(5);
  const [painNotes, setPainNotes] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cancelModalInfo, setCancelModalInfo] = useState<{ resId: string; isLate: boolean } | null>(null);
  const [bodySide, setBodySide] = useState<'front' | 'back'>('front');

  // Medical entry creation state (for specialists)
  const [selectedClientForNewCard, setSelectedClientForNewCard] = useState("u1");
  const [newCardType, setNewCardType] = useState<'ortoped' | 'fyzio' | 'masaz' | 'trening' | 'nutricia'>('fyzio');
  const [newCardFormData, setNewCardFormData] = useState({ field1: "", field2: "" });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const logAction = (userRole: string, action: string, table: string, recordId: string, desc: string) => {
    const newLog: AuditLog = {
      id: `a${Date.now()}`,
      user_name: profiles.find(p => p.role === userRole)?.first_name || "Neznámy",
      table_name: table,
      action: action,
      record_id: recordId,
      new_data: desc,
      created_at: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // 4. Handle GDPR Onboarding Submit
  const handleGdprSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gdprChecked1) return;

    setIsSubmittingGdpr(true);
    setTimeout(() => {
      setClientGdprAccepted(true);
      setClientOnboarded(true);
      setIsSubmittingGdpr(false);
      logAction("klient", "UPDATE", "profiles", "u1", "Súhlas s GDPR udelený, profil nastavený (Roman Kováč). PDF vygenerované.");
      showToast("Tvoj profil bol úspešne vytvorený! Vitaj v SportWell.");
    }, 1200);
  };

  // 5. Handle Pain Map Point Save
  const savePainPoint = () => {
    if (!selectedPainRegion) return;

    const newPain: PainPoint = {
      region: selectedPainRegion,
      intensity: painIntensity,
      notes: painNotes
    };

    // Update Client's latest medical card
    const updatedCards = [...medicalCards];
    const clientCardIndex = updatedCards.findIndex(c => c.client_id === "u1" && c.type === "fyzio");
    
    if (clientCardIndex !== -1) {
      updatedCards[clientCardIndex].pain_map_data = [
        ...updatedCards[clientCardIndex].pain_map_data.filter(p => p.region !== selectedPainRegion),
        newPain
      ];
      setMedicalCards(updatedCards);
    } else {
      // Create fresh card if none
      const newCard: MedicalCard = {
        id: `mc${Date.now()}`,
        client_id: "u1",
        created_by: "u1",
        created_by_name: "Roman Kováč (Klient)",
        type: "fyzio",
        pain_map_data: [newPain],
        form_data: {},
        created_at: new Date().toISOString()
      };
      setMedicalCards(prev => [newCard, ...prev]);
    }

    logAction(activeRole, "UPDATE", "medical_cards", "mc2", `Klient uložil bolesť: ${selectedPainRegion} (VAS: ${painIntensity}/10)`);
    showToast(`Bolesť v oblasti "${selectedPainRegion}" bola zaznamenaná.`);
    setPainNotes("");
  };

  // 6. Handle Reservation Cancellation
  const initiateCancel = (resId: string) => {
    const reservation = reservations.find(r => r.id === resId);
    if (!reservation) return;

    const startTime = new Date(reservation.start_time).getTime();
    const now = Date.now();
    const hoursDifference = (startTime - now) / (1000 * 60 * 60);

    setCancelModalInfo({
      resId,
      isLate: hoursDifference < 24
    });
  };

  const confirmCancellation = () => {
    if (!cancelModalInfo) return;

    setReservations(prev =>
      prev.map(r =>
        r.id === cancelModalInfo.resId
          ? { ...r, status: "cancelled_by_client", cancelled_at: new Date().toISOString() }
          : r
      )
    );

    const desc = cancelModalInfo.isLate 
      ? "Neskoré storno rezervácie (menej ako 24h pred začiatkom) - storno poplatok 100%."
      : "Zrušenie rezervácie v riadnom limite (bez poplatku).";

    logAction("klient", "UPDATE", "reservations", cancelModalInfo.resId, desc);
    showToast(cancelModalInfo.isLate ? "Termín stornovaný s poplatkom (neskoré storno)." : "Termín bol úspešne bezplatne zrušený.");
    setCancelModalInfo(null);
  };

  // 7. Handle New Medical Entry (Specialist view)
  const saveSpecialistEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: MedicalCard = {
      id: `mc${Date.now()}`,
      client_id: selectedClientForNewCard,
      created_by: activeRole,
      created_by_name: profiles.find(p => p.role === activeRole)?.first_name || "Špecialista",
      type: newCardType,
      pain_map_data: [],
      form_data: newCardFormData,
      created_at: new Date().toISOString()
    };

    setMedicalCards(prev => [newEntry, ...prev]);
    logAction(activeRole, "INSERT", "medical_cards", newEntry.id, `Záznam typu "${newCardType}" pridaný špecialistom.`);
    showToast("Nový zdravotný záznam bol bezpečne uložený do karty.");
    setNewCardFormData({ field1: "", field2: "" });
  };

  // Quick helper to determine layout visibility according to RBAC
  const isEmployee = activeRole !== "klient";

  return (
    <div className="flex flex-col min-h-screen bg-brand-off-white text-gray-800 font-sans">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div aria-live="polite" className="fixed bottom-6 right-6 z-50 glass-panel-dark text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-fade-in border-brand-cyan border">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-cyan animate-ping"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Developer RBAC Switcher */}
      <div className="bg-brand-dark-navy text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md z-40 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-brand-cyan"></div>
          <span className="font-bold tracking-wide text-sm">SportWell DevMatrix Rôl:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {profiles.map(p => (
            <button
              key={p.role}
              onClick={() => {
                setActiveRole(p.role);
                setActiveTab("prehlad");
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                activeRole === p.role 
                  ? "bg-brand-cyan text-brand-dark-navy shadow-lg"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              {p.first_name} ({p.role.toUpperCase()})
            </button>
          ))}
        </div>
      </div>

      {/* GDPR Gate Overlay for Client */}
      {activeRole === "klient" && !clientGdprAccepted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark-navy/95 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-panel-dark text-white rounded-2xl max-w-lg w-full p-8 shadow-2xl border border-white/10">
            <div className="text-center mb-6">
              <div className="inline-block p-4 rounded-full brand-gradient mb-3">
                <span className="text-3xl font-bold">SW</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Vstúp do SportWell</h2>
              <p className="text-gray-300 text-sm mt-1">Pre pokračovanie je potrebné overenie tvojich údajov a súhlas s GDPR.</p>
            </div>

            <form onSubmit={handleGdprSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1" htmlFor="first_name">Krstné meno</label>
                <input
                  id="first_name"
                  type="text"
                  required
                  value={onboardingFirstName}
                  onChange={(e) => setOnboardingFirstName(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none"
                  placeholder="napr. Jozef"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1" htmlFor="last_name">Priezvisko</label>
                <input
                  id="last_name"
                  type="text"
                  required
                  value={onboardingLastName}
                  onChange={(e) => setOnboardingLastName(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none"
                  placeholder="napr. Kováč"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1" htmlFor="phone">Telefónne číslo</label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={onboardingPhone}
                    onChange={(e) => setOnboardingPhone(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none"
                    placeholder="+421..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1" htmlFor="insurance">Zdravotná poisťovňa</label>
                  <select
                    id="insurance"
                    value={onboardingInsurance}
                    onChange={(e) => setOnboardingInsurance(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none"
                  >
                    <option value="Dôvera" className="bg-brand-dark-navy text-white">Dôvera</option>
                    <option value="VšZP" className="bg-brand-dark-navy text-white">VšZP</option>
                    <option value="Union" className="bg-brand-dark-navy text-white">Union</option>
                  </select>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gdprChecked1}
                    onChange={(e) => setGdprChecked1(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-brand-cyan focus:ring-brand-cyan bg-white/10 accent-brand-cyan"
                  />
                  <span className="text-xs text-gray-200">
                    Súhlasím so spracovaním citlivých zdravotných údajov pre potreby diagnostiky a rehabilitácie. <strong className="text-brand-cyan">(Povinné)</strong>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gdprChecked2}
                    onChange={(e) => setGdprChecked2(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-brand-cyan focus:ring-brand-cyan bg-white/10 accent-brand-cyan"
                  />
                  <span className="text-xs text-gray-300">
                    Súhlasím s odosielaním prevádzkovej komunikácie (pripomienky termínov cez SMS/e-mail).
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gdprChecked3}
                    onChange={(e) => setGdprChecked3(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-brand-cyan focus:ring-brand-cyan bg-white/10 accent-brand-cyan"
                  />
                  <span className="text-xs text-gray-300">
                    Súhlasím so zasielaním noviniek a marketingových informácií.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!gdprChecked1 || isSubmittingGdpr}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                  gdprChecked1 && !isSubmittingGdpr
                    ? "brand-gradient text-white hover:brand-gradient-hover shadow-lg cursor-pointer"
                    : "bg-white/10 text-white/40 cursor-not-allowed"
                }`}
              >
                {isSubmittingGdpr ? "Ukladám…" : "Dokončiť registráciu a pokračovať"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main App Layout */}
      <header className="brand-gradient text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-inner">
              <span className="text-brand-navy font-bold text-xl">SW</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">SportWell</h1>
              <p className="text-xs text-brand-light-cyan">Tvoje zdravie, náš šport, tvoja pohoda.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm bg-white/15 px-3 py-1 rounded-full border border-white/10">
              Ahoj, <strong>{profiles.find(p => p.role === activeRole)?.first_name}</strong>
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto w-full px-4 py-8 flex flex-col md:flex-row gap-8 flex-1">
        
        {/* Navigation Sidebar */}
        <aside className="md:w-64 flex flex-col gap-2">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 px-3">Sekcie</h3>
            <nav className="flex flex-col gap-1">
              <button
                onClick={() => setActiveTab("prehlad")}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === "prehlad" 
                    ? "bg-brand-navy text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Prehľad a diagnostiky
              </button>

              {activeRole === "klient" && (
                <>
                  <button
                    onClick={() => setActiveTab("treningy")}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      activeTab === "treningy" 
                        ? "bg-brand-navy text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Môj tréningový plán
                  </button>
                  <button
                    onClick={() => setActiveTab("rezervacie")}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      activeTab === "rezervacie" 
                        ? "bg-brand-navy text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Rezervácia termínu
                  </button>
                </>
              )}

              {activeRole === "admin" && (
                <>
                  <button
                    onClick={() => setActiveTab("financie")}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      activeTab === "financie" 
                        ? "bg-brand-navy text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Finančné reporty
                  </button>
                  <button
                    onClick={() => setActiveTab("audit")}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      activeTab === "audit" 
                        ? "bg-brand-navy text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Audit logs (GDPR)
                  </button>
                </>
              )}
            </nav>
          </div>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 flex flex-col gap-6">

          {/* TAB 1: PREHLAD & DIAGNOSTIKY */}
          {activeTab === "prehlad" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Main cards or diagnostic input */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Dynamic Patient Card / Diagnostic list */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                    <h2 className="text-xl font-bold text-brand-navy">Zdravotná karta (Roman Kováč)</h2>
                    <span className="text-xs bg-brand-cyan/20 text-brand-navy px-3 py-1 rounded-full font-bold">Aktívna</span>
                  </div>

                  {/* Diagnostic records matching RBAC view rules */}
                  <div className="space-y-4">
                    {medicalCards
                      .filter(card => {
                        // Apply RBAC filters for reading
                        if (activeRole === "maser") return card.type === "masaz";
                        if (activeRole === "trener") return card.type === "trening";
                        if (activeRole === "nutricny") return card.type === "nutricia";
                        return true; // Admin, Ortoped, Fyzio, and Client see everything
                      })
                      .map(card => (
                        <div key={card.id} className="p-4 bg-brand-off-white/50 border border-gray-200/60 rounded-xl space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-brand-navy uppercase tracking-wider">{card.type} záznam</span>
                            <span className="text-gray-500">{new Date(card.created_at).toLocaleDateString("sk-SK")}</span>
                          </div>
                          <p className="text-xs text-gray-500">Vytvoril: {card.created_by_name}</p>
                          
                          {card.pain_map_data && card.pain_map_data.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs font-semibold block mb-1">Zaznamenané body bolesti:</span>
                              <div className="flex flex-wrap gap-2">
                                {card.pain_map_data.map((p, idx) => (
                                  <span key={idx} className="bg-white px-3 py-1 rounded-lg border text-xs shadow-sm flex items-center gap-2">
                                    <strong>{p.region}</strong> 
                                    <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">{p.intensity}/10</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3 pt-3 border-t border-gray-200/40">
                            {Object.entries(card.form_data).map(([key, val]) => (
                              <div key={key}>
                                <strong className="text-xs uppercase text-gray-400 block">{key}</strong>
                                <span className="text-gray-700">{val}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                    {medicalCards.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-6">Žiadne záznamy na zobrazenie pre tvoju rolu.</p>
                    )}
                  </div>
                </div>

                {/* Specialist Input Form (visible only to non-clients, orthopedic/fyzio write access) */}
                {isEmployee && activeRole !== "maser" && activeRole !== "trener" && activeRole !== "nutricny" && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50">
                    <h3 className="text-lg font-bold text-brand-navy mb-4">Pridať nový záznam do karty</h3>
                    <form onSubmit={saveSpecialistEntry} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold mb-1">Klient</label>
                          <select className="w-full bg-brand-off-white border rounded-lg px-3 py-2 text-sm outline-none">
                            <option value="u1">Roman Kováč</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1">Typ záznamu</label>
                          <select
                            value={newCardType}
                            onChange={(e: any) => setNewCardType(e.target.value)}
                            className="w-full bg-brand-off-white border rounded-lg px-3 py-2 text-sm outline-none"
                          >
                            <option value="ortoped">Ortopedický</option>
                            <option value="fyzio">Fyzioterapeutický</option>
                            <option value="masaz">Masážny</option>
                            <option value="trening">Tréningový</option>
                            <option value="nutricia">Nutričný</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1">Diagnóza / Popis nálezu</label>
                          <textarea
                            required
                            value={newCardFormData.field1}
                            onChange={(e) => setNewCardFormData({ ...newCardFormData, field1: e.target.value })}
                            className="w-full bg-brand-off-white border rounded-lg px-3 py-2 text-sm outline-none h-20"
                            placeholder="Zadajte podrobné informácie..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1">Odporúčaný terapeutický plán</label>
                          <input
                            type="text"
                            required
                            value={newCardFormData.field2}
                            onChange={(e) => setNewCardFormData({ ...newCardFormData, field2: e.target.value })}
                            className="w-full bg-brand-off-white border rounded-lg px-3 py-2 text-sm outline-none"
                            placeholder="Zadajte ďalší postup..."
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="py-2.5 px-5 rounded-xl font-bold text-sm text-white bg-brand-cyan hover:bg-brand-hover-cyan transition-colors"
                      >
                        Uložiť záznam
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Right Column: Pain Map Canvas */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-bold text-brand-navy">Mapa bolesti (Pain Map)</h3>
                  <p className="text-xs text-gray-500 mt-1">Vyber kliknutím oblasť na tele a priraď intenzitu bolesti.</p>
                </div>

                {/* SVG Silhouette Container */}
                <div className="flex flex-col items-center gap-3">
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => setBodySide('front')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        bodySide === 'front' ? 'bg-brand-navy text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Predná časť
                    </button>
                    <button
                      onClick={() => setBodySide('back')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        bodySide === 'back' ? 'bg-brand-navy text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Zadná časť
                    </button>
                  </div>

                  {/* Interactive Silhouette */}
                  <div className="relative w-full max-w-[200px] h-[340px] bg-gray-50 rounded-xl p-4 border flex justify-center items-center">
                    <svg viewBox="0 0 100 200" className="w-full h-full text-gray-300" aria-label="Body outline map">
                      {/* Stylized Body outline */}
                      <path
                        d="M 50 10 C 45 10 42 15 42 20 C 42 25 45 30 50 30 C 55 30 58 25 58 20 C 58 15 55 10 50 10 Z M 48 30 L 52 30 L 53 36 L 62 38 L 65 70 L 61 70 L 58 45 L 58 85 L 56 120 L 57 170 L 52 170 L 50 125 L 48 125 L 46 170 L 41 170 L 42 120 L 40 85 L 40 45 L 37 70 L 33 70 L 36 38 L 45 36 Z"
                        fill="currentColor"
                      />
                      
                      {/* Interaction Hotspots */}
                      {bodySide === 'front' ? (
                        <>
                          {/* Head */}
                          <circle cx="50" cy="20" r="6" className={`cursor-pointer transition-all ${selectedPainRegion === 'Hlava' ? 'fill-brand-cyan stroke-2 stroke-brand-navy' : 'fill-red-500/40 hover:fill-red-500'}`} onClick={() => setSelectedPainRegion('Hlava')} aria-label="Hlava" />
                          {/* Chest */}
                          <circle cx="50" cy="48" r="5" className={`cursor-pointer transition-all ${selectedPainRegion === 'Hrudník' ? 'fill-brand-cyan stroke-2 stroke-brand-navy' : 'fill-red-500/40 hover:fill-red-500'}`} onClick={() => setSelectedPainRegion('Hrudník')} aria-label="Hrudník" />
                          {/* Right Knee */}
                          <circle cx="43" cy="115" r="5" className={`cursor-pointer transition-all ${selectedPainRegion === 'Pravé koleno' ? 'fill-brand-cyan stroke-2 stroke-brand-navy' : 'fill-red-500/40 hover:fill-red-500'}`} onClick={() => setSelectedPainRegion('Pravé koleno')} aria-label="Pravé koleno" />
                          {/* Left Knee */}
                          <circle cx="57" cy="115" r="5" className={`cursor-pointer transition-all ${selectedPainRegion === 'Ľavé koleno' ? 'fill-brand-cyan stroke-2 stroke-brand-navy' : 'fill-red-500/40 hover:fill-red-500'}`} onClick={() => setSelectedPainRegion('Ľavé koleno')} aria-label="Ľavé koleno" />
                        </>
                      ) : (
                        <>
                          {/* Neck */}
                          <circle cx="50" cy="32" r="5" className={`cursor-pointer transition-all ${selectedPainRegion === 'Krk' ? 'fill-brand-cyan stroke-2 stroke-brand-navy' : 'fill-red-500/40 hover:fill-red-500'}`} onClick={() => setSelectedPainRegion('Krk')} aria-label="Krk" />
                          {/* Upper Back */}
                          <circle cx="50" cy="50" r="6" className={`cursor-pointer transition-all ${selectedPainRegion === 'Medzilopatková oblasť' ? 'fill-brand-cyan stroke-2 stroke-brand-navy' : 'fill-red-500/40 hover:fill-red-500'}`} onClick={() => setSelectedPainRegion('Medzilopatková oblasť')} aria-label="Medzilopatková oblasť" />
                          {/* Low Back / Kríže */}
                          <circle cx="50" cy="75" r="6" className={`cursor-pointer transition-all ${selectedPainRegion === 'Kríže' ? 'fill-brand-cyan stroke-2 stroke-brand-navy' : 'fill-red-500/40 hover:fill-red-500'}`} onClick={() => setSelectedPainRegion('Kríže')} aria-label="Kríže" />
                        </>
                      )}
                    </svg>
                  </div>
                </div>

                {/* Pain Detail Slider Input Panel */}
                <div className="bg-brand-off-white/40 p-4 rounded-xl border border-gray-200/50 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-gray-500">Zóna:</span>
                    <span className="text-sm font-bold text-brand-navy">{selectedPainRegion || "Nevybraná"}</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Intenzita bolesti (VAS Škála):</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={painIntensity}
                        onChange={(e) => setPainIntensity(parseInt(e.target.value))}
                        className="flex-1 accent-brand-cyan cursor-pointer"
                      />
                      <span className="w-8 text-center text-sm font-bold bg-red-100 text-red-700 px-2 py-1 rounded">
                        {painIntensity}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1" htmlFor="pain_notes">Slovný popis pocitu / bolesť</label>
                    <input
                      id="pain_notes"
                      type="text"
                      value={painNotes}
                      onChange={(e) => setPainNotes(e.target.value)}
                      className="w-full bg-white border rounded-lg px-3 py-2 text-xs outline-none"
                      placeholder="napr. tupá bolesť pri tlaku…"
                    />
                  </div>

                  <button
                    onClick={savePainPoint}
                    disabled={!selectedPainRegion}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs text-white transition-all ${
                      selectedPainRegion 
                        ? "bg-brand-navy hover:bg-brand-dark-navy cursor-pointer shadow-sm"
                        : "bg-gray-200 cursor-not-allowed text-gray-400"
                    }`}
                  >
                    Uložiť bolesť
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRENINGOVY PLAN & VIDEO LIBRARY */}
          {activeTab === "treningy" && activeRole === "klient" && (
            <div className="space-y-6">
              
              {/* Training Overview */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50">
                <h2 className="text-xl font-bold text-brand-navy mb-4">Cvičebný denník</h2>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-brand-off-white/40 p-4 rounded-xl text-center border">
                    <span className="block text-2xl font-bold text-brand-navy">12</span>
                    <span className="text-xs text-gray-500">Celkových tréningov</span>
                  </div>
                  <div className="bg-brand-off-white/40 p-4 rounded-xl text-center border">
                    <span className="block text-2xl font-bold text-brand-cyan">3</span>
                    <span className="text-xs text-gray-500">Tento týždeň</span>
                  </div>
                  <div className="bg-brand-off-white/40 p-4 rounded-xl text-center border">
                    <span className="block text-2xl font-bold text-emerald-600">92%</span>
                    <span className="text-xs text-gray-500">Adherencia k plánu</span>
                  </div>
                </div>

                {/* Workout Video Loops */}
                <h3 className="font-bold text-brand-navy mb-3">Tvoj rehabilitačný plán na doma</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Exercise card 1 */}
                  <div className="border border-gray-200/70 rounded-xl overflow-hidden shadow-sm flex flex-col">
                    {/* HTML5 video simulation */}
                    <div className="relative aspect-video bg-brand-dark-navy flex items-center justify-center text-white">
                      {/* Decorative canvas replacing large video, complying with muted loop layout restrictions */}
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                        <div className="w-8 h-8 rounded-full border-2 border-brand-cyan border-t-transparent animate-spin mb-2"></div>
                        <span className="text-xs font-semibold text-brand-cyan tracking-wide">VIDEO: Mobilizácia pravého kolena</span>
                        <span className="text-[10px] text-gray-400 mt-1">Looped | Auto-playing | Muted</span>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-gray-800">Mobilita kolenného kĺbu</h4>
                        <p className="text-xs text-gray-500 mt-1">3 série po 10 opakovaní. RPE intenzita max 6/10.</p>
                      </div>
                      <div className="mt-4 pt-3 border-t flex justify-between items-center">
                        <button
                          onClick={() => {
                            logAction("klient", "UPDATE", "medical_cards", "mc2", "Klient označil tréning 'Mobilita kolenného kĺbu' za splnený.");
                            showToast("Skvelá práca! Tréning bol označený za splnený.");
                          }}
                          className="px-3 py-1.5 bg-brand-cyan hover:bg-brand-hover-cyan text-brand-dark-navy text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Označiť za splnené
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Exercise card 2 */}
                  <div className="border border-gray-200/70 rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="relative aspect-video bg-brand-dark-navy flex items-center justify-center text-white">
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                        <div className="w-8 h-8 rounded-full border-2 border-brand-cyan border-t-transparent animate-spin mb-2"></div>
                        <span className="text-xs font-semibold text-brand-cyan tracking-wide">VIDEO: Core stabilizácia chrbta</span>
                        <span className="text-[10px] text-gray-400 mt-1">Looped | Auto-playing | Muted</span>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-gray-800">Hlboký stabilizačný systém</h4>
                        <p className="text-xs text-gray-500 mt-1">Výdrž 4x 30 sekúnd v planku s oporou.</p>
                      </div>
                      <div className="mt-4 pt-3 border-t flex justify-between items-center">
                        <button
                          onClick={() => {
                            logAction("klient", "UPDATE", "medical_cards", "mc2", "Klient označil tréning 'Core stabilizácia' za splnený.");
                            showToast("Skvelá práca! Tréning bol označený za splnený.");
                          }}
                          className="px-3 py-1.5 bg-brand-cyan hover:bg-brand-hover-cyan text-brand-dark-navy text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Označiť za splnené
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RESERVATIONS & 24H RULE */}
          {activeTab === "rezervacie" && activeRole === "klient" && (
            <div className="space-y-6">
              
              {/* Existing reservations list */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50">
                <h2 className="text-xl font-bold text-brand-navy mb-4">Moje plánované termíny</h2>
                <div className="space-y-3">
                  {reservations.map(res => (
                    <div key={res.id} className="p-4 bg-brand-off-white/50 border rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <span className="text-xs font-bold uppercase text-gray-400 block">Služba / Špecialista</span>
                        <span className="font-bold text-gray-800 text-sm">{res.staff_name}</span>
                        <div className="text-xs text-gray-500 mt-1">
                          Čas: {new Date(res.start_time).toLocaleString("sk-SK")}
                        </div>
                        <div className="mt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            res.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {res.status === 'confirmed' ? 'Potvrdené' : 'Stornované'}
                          </span>
                        </div>
                      </div>

                      {res.status === 'confirmed' && (
                        <button
                          onClick={() => initiateCancel(res.id)}
                          className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold rounded-xl transition-all cursor-pointer self-start sm:self-auto"
                        >
                          Zrušiť termín
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Simulation explanation warning card */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 text-xs flex gap-3">
                <span className="text-lg">⚠️</span>
                <div>
                  <h4 className="font-bold mb-1">Storno pravidlá:</h4>
                  Bezplatné storno je povolené najneskôr 24 hodín pred začiatkom. Ak zrušíte termín neskôr, záloha prepadá v prospech centra na pokrytie nákladov na vyhradeného špecialistu.
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FINANCIAL REPORT (Admin view) */}
          {activeTab === "financie" && activeRole === "admin" && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-brand-navy">Finančné prehľady centra</h2>
                <p className="text-xs text-gray-500 mt-1">Dáta sú izolované a neprepájajú sa so zdravotnými informáciami.</p>
              </div>

              {/* Financial stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-4 bg-brand-off-white rounded-xl border">
                  <span className="text-xs text-gray-400 block font-semibold">Obrat tento mesiac</span>
                  <span className="text-3xl font-bold text-brand-navy">12,450 €</span>
                  <span className="text-xs text-emerald-600 block mt-1">+12% oproti minulému mesiacu</span>
                </div>
                <div className="p-4 bg-brand-off-white rounded-xl border">
                  <span className="text-xs text-gray-400 block font-semibold">Priemerná hodnota nákupu</span>
                  <span className="text-3xl font-bold text-brand-navy">45 €</span>
                  <span className="text-xs text-gray-500 block mt-1">Základ: 276 rezervácií</span>
                </div>
                <div className="p-4 bg-brand-off-white rounded-xl border">
                  <span className="text-xs text-gray-400 block font-semibold">Storno poplatky (výnosy)</span>
                  <span className="text-3xl font-bold text-red-600">320 €</span>
                  <span className="text-xs text-gray-500 block mt-1">Z neskorých stornovaní</span>
                </div>
              </div>

              {/* Breakdown */}
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-brand-navy text-white font-bold">
                    <tr>
                      <th className="p-3">Špecialista / Služba</th>
                      <th className="p-3">Počet termínov</th>
                      <th className="p-3">Výnos celkom</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="p-3 font-semibold">Mgr. Lucia Bieliková (Fyzio)</td>
                      <td className="p-3">142</td>
                      <td className="p-3 font-bold">6,390 €</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Peter Varga (Masér)</td>
                      <td className="p-3">94</td>
                      <td className="p-3 font-bold">3,760 €</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Bc. Martin Švec (Tréner)</td>
                      <td className="p-3">40</td>
                      <td className="p-3 font-bold">2,300 €</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS (Admin view) */}
          {activeTab === "audit" && activeRole === "admin" && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-brand-navy">Bezpečnostný Auditný Log (GDPR)</h2>
                <p className="text-xs text-gray-500 mt-1">Nezmazateľné záznamy o každom prístupe a zápise do zdravotnej dokumentácie.</p>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {auditLogs.map(log => (
                  <div key={log.id} className="p-3 bg-brand-off-white/40 border border-gray-200/60 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between items-center font-semibold text-brand-navy">
                      <span>{log.user_name} ({log.action})</span>
                      <span className="text-[10px] text-gray-500">{new Date(log.created_at).toLocaleString("sk-SK")}</span>
                    </div>
                    <div className="text-gray-600">
                      <strong>Tabuľka:</strong> {log.table_name} | <strong>ID záznamu:</strong> {log.record_id}
                    </div>
                    <div className="text-gray-700 bg-white p-2 rounded border border-gray-200 mt-1 font-mono text-[10px]">
                      {log.new_data}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Late Cancellation Modal Dialogue */}
      {cancelModalInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white text-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200">
            <h3 className="text-lg font-bold text-brand-navy mb-2">Potvrdiť zrušenie termínu</h3>
            
            {cancelModalInfo.isLate ? (
              <p className="text-xs text-red-600 font-semibold mb-4 bg-red-50 p-3 rounded-lg border border-red-200">
                ⚠️ Upozornenie: Tento termín začína o menej ako 24 hodín. Zrušenie je považované za neskoré a bude ti naúčtovaný storno poplatok v plnej výške rezervovanej služby.
              </p>
            ) : (
              <p className="text-xs text-gray-600 mb-4">
                Tento termín začína o viac ako 24 hodín. Zrušenie prebehne bezplatne. Chceš pokračovať?
              </p>
            )}

            <div className="flex gap-3 justify-end text-xs">
              <button
                onClick={() => setCancelModalInfo(null)}
                className="px-4 py-2 border rounded-xl hover:bg-gray-100 font-bold transition-all cursor-pointer"
              >
                Naspäť
              </button>
              <button
                onClick={confirmCancellation}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all cursor-pointer"
              >
                Potvrdiť zrušenie
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-brand-dark-navy text-white/50 text-center py-6 text-xs border-t border-white/10 mt-auto">
        <p>© 2026 SportWell. Všetky práva vyhradené. Vytvorené v súlade s GDPR a Brand Manualom.</p>
      </footer>
    </div>
  );
}
