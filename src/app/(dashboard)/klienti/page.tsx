"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext, ClientProfile } from "@/components/providers/AuthProvider";
import { useClients } from "@/hooks/useClients";
import { useAssignments } from "@/hooks/useAssignments";
import { createClient } from "@/utils/supabase/client";

export default function KlientiPage() {
  const router = useRouter();
  const { currentUserProfile } = useAuthContext();
  const { clients, pendingClients, loading, error, fetchClients, fetchPendingClients, deletePendingClient } = useClients();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  useEffect(() => {
    if (currentUserProfile && currentUserProfile.role !== "klient") {
      fetchClients(searchTerm, 0);
      fetchPendingClients();
    }
  }, [currentUserProfile, searchTerm]);

  if (currentUserProfile?.role === "klient") {
    return (
      <div className="flex justify-center py-20">
        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl font-medium border border-red-100">
          Nemáte prístup do tejto sekcie.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-gray-100/50">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">Správa Klientov</h1>
          <p className="text-gray-500 mt-1 font-medium">Prehľad všetkých klientov a ich priradených trénerov</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 group-focus-within:text-brand-cyan transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input
              type="text"
              placeholder="Hľadať klienta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan transition-all shadow-sm"
            />
          </div>
          {currentUserProfile?.role === 'admin' && (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="bg-brand-cyan hover:bg-brand-cyan/90 hover:-translate-y-0.5 text-brand-dark-navy px-5 py-2.5 rounded-xl font-bold shadow-[0_4px_14px_0_rgba(0,240,255,0.39)] transition-all duration-200 whitespace-nowrap flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Pozvať klienta
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 overflow-hidden">
        <div className="bg-brand-dark-navy px-6 py-5 border-b border-gray-100/10 flex items-center justify-between">
          <h3 className="font-bold text-white text-lg tracking-wide">Zoznam klientov</h3>
          <span className="bg-brand-cyan/20 text-brand-cyan text-xs font-bold px-3 py-1 rounded-full border border-brand-cyan/30">
            {clients.length} CELKOM
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-cyan"></div>
          </div>
        ) : clients.length === 0 ? (
          <div className="p-16 text-center text-gray-400 bg-gray-50/50">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-20 text-brand-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            <p className="font-medium text-lg">Nenašli sa žiadni klienti</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-brand-navy/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-brand-navy/60 uppercase tracking-wider">Klient</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-brand-navy/60 uppercase tracking-wider">Kontakt</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-brand-navy/60 uppercase tracking-wider">Priradený personál</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-brand-navy/60 uppercase tracking-wider">Aktivita</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-brand-navy/60 uppercase tracking-wider">GDPR Stav</th>
                  {currentUserProfile?.role === 'admin' && <th className="px-6 py-4"></th>}
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-gray-50">
                {clients.map((client) => (
                  <tr 
                    key={client.id} 
                    className="hover:bg-brand-light-cyan/20 cursor-pointer transition-colors group"
                    onClick={() => router.push(`/klienti/${client.id}`)}
                  >
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-brand-navy to-brand-dark-navy flex items-center justify-center text-brand-cyan font-bold text-lg shadow-sm">
                          {client.full_name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-brand-navy group-hover:text-brand-cyan transition-colors">{client.full_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{client.email || 'Bez e-mailu'}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{client.phone || 'Bez telefónu'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* @ts-ignore */}
                      {client.assignments && client.assignments.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {/* @ts-ignore */}
                          {client.assignments.map((specName, i) => (
                            <span key={i} className="px-2 py-0.5 inline-flex text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                              {specName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Nepriradený</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className="px-2.5 py-1 inline-flex text-xs font-bold rounded-full bg-purple-50 text-purple-700 border border-purple-100 items-center">
                         <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                         {/* @ts-ignore */}
                         {client.plansCount || 0} plánov
                       </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {client.gdpr_signed_at ? (
                        <span className="px-2.5 py-1 inline-flex text-xs font-bold rounded-full bg-green-50 text-green-700 border border-green-100">
                          Podpísané
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 inline-flex text-xs font-bold rounded-full bg-red-50 text-red-700 border border-red-100">
                          Chýba podpis
                        </span>
                      )}
                    </td>
                    {currentUserProfile?.role === 'admin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClient(client);
                          }}
                          className="text-brand-cyan hover:text-brand-navy font-bold opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-brand-light-cyan/30 md:bg-transparent px-3 py-1.5 md:p-0 rounded-lg md:rounded-none"
                        >
                          Priradiť
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pendingClients && pendingClients.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden animate-in fade-in duration-500">
          <div className="bg-orange-50/50 px-6 py-5 border-b border-orange-100 flex items-center justify-between">
            <h3 className="font-bold text-orange-800 text-lg">Čakajúci klienti na registráciu</h3>
            <span className="bg-orange-200 text-orange-800 text-xs font-bold px-3 py-1 rounded-full">
              {pendingClients.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-orange-100">
              <thead className="bg-orange-50/30">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Klient</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">Kontakt</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-orange-400 uppercase tracking-wider">Akcie</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-orange-50">
                {pendingClients.map((inv) => (
                  <tr key={inv.id} className="hover:bg-orange-50/20 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                          {inv.first_name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-brand-navy">{inv.first_name} {inv.last_name}</div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => deletePendingClient(inv.id)} 
                        className="text-red-400 hover:text-red-600 font-bold opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-red-50 md:bg-transparent px-3 py-1.5 md:p-0 rounded-lg md:rounded-none inline-block"
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

      {selectedClient && (
        <AssignmentModal
          client={selectedClient}
          onClose={() => {
            setSelectedClient(null);
            fetchClients(searchTerm, 0);
          }}
          currentUserProfile={currentUserProfile}
        />
      )}

      {isInviteModalOpen && (
        <InviteClientModal onClose={() => { setIsInviteModalOpen(false); fetchPendingClients(); }} currentUserProfile={currentUserProfile} />
      )}
    </div>
  );
}

function InviteClientModal({ onClose, currentUserProfile }: { onClose: () => void, currentUserProfile: any }) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !firstName || !lastName) return;
    
    setStatus("loading");
    const supabase = createClient();
    
    try {
      const { error } = await supabase.from('client_invitations').insert({
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        address,
        created_by: currentUserProfile?.id
      });
      
      if (error) throw error;
      setStatus("success");
      
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err: any) {
      console.error("Supabase error:", err);
      alert("Chyba pri ukladaní: " + (err.message || JSON.stringify(err)));
      setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-dark-navy/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-brand-off-white px-6 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
          <h3 className="text-xl font-bold text-brand-navy">Pozvať nového klienta</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Vyplňte základné údaje o klientovi. Následne ho inštruujte, aby sa prihlásil na <span className="font-bold text-brand-navy">stránke SportWell zadaním tohto e-mailu</span>. Systém mu po prihlásení automaticky predvyplní GDPR formulár.
          </p>
          
          {status === "success" ? (
            <div className="p-4 bg-green-50 text-green-700 rounded-xl text-center font-bold border border-green-100 flex flex-col items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              Klient bol úspešne pridaný do systému!
            </div>
          ) : (
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Meno *</label>
                  <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition-all" placeholder="napr. Ján" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Priezvisko *</label>
                  <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition-all" placeholder="napr. Kováč" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">E-mail klienta *</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition-all" placeholder="klient@email.sk" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Telefón</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition-all" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Adresa / Trvalý pobyt</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition-all" />
              </div>
              
              {status === "error" && (
                <div className="text-sm text-red-500 font-medium">
                  Nastala chyba pri vytváraní klienta. Tento e-mail už možno existuje.
                </div>
              )}
              
              <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-colors" disabled={status === "loading"}>Zrušiť</button>
                <button type="submit" disabled={status === "loading" || !email || !firstName || !lastName} className="px-5 py-2.5 bg-brand-cyan hover:shadow-md text-brand-dark-navy rounded-xl font-bold transition-all disabled:opacity-50">
                  {status === "loading" ? "Ukladám..." : "Vytvoriť pred-registráciu"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function AssignmentModal({ client, onClose, currentUserProfile }: any) {
  const { specialists, fetchSpecialists, fetchAssignedSpecialists, assignSpecialist, removeAssignment } = useAssignments();
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSpecialists();
    fetchAssignedSpecialists(client.id).then((ids) => {
      setAssignedIds(ids);
      setIsLoading(false);
    });
  }, []);

  const handleToggle = async (specialistId: string) => {
    if (assignedIds.includes(specialistId)) {
      setAssignedIds(prev => prev.filter(id => id !== specialistId));
      await removeAssignment(client.id, specialistId);
    } else {
      setAssignedIds(prev => [...prev, specialistId]);
      await assignSpecialist(client.id, specialistId, currentUserProfile.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-dark-navy/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-brand-off-white px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-brand-navy">Priradenie personálu</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 flex flex-col min-h-0">
          <div className="flex items-center mb-6 p-3 bg-brand-light-cyan/30 rounded-xl shrink-0">
             <div className="h-10 w-10 rounded-full bg-brand-light-cyan flex items-center justify-center text-brand-navy font-bold text-sm">
                {client.full_name.charAt(0)}
             </div>
             <div className="ml-3">
               <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">Klient</div>
               <div className="font-bold text-brand-navy">{client.full_name}</div>
             </div>
          </div>
          
          <p className="text-sm text-gray-500 mb-3 font-medium shrink-0">Vyberte zamestnancov, ktorí sa o klienta starajú:</p>
          
          {isLoading ? (
            <div className="py-8 flex justify-center">
               <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-brand-cyan"></div>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto flex-1 pr-2 custom-scrollbar">
              {specialists.map(spec => (
                <label key={spec.id} className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-colors border ${assignedIds.includes(spec.id) ? 'bg-brand-light-cyan/20 border-brand-cyan/50' : 'hover:bg-gray-50 border-gray-100'}`}>
                  <input
                    type="checkbox"
                    checked={assignedIds.includes(spec.id)}
                    onChange={() => handleToggle(spec.id)}
                    className="h-5 w-5 text-brand-cyan focus:ring-brand-cyan border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-bold text-gray-800 block">{spec.full_name}</span>
                    <span className="text-xs text-gray-500">{spec.metadata?.position || 'Tréner'}</span>
                  </div>
                </label>
              ))}
            </div>
          )}
          
          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-brand-cyan hover:shadow-md text-brand-dark-navy rounded-xl font-bold transition-all"
            >
              Hotovo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
