"use client";

import React, { useState, useEffect } from "react";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { formatPhone, formatAddress, validateField } from "@/utils/validation";

export default function ProfilPage() {
  const { currentUserProfile, fetchUserProfile, sessionUser } = useAuthContext();
  const supabase = createClient();
  const router = useRouter();

  const [formData, setFormData] = useState({
    phone: "",
    address: "",
    marketingConsent: false,
    metaConsent: false,
    diagnosticsConsent: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (currentUserProfile) {
      const meta = currentUserProfile.metadata || {};
      setFormData({
        phone: currentUserProfile.phone || "",
        address: meta.address || "",
        marketingConsent: meta.marketingConsent || false,
        metaConsent: meta.metaConsent || false,
        diagnosticsConsent: meta.diagnosticsConsent || false,
      });
    }
  }, [currentUserProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (e.target.name === 'phone') value = formatPhone(value);
    if (e.target.name === 'address') value = formatAddress(value);
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleToggle = (name: keyof typeof formData) => {
    setFormData({ ...formData, [name]: !formData[name] });
  };

  const handleSave = async () => {
    if (!currentUserProfile) return;
    
    // Zod validácia pred uložením
    const phError = validateField('phone', formData.phone);
    if (phError) return setMessage({ type: 'error', text: phError });
    
    const addrError = validateField('address', formData.address);
    if (addrError) return setMessage({ type: 'error', text: addrError });

    setIsSubmitting(true);
    setMessage(null);

    try {
      const newMetadata = {
        ...currentUserProfile.metadata,
        address: formData.address,
        marketingConsent: formData.marketingConsent,
        metaConsent: formData.metaConsent,
        diagnosticsConsent: formData.diagnosticsConsent,
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          phone: formData.phone,
          metadata: newMetadata,
        })
        .eq('id', currentUserProfile.id);

      if (error) throw error;

      if (currentUserProfile.role === 'klient') {
        const { generatePdfBlob } = await import('@/utils/pdfGenerator');
        const pdfBlob = await generatePdfBlob('gdpr-update-pdf-template');
        
        if (pdfBlob) {
          const fileName = `gdpr_zmena_${currentUserProfile.id}_${Date.now()}.pdf`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('client_documents')
            .upload(fileName, pdfBlob, { contentType: 'application/pdf' });
            
          if (!uploadError && uploadData) {
            await supabase.from('documents').insert({
              client_id: currentUserProfile.id,
              file_name: `GDPR_Zmena_Suhlasu_${new Date().toLocaleDateString('sk-SK').replace(/\s/g, '')}.pdf`,
              storage_path: uploadData.path
            });
          }
        }
      }

      if (sessionUser) {
         await fetchUserProfile(sessionUser);
      }
      
      setMessage({ type: 'success', text: 'Údaje boli úspešne uložené.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: 'Nastala chyba pri ukladaní údajov.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUserProfile) {
    return <div className="p-8 text-center text-gray-500">Načítavam profil...</div>;
  }

  const roleName = currentUserProfile.role.replace('_', ' ').toUpperCase();
  const birthDate = currentUserProfile.metadata?.birthDate 
    ? new Date(currentUserProfile.metadata.birthDate).toLocaleDateString('sk-SK') 
    : "Nezadané";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-12">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-brand-navy">Môj Profil</h2>
        <p className="text-sm sm:text-base text-gray-500 mt-1">
          Správa vašich osobných údajov a súhlasov
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border font-medium flex items-center transition-all ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {message.type === 'success' ? (
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          ) : (
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          )}
          {message.text}
        </div>
      )}

      {/* ZAMKNUTÁ ZÓNA - IDENTITA */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            <h3 className="text-lg font-bold text-gray-700">Základné identifikačné údaje</h3>
          </div>
          <span className="text-xs font-bold bg-gray-200 text-gray-500 px-2 py-1 rounded-md uppercase tracking-wider">Iba na čítanie</span>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-6">
            Tieto údaje sú viazané na vaše právne dokumenty (napr. GDPR zmluvy). Pre zmenu e-mailu, mena alebo dátumu narodenia prosím kontaktujte recepciu.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Meno a priezvisko</label>
              <input type="text" value={currentUserProfile.full_name} disabled className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-xl px-4 py-3 font-medium cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">E-mailová adresa</label>
              <input type="email" value={currentUserProfile.email} disabled className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-xl px-4 py-3 font-medium cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Dátum narodenia</label>
              <input type="text" value={birthDate} disabled className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-xl px-4 py-3 font-medium cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Rola v systéme</label>
              <div className="w-full bg-gray-50 border border-gray-200 text-brand-cyan rounded-xl px-4 py-3 font-bold cursor-not-allowed">
                {roleName}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ODOMKNUTÁ ZÓNA - KONTAKTY */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-cyan/20 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-brand-cyan"></div>
        <div className="bg-brand-off-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            <h3 className="text-lg font-bold text-brand-navy">Upraviteľné kontaktné údaje</h3>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-1.5">Telefónne číslo</label>
              <input 
                type="tel" 
                name="phone" 
                value={formData.phone} 
                onChange={handleInputChange} 
                className="w-full bg-white border border-gray-200 text-brand-navy rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-brand-cyan outline-none transition-shadow" 
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
                className="w-full bg-white border border-gray-200 text-brand-navy rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-brand-cyan outline-none transition-shadow" 
                placeholder="Ulica, číslo, PSČ, Mesto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ODOMKNUTÁ ZÓNA - SÚHLASY */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-cyan/20 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-brand-cyan"></div>
        <div className="bg-brand-off-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <h3 className="text-lg font-bold text-brand-navy">Správa súhlasov a súkromia</h3>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {currentUserProfile.role === 'klient' ? (
            <div className="bg-blue-50 text-blue-700 p-4 rounded-xl text-sm mb-6 border border-blue-100 flex gap-3">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <div>
                <strong>Digitálna správa súhlasov.</strong> Udelené doplnkové súhlasy môžete kedykoľvek odvolať. Odvolanie súhlasu sa automaticky zaznamená v systéme bez nutnosti navštíviť recepciu.
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-6">
              Základné súhlasy s pravidlami ochrany osobných údajov a podmienkami rezervačného systému boli udelené pri vašej prvej registrácii. Nižšie uvedené doplnkové súhlasy môžete kedykoľvek odvolať alebo znovu udeliť.
            </p>
          )}

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-brand-cyan/30 transition-colors">
            <div className="pr-4">
              <h4 className="font-bold text-brand-navy text-sm md:text-base">Súhlas na marketingové účely</h4>
              <p className="text-xs text-gray-500 mt-1">Zasielanie informácií o novinkách a ponukách e-mailom.</p>
            </div>
            <button 
              onClick={() => handleToggle('marketingConsent')}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none shrink-0 ${formData.marketingConsent ? 'bg-brand-cyan' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formData.marketingConsent ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-brand-cyan/30 transition-colors">
            <div className="pr-4">
              <h4 className="font-bold text-brand-navy text-sm md:text-base">Zdieľanie údajov s tretími stranami (Meta)</h4>
              <p className="text-xs text-gray-500 mt-1">Poskytnutie e-mailu spoločnosti Meta Platforms pre cielené reklamy (Lookalike Audiences).</p>
            </div>
            <button 
              onClick={() => handleToggle('metaConsent')}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none shrink-0 ${formData.metaConsent ? 'bg-brand-cyan' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formData.metaConsent ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-brand-cyan/30 transition-colors">
            <div className="pr-4">
              <h4 className="font-bold text-brand-navy text-sm md:text-base">Spracovanie údajov z diagnostiky</h4>
              <p className="text-xs text-gray-500 mt-1">Odosielanie reportov a uchovávanie anamnézy elektronicky.</p>
            </div>
            <button 
              onClick={() => handleToggle('diagnosticsConsent')}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none shrink-0 ${formData.diagnosticsConsent ? 'bg-brand-cyan' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formData.diagnosticsConsent ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 pb-12">
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="w-full sm:w-auto bg-brand-navy hover:bg-brand-cyan text-white hover:text-brand-dark-navy font-bold py-4 px-10 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
              Ukladám...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
              Uložiť všetky zmeny
            </>
          )}
        </button>
      </div>

      {/* Hidden PDF template for GDPR Updates */}
      {currentUserProfile.role === 'klient' && (
        <div style={{ position: 'absolute', top: 0, left: '-9999px', width: '794px' }}>
          <div id="gdpr-update-pdf-template" style={{ backgroundColor: '#ffffff', color: '#000000', fontFamily: '"Noto Sans", sans-serif' }}>
            <div style={{ backgroundColor: '#0A192F', color: '#ffffff', padding: '30px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '0.5px' }}>SportWell</span>
                <p style={{ fontSize: '13px', color: '#D3FAFF', margin: '2px 0', opacity: 0.8 }}>Černyševského 30, 851 01 Bratislava</p>
                <p style={{ fontSize: '13px', color: '#D3FAFF', margin: '0', opacity: 0.8 }}>IČO: 52 124 118</p>
              </div>
              <div style={{ textAlign: 'right', maxWidth: '350px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#00F0FF', margin: '0 0 8px 0', wordWrap: 'break-word', textTransform: 'uppercase' }}>Zmena udelených súhlasov</h2>
                <p style={{ fontSize: '14px', color: '#ffffff', margin: 0, opacity: 0.9 }}>Dátum zmeny: {new Date().toLocaleDateString('sk-SK')} {new Date().toLocaleTimeString('sk-SK')}</p>
              </div>
            </div>
            
            <div style={{ padding: '40px' }}>
              <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#F7FAFC', borderRadius: '12px', borderLeft: '4px solid #00F0FF', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '16px', color: '#020C1B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Osobné údaje klienta</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                  <p style={{ margin: 0 }}><strong style={{ color: '#0A192F', width: '120px', display: 'inline-block' }}>Meno:</strong> {currentUserProfile.full_name}</p>
                  <p style={{ margin: 0 }}><strong style={{ color: '#0A192F', width: '120px', display: 'inline-block' }}>E-mail:</strong> {currentUserProfile.email}</p>
                </div>
              </div>

              <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '20px', paddingBottom: '10px', color: '#020C1B', borderBottom: '2px solid #D3FAFF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Aktuálny stav súhlasov po zmene</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', fontSize: '14px' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <p style={{ margin: 0 }}><strong style={{ color: '#0A192F' }}>Súhlas so spracovaním na marketingové účely:</strong> <span style={{ color: formData.marketingConsent ? '#00F0FF' : '#94a3b8', fontWeight: 'bold', marginLeft: '8px' }}>{formData.marketingConsent ? 'ÁNO' : 'ODVOLANÝ'}</span></p>
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <p style={{ margin: 0 }}><strong style={{ color: '#0A192F' }}>Súhlas s poskytnutím údajov tretej osobe (Meta):</strong> <span style={{ color: formData.metaConsent ? '#00F0FF' : '#94a3b8', fontWeight: 'bold', marginLeft: '8px' }}>{formData.metaConsent ? 'ÁNO' : 'ODVOLANÝ'}</span></p>
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <p style={{ margin: 0 }}><strong style={{ color: '#0A192F' }}>Súhlas so spracovaním údajov z diagnostiky:</strong> <span style={{ color: formData.diagnosticsConsent ? '#00F0FF' : '#94a3b8', fontWeight: 'bold', marginLeft: '8px' }}>{formData.diagnosticsConsent ? 'ÁNO' : 'ODVOLANÝ'}</span></p>
                </div>
              </div>
              
              <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                <p style={{ margin: 0 }}>Tento dokument o zmene súhlasov bol vygenerovaný a elektronicky potvrdený používateľom po úspešnej autentifikácii zo sekcie "Môj Profil".</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '10px' }}>Systém SportWell • IP adresa a časová stopa uložená v databáze.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
