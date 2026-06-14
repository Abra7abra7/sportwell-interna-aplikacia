import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export interface ClientProfile {
  id: string;
  role: 'admin' | 'trener' | 'klient';
  full_name: string;
  email?: string;
  phone: string;
  gdpr_signed_at: string | null;
  created_at?: string;
  metadata: {
    marketing_opt_in?: boolean;
    fms_inbody_opt_in?: boolean;
    meta_lookalike_opt_in?: boolean;
    [key: string]: any;
  };
}

export function useAuth(triggerToast: (msg: string) => void, onLoadData: (profile: ClientProfile) => void) {
  const supabase = createClient();

  const [sessionUser, setSessionUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<ClientProfile | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'reset' | 'register'>('login');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const [registerFullName, setRegisterFullName] = useState('');
  const [registerVerifyPending, setRegisterVerifyPending] = useState(false);
  const [registerVerifyCode, setRegisterVerifyCode] = useState('');
  const [registerInputCode, setRegisterInputCode] = useState('');

  const checkUserSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setSessionUser(user);
      fetchUserProfile(user.id);
    } else {
      setSessionUser(null);
      setCurrentUserProfile(null);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setCurrentUserProfile(data);
      onLoadData(data);
    } else {
      const defaultProf: ClientProfile = {
        id: userId,
        role: 'klient',
        full_name: 'Nový Používateľ',
        phone: '',
        gdpr_signed_at: null,
        metadata: {},
      };
      setCurrentUserProfile(defaultProf);
      onLoadData(defaultProf);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);

    if (authMode === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
      if (error) {
        triggerToast(`Chyba prihlásenia: ${error.message}`);
      } else if (data.user) {
        setSessionUser(data.user);
        await fetchUserProfile(data.user.id);
        triggerToast('Úspešne prihlásený!');
      }
    } else if (authMode === 'register') {
      if (!registerVerifyPending) {
        if (!registerFullName.trim()) {
          triggerToast('Zadajte vaše celé meno.');
          setIsAuthLoading(false);
          return;
        }
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setRegisterVerifyCode(code);
        setRegisterVerifyPending(true);
        setIsAuthLoading(false);
        triggerToast(`[SMS/EMAIL SIMULÁCIA] Overovací kód pre registráciu: ${code}`);
        return;
      }

      if (registerInputCode !== registerVerifyCode) {
        triggerToast('Nesprávny overovací kód.');
        setIsAuthLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
      });
      if (error) {
        triggerToast(`Chyba registrácie: ${error.message}`);
      } else if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          role: 'klient',
          full_name: registerFullName.trim(),
          phone: '',
          email: authEmail,
          metadata: {},
        });

        setRegisterVerifyPending(false);
        setRegisterInputCode('');
        setRegisterVerifyCode('');
        setRegisterFullName('');

        setSessionUser(data.user);
        await fetchUserProfile(data.user.id);
        triggerToast('Úspešne registrovaný a prihlásený!');
      }
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
        redirectTo: window.location.origin,
      });
      if (error) {
        triggerToast(`Chyba: ${error.message}`);
      } else {
        triggerToast('Overovací odkaz pre nastavenie nového hesla bol odoslaný na e-mail.');
      }
    }
    setIsAuthLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
    setCurrentUserProfile(null);
    triggerToast('Úspešne odhlásený.');
  };

  const updateProfilePhone = async (phoneValue: string) => {
    if (!currentUserProfile) return;

    const { error } = await supabase
      .from('profiles')
      .update({ phone: phoneValue })
      .eq('id', currentUserProfile.id);

    if (!error) {
      triggerToast('Telefónne číslo bolo úspešne aktualizované.');
      await fetchUserProfile(currentUserProfile.id);
    } else {
      triggerToast(`Chyba: ${error.message}`);
    }
  };

  useEffect(() => {
    checkUserSession();
  }, []);

  return {
    sessionUser,
    setSessionUser,
    currentUserProfile,
    setCurrentUserProfile,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authMode,
    setAuthMode,
    isAuthLoading,
    registerFullName,
    setRegisterFullName,
    registerVerifyPending,
    setRegisterVerifyPending,
    registerInputCode,
    setRegisterInputCode,
    registerVerifyCode,
    setRegisterVerifyCode,
    handleAuthSubmit,
    handleSignOut,
    updateProfilePhone,
    fetchUserProfile,
  };
}
