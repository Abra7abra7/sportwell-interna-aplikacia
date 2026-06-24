"use client";

import React, { useState, useTransition } from "react";
import { updateProfileAction } from "../actions";
import { formatPhone, formatAddress, validateField } from "@/utils/validation";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  metadata?: {
    birthDate?: string;
    address?: string;
    marketingConsent?: boolean;
    metaConsent?: boolean;
    diagnosticsConsent?: boolean;
  } | null;
}

interface ProfileOverviewProps {
  profile: Profile;
}

export default function ProfileOverview({ profile }: ProfileOverviewProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const meta = profile.metadata || {};
  const [formData, setFormData] = useState({
    phone: profile.phone || "",
    address: meta.address || "",
    marketingConsent: meta.marketingConsent || false,
    metaConsent: meta.metaConsent || false,
    diagnosticsConsent: meta.diagnosticsConsent || false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (e.target.name === "phone") value = formatPhone(value);
    if (e.target.name === "address") value = formatAddress(value);
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleToggle = (name: "marketingConsent" | "metaConsent" | "diagnosticsConsent") => {
    if (profile.role === "klient") return; // Enforce read-only client GDPR
    setFormData({ ...formData, [name]: !formData[name] });
  };

  const handleSave = () => {
    setMessage(null);

    // Validate inputs client-side
    const phError = validateField("phone", formData.phone);
    if (phError) {
      setMessage({ type: "error", text: phError });
      return;
    }

    const addrError = validateField("address", formData.address);
    if (addrError) {
      setMessage({ type: "error", text: addrError });
      return;
    }

    startTransition(async () => {
      try {
        await updateProfileAction(formData);
        setMessage({ type: "success", text: "Údaje boli úspešne uložené." });
        setTimeout(() => setMessage(null), 3000);
      } catch (err: any) {
        console.error("Error saving profile changes:", err);
        setMessage({ type: "error", text: err.message || "Nastala chyba pri ukladaní údajov." });
      }
    });
  };

  const isClient = profile.role === "klient";
  const roleName = profile.role.replace("_", " ").toUpperCase();
  const birthDate = meta.birthDate
    ? new Date(meta.birthDate).toLocaleDateString("sk-SK")
    : "Nezadané";

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 pb-12 animate-in fade-in duration-300">
      <div className="mb-2">
        <h2 className="text-3xl font-bold text-brand-navy tracking-tight">Môj Profil</h2>
        <p className="text-gray-500 font-medium mt-1">Správa vašich osobných údajov a súhlasov</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border font-semibold flex items-center transition-all ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {message.text}
        </div>
      )}

      {/* Read-Only Zone: Identity */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="text-base font-bold text-gray-700">Základné identifikačné údaje</h3>
          </div>
          <span className="text-[10px] font-bold bg-gray-200 text-gray-500 px-2 py-0.5 rounded uppercase tracking-wider">Iba na čítanie</span>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-500 mb-6 font-medium leading-relaxed">
            Tieto údaje sú viazané na vaše zmluvné dokumenty (napr. GDPR súhlas). Pre zmenu e-mailu, mena alebo dátumu narodenia prosím kontaktujte recepciu.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Meno a priezvisko</label>
              <input
                type="text"
                value={profile.full_name}
                disabled
                className="w-full h-11 bg-gray-50 border border-gray-200 text-gray-400 rounded-xl px-4 font-semibold cursor-not-allowed text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">E-mailová adresa</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full h-11 bg-gray-50 border border-gray-200 text-gray-400 rounded-xl px-4 font-semibold cursor-not-allowed text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Dátum narodenia</label>
              <input
                type="text"
                value={birthDate}
                disabled
                className="w-full h-11 bg-gray-50 border border-gray-200 text-gray-400 rounded-xl px-4 font-semibold cursor-not-allowed text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Rola v systéme</label>
              <div className="w-full h-11 bg-gray-50 border border-gray-200 text-brand-cyan rounded-xl px-4 font-bold cursor-not-allowed text-sm flex items-center">
                {roleName}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editable Contact Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-cyan/20 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-brand-cyan"></div>
        <div className="bg-brand-off-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <h3 className="text-base font-bold text-brand-navy">Upraviteľné kontaktné údaje</h3>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-1.5">Telefónne číslo</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full h-11 bg-white border border-gray-200 text-brand-navy rounded-xl px-4 font-semibold focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none transition-all text-sm"
                placeholder="Napr. 09XX XXX XXX"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-1.5">Trvalý pobyt (Adresa)</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full h-11 bg-white border border-gray-200 text-brand-navy rounded-xl px-4 font-semibold focus:ring-2 focus:ring-brand-cyan focus:border-brand-cyan outline-none transition-all text-sm"
                placeholder="Ulica, číslo, PSČ, Mesto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* GDPR Consents */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-cyan/20 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-brand-cyan"></div>
        <div className="bg-brand-off-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-base font-bold text-brand-navy">Správa súhlasov a súkromia</h3>
          </div>
          {isClient && (
            <span className="text-[10px] font-bold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">Uzamknuté</span>
          )}
        </div>

        <div className="p-6 space-y-4">
          {isClient ? (
            <div className="bg-yellow-50/50 text-yellow-800 p-4 rounded-xl text-sm mb-6 border border-yellow-200 flex gap-3 font-medium leading-relaxed">
              <svg className="w-5 h-5 shrink-0 mt-0.5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <strong>Digitálna správa súhlasov je uzamknutá.</strong> Doplnkové súhlasy (Marketing, Meta, Diagnostika) boli vygenerované vo vašom zmluvnom PDF pri registrácii. Pre zmenu súhlasov prosím kontaktujte recepciu.
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-6 font-medium leading-relaxed">
              Základné súhlasy s pravidlami ochrany osobných údajov a podmienkami rezervačného systému boli udelené pri vašej registrácii. Nižšie uvedené doplnkové súhlasy môžete kedykoľvek zmeniť.
            </p>
          )}

          {/* Marketing Consent */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-brand-cyan/20 transition-colors">
            <div className="pr-4">
              <h4 className="font-bold text-brand-navy text-sm md:text-base leading-snug">Súhlas na marketingové účely</h4>
              <p className="text-xs text-gray-400 mt-1 font-semibold">Zasielanie informácií o novinkách a ponukách e-mailom.</p>
            </div>
            <button
              onClick={() => handleToggle("marketingConsent")}
              disabled={isClient}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none shrink-0 ${
                formData.marketingConsent ? "bg-brand-cyan" : "bg-gray-300"
              } ${isClient ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  formData.marketingConsent ? "translate-x-8" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Meta Sharing Consent */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-brand-cyan/20 transition-colors">
            <div className="pr-4">
              <h4 className="font-bold text-brand-navy text-sm md:text-base leading-snug">Zdieľanie údajov s tretími stranami (Meta)</h4>
              <p className="text-xs text-gray-400 mt-1 font-semibold">Poskytnutie e-mailu spoločnosti Meta Platforms pre cielené reklamy (Lookalike Audiences).</p>
            </div>
            <button
              onClick={() => handleToggle("metaConsent")}
              disabled={isClient}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none shrink-0 ${
                formData.metaConsent ? "bg-brand-cyan" : "bg-gray-300"
              } ${isClient ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  formData.metaConsent ? "translate-x-8" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Diagnostics Consent */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-brand-cyan/20 transition-colors">
            <div className="pr-4">
              <h4 className="font-bold text-brand-navy text-sm md:text-base leading-snug">Spracovanie údajov z diagnostiky</h4>
              <p className="text-xs text-gray-400 mt-1 font-semibold">Odosielanie reportov a uchovávanie anamnézy elektronicky.</p>
            </div>
            <button
              onClick={() => handleToggle("diagnosticsConsent")}
              disabled={isClient}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none shrink-0 ${
                formData.diagnosticsConsent ? "bg-brand-cyan" : "bg-gray-300"
              } ${isClient ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  formData.diagnosticsConsent ? "translate-x-8" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 pb-12">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="w-full sm:w-auto h-14 bg-brand-navy hover:bg-brand-cyan text-white hover:text-brand-dark-navy font-bold px-10 rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          {isPending ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
              <span>Ukladám...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>Uložiť všetky zmeny</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
