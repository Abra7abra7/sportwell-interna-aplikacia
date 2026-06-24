"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ClientCard from './ClientCard';
import InviteClientModal from './InviteClientModal';
import AssignmentModal from './AssignmentModal';
import { deletePendingClientAction } from '../actions';

interface ClientListProps {
  initialClients: any[];
  initialPending: any[];
  currentUserProfile: any;
  query: string;
}

export default function ClientList({
  initialClients,
  initialPending,
  currentUserProfile,
  query
}: ClientListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(query);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Debounced URL updates for search query
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim() !== query) {
        const url = searchTerm.trim() 
          ? `/klienti?q=${encodeURIComponent(searchTerm.trim())}` 
          : '/klienti';
        router.push(url, { scroll: false });
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, query, router]);

  const hasAccess = ['admin', 'majitel', 'recepcia'].includes(currentUserProfile?.role || '');

  const handleDeletePending = async (id: string, name: string) => {
    if (!confirm(`Naozaj chcete zrušiť čakajúcu pozvánku pre ${name}?`)) return;
    setIsDeletingId(id);
    try {
      await deletePendingClientAction(id);
    } catch (err) {
      console.error(err);
      alert("Chyba pri rušení pozvánky.");
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Banner with Search and Invite Button */}
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
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan transition-all shadow-sm text-sm"
            />
          </div>
          {hasAccess && (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="bg-brand-cyan hover:bg-brand-cyan/90 hover:-translate-y-0.5 text-brand-dark-navy px-5 py-2.5 rounded-xl font-bold shadow-[0_4px_14px_0_rgba(0,240,255,0.39)] transition-all duration-200 whitespace-nowrap flex items-center gap-2 text-sm justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Pozvať klienta
            </button>
          )}
        </div>
      </div>

      {/* Main Client List Panel */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 overflow-hidden">
        <div className="bg-brand-dark-navy px-6 py-5 border-b border-gray-100/10 flex items-center justify-between">
          <h3 className="font-bold text-white text-lg tracking-wide">Zoznam klientov</h3>
          <span className="bg-brand-cyan/20 text-brand-cyan text-xs font-bold px-3 py-1 rounded-full border border-brand-cyan/30">
            {initialClients.length} CELKOM
          </span>
        </div>

        {initialClients.length === 0 ? (
          <div className="p-16 text-center text-gray-400 bg-gray-50/50">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-20 text-brand-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            <p className="font-medium text-lg">Nenašli sa žiadni klienti</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (md breakpoint and up) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-brand-navy/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-brand-navy/60 uppercase tracking-wider">Klient</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-brand-navy/60 uppercase tracking-wider">Kontakt</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-brand-navy/60 uppercase tracking-wider">Priradený personál</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-brand-navy/60 uppercase tracking-wider">Aktivita</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-brand-navy/60 uppercase tracking-wider">GDPR Stav</th>
                    {hasAccess && <th className="px-6 py-4"></th>}
                  </tr>
                </thead>
                <tbody className="bg-white/50 divide-y divide-gray-50">
                  {initialClients.map((client) => (
                    <tr 
                      key={client.id} 
                      className="hover:bg-brand-light-cyan/20 cursor-pointer transition-colors group"
                      onClick={() => router.push(`/klienti/${client.id}`)}
                    >
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-brand-navy to-brand-dark-navy flex items-center justify-center text-brand-cyan font-bold text-lg shadow-sm shrink-0">
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
                        {client.assignments && client.assignments.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {client.assignments.map((specName: string, i: number) => (
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
                      {hasAccess && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClient(client);
                            }}
                            className="text-brand-cyan hover:text-brand-navy font-bold opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-brand-light-cyan/30 md:bg-transparent px-3 py-1.5 md:p-0 rounded-lg md:rounded-none min-h-[44px]"
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

            {/* Mobile Card View (hidden on desktop, block on mobile) */}
            <div className="block md:hidden p-4 grid grid-cols-1 gap-4 bg-gray-50/50">
              {initialClients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  showAssignButton={hasAccess}
                  onAssign={() => setSelectedClient(client)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Waiting Room Panel */}
      {initialPending && initialPending.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden animate-in fade-in duration-500">
          <div className="bg-orange-50/50 px-6 py-5 border-b border-orange-100 flex items-center justify-between">
            <h3 className="font-bold text-orange-800 text-lg">Čakajúci klienti na registráciu</h3>
            <span className="bg-orange-200 text-orange-800 text-xs font-bold px-3 py-1 rounded-full">
              {initialPending.length}
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
                {initialPending.map((inv) => (
                  <tr key={inv.id} className="hover:bg-orange-50/20 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
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
                        onClick={() => handleDeletePending(inv.id, `${inv.first_name} ${inv.last_name}`)} 
                        disabled={isDeletingId === inv.id}
                        className="text-red-400 hover:text-red-600 font-bold opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-red-50 md:bg-transparent px-3 py-1.5 md:p-0 rounded-lg md:rounded-none inline-block min-h-[44px]"
                      >
                        {isDeletingId === inv.id ? "Ruším..." : "Zrušiť"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {selectedClient && (
        <AssignmentModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          currentUserProfile={currentUserProfile}
        />
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <InviteClientModal 
          onClose={() => setIsInviteModalOpen(false)} 
        />
      )}
    </div>
  );
}
