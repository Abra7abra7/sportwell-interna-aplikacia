"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { createClient } from "@/utils/supabase/client";

// Spoločné možnosti rolí
const ROLE_OPTIONS = [
  "Tréner",
  "Fyzioterapeut",
  "Masér",
  "Nutričný poradca",
  "Ortopéd",
  "Administrátor",
  "Recepcia"
];

export default function ZamestnanciPage() {
  const { currentUserProfile } = useAuthContext();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingActive, setEditingActive] = useState<any>(null);
  const [editingPending, setEditingPending] = useState<any>(null);
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchEmployees = async () => {
    setLoading(true);
    
    // Získanie aktívnych zamestnancov
    const { data: activeData } = await supabase
      .from('profiles')
      .select('*')
      .neq('role', 'klient')
      .order('full_name');
    
    // Získanie čakajúcich pozvánok
    const { data: pendingData } = await supabase
      .from('employee_invitations')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (activeData) setEmployees(activeData);
    if (pendingData) setPendingInvites(pendingData);
    
    setLoading(false);
  };

  useEffect(() => {
    if (currentUserProfile?.role === 'admin') {
      fetchEmployees();
    }
  }, [currentUserProfile]);

  const handleDeleteActive = async (emp: any) => {
    if (!confirm(`Naozaj chcete odstrániť zamestnanca ${emp.full_name}? Bude mu odobraný prístup do systému.`)) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        role: 'klient', 
        metadata: { ...(emp.metadata || {}), inactive: true } 
      })
      .eq('id', emp.id);
      
    if (error) alert("Chyba pri odstraňovaní zamestnanca: " + error.message);
    else fetchEmployees();
  };

  const handleDeletePending = async (inv: any) => {
    if (!confirm(`Naozaj chcete zrušiť pozvánku pre ${inv.full_name}?`)) return;
    
    const { error } = await supabase
      .from('employee_invitations')
      .delete()
      .eq('id', inv.id);
      
    if (error) alert("Chyba pri mazaní pozvánky: " + error.message);
    else fetchEmployees();
  };

  if (currentUserProfile?.role !== "admin") {
    return (
      <div className="flex justify-center py-20">
        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl font-medium border border-red-100">
          Nemáte prístup do tejto sekcie. Iba Administrátor môže spravovať zamestnancov.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">Správa Zamestnancov</h1>
          <p className="text-gray-500 mt-1">Prehľad personálu a prístupov do systému</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="mt-4 md:mt-0 bg-brand-cyan hover:scale-105 text-brand-dark-navy px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all duration-200 whitespace-nowrap"
        >
          + Pridať zamestnanca
        </button>
      </div>

      {/* Tabuľka Aktívnych Zamestnancov */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-brand-off-white px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-brand-navy text-lg">Aktívni zamestnanci</h3>
          <span className="bg-brand-cyan/20 text-brand-dark-navy text-xs font-bold px-3 py-1 rounded-full">
            {employees.length}
          </span>
        </div>
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-cyan"></div>
          </div>
        ) : employees.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            Žiadni aktívni zamestnanci.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Zamestnanec</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Kontakt</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Rola / Pozícia</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Akcie</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-brand-off-white transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-brand-light-cyan flex items-center justify-center text-brand-navy font-bold text-sm">
                          {emp.full_name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-brand-navy">{emp.full_name}</div>
                          {emp.role === 'admin' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 uppercase tracking-wide mt-1">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{emp.email || 'Bez e-mailu'}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{emp.phone || 'Bez telefónu'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs font-bold rounded-full bg-brand-light-cyan text-brand-dark-navy">
                        {emp.metadata?.position || emp.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => setEditingActive(emp)} 
                        className="text-brand-cyan hover:text-brand-navy mr-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Upraviť
                      </button>
                      <button 
                        onClick={() => handleDeleteActive(emp)} 
                        className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Odstrániť
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tabuľka Čakajúcich Pozvánok */}
      {pendingInvites.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden animate-in fade-in duration-500">
          <div className="bg-orange-50/50 px-6 py-5 border-b border-orange-100 flex items-center justify-between">
            <h3 className="font-bold text-orange-800 text-lg">Čakajúce pozvánky</h3>
            <span className="bg-orange-200 text-orange-800 text-xs font-bold px-3 py-1 rounded-full">
              {pendingInvites.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-orange-100">
              <thead className="bg-orange-50/30">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Zamestnanec</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Kontakt</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Pozícia</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-orange-400 uppercase tracking-wider">Akcie</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-orange-50">
                {pendingInvites.map((inv) => (
                  <tr key={inv.id} className="hover:bg-orange-50/20 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                          {inv.full_name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-brand-navy">{inv.full_name}</div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 uppercase tracking-wide mt-1">
                            Neprihlásený
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{inv.email}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{inv.phone || 'Bez telefónu'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs font-bold rounded-full bg-gray-100 text-gray-600">
                        {inv.role_title}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => setEditingPending(inv)} 
                        className="text-brand-cyan hover:text-brand-navy mr-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Upraviť
                      </button>
                      <button 
                        onClick={() => handleDeletePending(inv)} 
                        className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Zrušiť
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showInviteModal && (
        <InviteEmployeeModal 
          onClose={() => { setShowInviteModal(false); fetchEmployees(); }}
          currentUserProfile={currentUserProfile}
        />
      )}

      {editingActive && (
        <EditActiveEmployeeModal
          employee={editingActive}
          onClose={() => { setEditingActive(null); fetchEmployees(); }}
        />
      )}

      {editingPending && (
        <EditPendingModal
          invite={editingPending}
          onClose={() => { setEditingPending(null); fetchEmployees(); }}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Invite Modal
// ----------------------------------------------------------------------
function InviteEmployeeModal({ onClose, currentUserProfile }: any) {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [roleTitle, setRoleTitle] = useState("Tréner");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('employee_invitations').insert({
      email,
      full_name: fullName,
      phone,
      address,
      role_title: roleTitle,
      created_by: currentUserProfile?.id
    });
    
    setLoading(false);
    if (!error) {
      alert("Pozvánka úspešne vytvorená. Zamestnanec sa teraz môže prihlásiť týmto e-mailom.");
      onClose();
    } else {
      alert("Chyba: " + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-dark-navy/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-brand-off-white px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-brand-navy">Pozvať zamestnanca</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Meno a Priezvisko *</label>
            <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} 
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition-all" 
              placeholder="napr. Ján Kováč" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">E-mail *</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} 
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition-all" 
              placeholder="jan@sportwell.sk" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Telefón</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Rola (Pozícia) *</label>
              <select value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan focus:border-transparent bg-white transition-all">
                {ROLE_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
          
          <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">
              Zrušiť
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 bg-brand-cyan hover:shadow-md text-brand-dark-navy rounded-xl font-bold transition-all disabled:opacity-50">
              {loading ? "Odosielam..." : "Vytvoriť pozvánku"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Edit Active Employee Modal
// ----------------------------------------------------------------------
function EditActiveEmployeeModal({ onClose, employee }: any) {
  const supabase = createClient();
  const [fullName, setFullName] = useState(employee.full_name || "");
  const [phone, setPhone] = useState(employee.phone || "");
  const [roleTitle, setRoleTitle] = useState(employee.metadata?.position || "Tréner");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const newMetadata = { ...(employee.metadata || {}), position: roleTitle };
    
    // Ak sa mení na "Administrátor", musíme upraviť aj internú DB rolu (len ak ide z trénera na admina a pod.)
    let newInternalRole = employee.role;
    if (roleTitle === 'Administrátor') newInternalRole = 'admin';
    else if (roleTitle === 'Recepcia') newInternalRole = 'recepcia';
    else newInternalRole = 'trener'; // Všetci ostatní špecialisti

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone,
        role: newInternalRole,
        metadata: newMetadata
      })
      .eq('id', employee.id);
    
    setLoading(false);
    if (!error) {
      onClose();
    } else {
      alert("Chyba: " + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-dark-navy/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-brand-off-white px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-brand-navy">Úprava zamestnanca</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Meno a Priezvisko</label>
            <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} 
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">E-mail (prihlasovací)</label>
            <input disabled type="email" value={employee.email} 
              className="w-full px-4 py-2 border border-gray-100 rounded-xl bg-gray-50 text-gray-400" title="Email nie je možné zmeniť" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Telefón</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pozícia</label>
              <select value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan focus:border-transparent bg-white transition-all">
                {ROLE_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
          <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">Zrušiť</button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 bg-brand-cyan hover:shadow-md text-brand-dark-navy rounded-xl font-bold transition-all disabled:opacity-50">Uložiť zmeny</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Edit Pending Modal
// ----------------------------------------------------------------------
function EditPendingModal({ onClose, invite }: any) {
  const supabase = createClient();
  const [email, setEmail] = useState(invite.email || "");
  const [fullName, setFullName] = useState(invite.full_name || "");
  const [phone, setPhone] = useState(invite.phone || "");
  const [roleTitle, setRoleTitle] = useState(invite.role_title || "Tréner");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase
      .from('employee_invitations')
      .update({
        email,
        full_name: fullName,
        phone,
        role_title: roleTitle
      })
      .eq('id', invite.id);
    
    setLoading(false);
    if (!error) {
      onClose();
    } else {
      alert("Chyba: " + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-dark-navy/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-orange-50/50 px-6 py-5 border-b border-orange-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-orange-800">Úprava pozvánky</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Meno a Priezvisko</label>
            <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} 
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">E-mail</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} 
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Telefón</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pozícia</label>
              <select value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan focus:border-transparent bg-white transition-all">
                {ROLE_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
          <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">Zrušiť</button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 bg-brand-cyan hover:shadow-md text-brand-dark-navy rounded-xl font-bold transition-all disabled:opacity-50">Uložiť</button>
          </div>
        </form>
      </div>
    </div>
  );
}
