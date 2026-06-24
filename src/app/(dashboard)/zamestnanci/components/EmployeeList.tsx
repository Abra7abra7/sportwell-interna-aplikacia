"use client";

import React, { useState } from "react";
import EmployeeCard from "./EmployeeCard";
import InviteEmployeeModal from "./InviteEmployeeModal";
import EditActiveEmployeeModal from "./EditActiveEmployeeModal";
import EditPendingModal from "./EditPendingModal";
import {
  toggleEmployeeActiveAction,
  deleteActiveEmployeeAction,
  deletePendingInviteAction,
} from "../actions";

interface EmployeeListProps {
  initialEmployees: any[];
  initialPending: any[];
  currentUserProfile: any;
}

export default function EmployeeList({
  initialEmployees,
  initialPending,
  currentUserProfile,
}: EmployeeListProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingActive, setEditingActive] = useState<any | null>(null);
  const [editingPending, setEditingPending] = useState<any | null>(null);

  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  const handleToggleActive = async (emp: any) => {
    const isCurrentlyActive = emp.is_active ?? true;
    const actionText = isCurrentlyActive ? "deaktivovať" : "aktivovať";
    if (!confirm(`Naozaj chcete ${actionText} zamestnanca ${emp.full_name}?`)) return;

    setLoadingActionId(emp.id);
    try {
      await toggleEmployeeActiveAction(emp.id, isCurrentlyActive);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Chyba pri zmene aktívneho stavu.");
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleDeleteActive = async (emp: any) => {
    if (
      !confirm(
        `Naozaj chcete odstrániť zamestnanca ${emp.full_name}? Bude mu odobraný prístup do systému a zmenená rola na klient.`
      )
    )
      return;

    setLoadingActionId(emp.id);
    try {
      await deleteActiveEmployeeAction(emp.id, emp.metadata);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Chyba pri odstraňovaní zamestnanca.");
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleDeletePending = async (inv: any) => {
    if (!confirm(`Naozaj chcete zrušiť pozvánku pre ${inv.full_name}?`)) return;

    setLoadingActionId(inv.id);
    try {
      await deletePendingInviteAction(inv.id);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Chyba pri mazaní pozvánky.");
    } finally {
      setLoadingActionId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-gray-100/50">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">Správa Zamestnancov</h1>
          <p className="text-gray-500 mt-1 font-medium">Prehľad personálu a prístupov do systému</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="mt-4 md:mt-0 bg-brand-cyan hover:bg-brand-cyan/90 hover:-translate-y-0.5 text-brand-dark-navy px-5 py-2.5 rounded-xl font-bold shadow-[0_4px_14px_0_rgba(0,240,255,0.39)] transition-all duration-200 whitespace-nowrap min-h-[44px] flex items-center justify-center text-sm gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Pridať zamestnanca
        </button>
      </div>

      {/* Active Employees Panel */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 overflow-hidden">
        <div className="bg-brand-dark-navy px-6 py-5 border-b border-gray-100/10 flex items-center justify-between">
          <h3 className="font-bold text-white text-lg tracking-wide">Aktívni zamestnanci</h3>
          <span className="bg-brand-cyan/20 text-brand-cyan text-xs font-bold px-3 py-1 rounded-full border border-brand-cyan/30">
            {initialEmployees.length} CELKOM
          </span>
        </div>

        {initialEmployees.length === 0 ? (
          <div className="p-16 text-center text-gray-400 bg-gray-50/50">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-20 text-brand-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            <p className="font-medium text-lg">Žiadni aktívni zamestnanci</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-brand-navy/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-brand-navy/60 uppercase tracking-wider">Zamestnanec</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-brand-navy/60 uppercase tracking-wider">Kontakt</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-brand-navy/60 uppercase tracking-wider">Rola / Pozícia</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-brand-navy/60 uppercase tracking-wider">Akcie</th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 divide-y divide-gray-50">
                  {initialEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      className={`hover:bg-brand-light-cyan/20 transition-colors group ${
                        emp.is_active === false ? "opacity-60 bg-gray-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-navy to-brand-dark-navy flex items-center justify-center text-brand-cyan font-bold text-sm shrink-0">
                            {emp.full_name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-brand-navy">{emp.full_name}</div>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {emp.role === "admin" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800 uppercase tracking-wide">
                                  Admin
                                </span>
                              )}
                              {emp.is_active === false && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-800 uppercase tracking-wide">
                                  Deaktivovaný
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{emp.email || "Bez e-mailu"}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{emp.phone || "Bez telefónu"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs font-bold rounded-full bg-brand-light-cyan text-brand-dark-navy">
                          {emp.metadata?.position || emp.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setEditingActive(emp)}
                          disabled={loadingActionId === emp.id}
                          className="text-brand-cyan hover:text-brand-navy mr-4 font-bold opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-brand-light-cyan/30 md:bg-transparent px-3 py-1.5 md:p-0 rounded-lg md:rounded-none inline-block min-h-[44px]"
                        >
                          Upraviť
                        </button>
                        <button
                          onClick={() => handleToggleActive(emp)}
                          disabled={loadingActionId === emp.id}
                          className="text-orange-400 hover:text-orange-600 mr-4 font-bold opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-orange-50 md:bg-transparent px-3 py-1.5 md:p-0 rounded-lg md:rounded-none inline-block min-h-[44px]"
                        >
                          {emp.is_active === false ? "Aktivovať" : "Deaktivovať"}
                        </button>
                        <button
                          onClick={() => handleDeleteActive(emp)}
                          disabled={loadingActionId === emp.id}
                          className="text-red-400 hover:text-red-600 font-bold opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-red-50 md:bg-transparent px-3 py-1.5 md:p-0 rounded-lg md:rounded-none inline-block min-h-[44px]"
                        >
                          Odstrániť
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden p-4 grid grid-cols-1 gap-4 bg-gray-50/50">
              {initialEmployees.map((emp) => (
                <EmployeeCard
                  key={emp.id}
                  employee={emp}
                  onEdit={() => setEditingActive(emp)}
                  onToggleActive={() => handleToggleActive(emp)}
                  onDelete={() => handleDeleteActive(emp)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pending Invitations Panel */}
      {initialPending && initialPending.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden animate-in fade-in duration-500">
          <div className="bg-orange-50/50 px-6 py-5 border-b border-orange-100 flex items-center justify-between">
            <h3 className="font-bold text-orange-800 text-lg">Čakajúce pozvánky</h3>
            <span className="bg-orange-200 text-orange-800 text-xs font-bold px-3 py-1 rounded-full">
              {initialPending.length}
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
                {initialPending.map((inv) => (
                  <tr key={inv.id} className="hover:bg-orange-50/20 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
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
                      <div className="text-xs text-gray-400 mt-0.5">{inv.phone || "Bez telefónu"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs font-bold rounded-full bg-gray-100 text-gray-600">
                        {inv.role_title}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setEditingPending(inv)}
                        disabled={loadingActionId === inv.id}
                        className="text-brand-cyan hover:text-brand-navy mr-4 font-bold opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-brand-light-cyan/30 md:bg-transparent px-3 py-1.5 md:p-0 rounded-lg md:rounded-none mb-2 md:mb-0 inline-block min-h-[44px]"
                      >
                        Upraviť
                      </button>
                      <button
                        onClick={() => handleDeletePending(inv)}
                        disabled={loadingActionId === inv.id}
                        className="text-red-400 hover:text-red-600 font-bold opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-red-50 md:bg-transparent px-3 py-1.5 md:p-0 rounded-lg md:rounded-none inline-block min-h-[44px]"
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

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteEmployeeModal
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {/* Edit Active Modal */}
      {editingActive && (
        <EditActiveEmployeeModal
          employee={editingActive}
          onClose={() => setEditingActive(null)}
        />
      )}

      {/* Edit Pending Modal */}
      {editingPending && (
        <EditPendingModal
          invite={editingPending}
          onClose={() => setEditingPending(null)}
        />
      )}
    </div>
  );
}
