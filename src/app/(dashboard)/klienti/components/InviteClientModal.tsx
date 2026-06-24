"use client";

import React, { useState } from 'react';
import { inviteClientAction } from '../actions';
import { formatPhone, formatName, formatAddress, validateField } from "@/utils/validation";

interface InviteClientModalProps {
  onClose: () => void;
}

export default function InviteClientModal({ onClose }: InviteClientModalProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !firstName || !lastName) return;
    
    // Zod validácie
    const fnError = validateField('firstName', firstName);
    if (fnError) { setErrorMsg(fnError); return; }
    const lnError = validateField('lastName', lastName);
    if (lnError) { setErrorMsg(lnError); return; }
    
    if (phone) {
      const phError = validateField('phone', phone);
      if (phError) { setErrorMsg(phError); return; }
    }
    if (address) {
      const addrError = validateField('address', address);
      if (addrError) { setErrorMsg(addrError); return; }
    }
    
    setErrorMsg("");
    setStatus("loading");
    
    try {
      await inviteClientAction({
        email,
        firstName,
        lastName,
        phone,
        address,
      });

      setStatus("success");
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Nastala chyba pri odosielaní pozvánky.");
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
                  <input type="text" required value={firstName} onChange={(e) => setFirstName(formatName(e.target.value))} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition-all" placeholder="napr. Ján" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Priezvisko *</label>
                  <input type="text" required value={lastName} onChange={(e) => setLastName(formatName(e.target.value))} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition-all" placeholder="napr. Kováč" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">E-mail klienta *</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition-all" placeholder="klient@email.sk" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Telefón</label>
                <input type="text" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition-all" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Adresa / Trvalý pobyt</label>
                <input type="text" value={address} onChange={(e) => setAddress(formatAddress(e.target.value))} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition-all" />
              </div>
              
              {errorMsg && (
                <div className="text-sm text-red-500 font-medium">
                  {errorMsg}
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
