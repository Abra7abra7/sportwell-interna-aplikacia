"use client";

import React, { useState } from "react";
import { updatePendingInviteAction } from "../actions";
import { ROLE_OPTIONS } from "./InviteEmployeeModal";

interface EditPendingModalProps {
  invite: any;
  onClose: () => void;
}

export default function EditPendingModal({ invite, onClose }: EditPendingModalProps) {
  const [email, setEmail] = useState(invite.email || "");
  const [fullName, setFullName] = useState(invite.full_name || "");
  const [phone, setPhone] = useState(invite.phone || "");
  const [roleTitle, setRoleTitle] = useState(invite.role_title || "Tréner");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    setLoading(true);
    setErrorMsg("");

    try {
      await updatePendingInviteAction(invite.id, {
        fullName,
        email,
        phone,
        roleTitle
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Chyba pri ukladaní zmien.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-dark-navy/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-orange-50/50 px-6 py-5 border-b border-orange-100 flex justify-between items-center shrink-0">
          <h3 className="text-xl font-bold text-orange-800">Úprava pozvánky</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Meno a Priezvisko</label>
            <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} 
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition-all text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">E-mail</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} 
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition-all text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Telefón</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition-all text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pozícia</label>
              <select value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan focus:border-transparent bg-white transition-all text-sm h-[40px]">
                {ROLE_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
          <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end space-x-3 shrink-0">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm min-h-[44px]">Zrušiť</button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 bg-brand-cyan hover:shadow-md text-brand-dark-navy rounded-xl font-bold transition-all disabled:opacity-50 text-sm min-h-[44px]">Uložiť</button>
          </div>
        </form>
      </div>
    </div>
  );
}
