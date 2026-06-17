"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export interface ClientProfile {
  id: string;
  role: 'admin' | 'trener' | 'klient' | 'fitness_trener' | 'fyzioterapeut' | 'maser' | 'nutricny_poradca' | 'lekar' | 'recepcia' | 'majitel';
  full_name: string;
  email?: string;
  phone: string;
  gdpr_signed_at: string | null;
  is_active?: boolean;
  created_at?: string;
  metadata: {
    marketing_opt_in?: boolean;
    fms_inbody_opt_in?: boolean;
    meta_lookalike_opt_in?: boolean;
    [key: string]: any;
  };
  permissions?: Record<string, { read: boolean, write: boolean, delete: boolean }>;
}

interface AuthContextType {
  sessionUser: any;
  setSessionUser: React.Dispatch<React.SetStateAction<any>>;
  currentUserProfile: ClientProfile | null;
  setCurrentUserProfile: React.Dispatch<React.SetStateAction<ClientProfile | null>>;
  authEmail: string;
  setAuthEmail: React.Dispatch<React.SetStateAction<string>>;
  isAuthLoading: boolean;
  magicLinkSent: boolean;
  authInitialized: boolean;
  authCode: string;
  setAuthCode: React.Dispatch<React.SetStateAction<string>>;
  handleAuthSubmit: (e: React.FormEvent) => Promise<void>;
  handleVerifyOtp: (e: React.FormEvent) => Promise<void>;
  handleSignOut: () => Promise<void>;
  updateProfilePhone: (phoneValue: string) => Promise<void>;
  fetchUserProfile: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const defaultTriggerToast = (msg: string) => console.log("TOAST:", msg);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const [sessionUser, setSessionUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<ClientProfile | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  const [registerFullName, setRegisterFullName] = useState('');
  const [registerVerifyPending, setRegisterVerifyPending] = useState(false);
  const [registerVerifyCode, setRegisterVerifyCode] = useState('');
  const [registerInputCode, setRegisterInputCode] = useState('');



  const fetchRolePermissions = async (role: string) => {
    const { data: perms } = await supabase
      .from('role_permissions')
      .select('module_id, can_read, can_write, can_delete')
      .eq('role', role);

    const permissionsMap: Record<string, { read: boolean, write: boolean, delete: boolean }> = {};
    if (perms) {
      perms.forEach((p: any) => {
        permissionsMap[p.module_id] = {
          read: p.can_read,
          write: p.can_write,
          delete: p.can_delete
        };
      });
    }
    return permissionsMap;
  };

  const fetchUserProfile = async (user: any) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      if (data.is_active === false) {
        await supabase.auth.signOut();
        setSessionUser(null);
        setCurrentUserProfile(null);
        defaultTriggerToast('Tento účet bol deaktivovaný.');
        return;
      }

      let finalName = data.full_name;
      // Automatická oprava mena pre admina (ak predtým uviazol na defaultnom mene)
      if (data.full_name === 'Nový Používateľ' && (data.email === 'stancikmarian8@gmail.com' || user.email === 'stancikmarian8@gmail.com')) {
        finalName = 'Marián Stančík';
        supabase.from('profiles').update({ full_name: finalName }).eq('id', user.id).then();
      }

      // Keep email from auth if profile doesn't have it
      const permissionsMap = await fetchRolePermissions(data.role);

      setCurrentUserProfile({
        ...data,
        full_name: finalName,
        email: data.email || user.email,
        permissions: permissionsMap
      });
    } else {
      // Check for employee invitation
      if (user.email) {
        const { data: invData } = await supabase
          .from('employee_invitations')
          .select('*')
          .eq('email', user.email)
          .single();

        if (invData) {
          let internalRole = 'trener';
          if (invData.role_title === 'Administrátor') internalRole = 'admin';
          if (invData.role_title === 'Recepcia') internalRole = 'recepcia';
          
          const newProfile: ClientProfile = {
            id: user.id,
            role: internalRole as any, // All specialists are 'trener', admins are 'admin'
            full_name: invData.full_name,
            email: user.email,
            phone: invData.phone || '',
            gdpr_signed_at: new Date().toISOString(), // Employees auto-sign or don't need it the same way
            metadata: {
              address: invData.address,
              position: invData.role_title
            },
            permissions: await fetchRolePermissions(internalRole),
          };
          
          await supabase.from('profiles').insert({
            id: newProfile.id,
            role: newProfile.role,
            full_name: newProfile.full_name,
            email: newProfile.email,
            phone: newProfile.phone,
            gdpr_signed_at: newProfile.gdpr_signed_at,
            metadata: newProfile.metadata
          });
          
          // Delete invitation
          await supabase.from('employee_invitations').delete().eq('id', invData.id);
          
          setCurrentUserProfile(newProfile);
          return;
        }
      }

      // Fallback to default client profile (needs to be explicitly saved if we want it in DB later, 
      // but keeping it as client-side fallback for now to avoid creating empty profiles for wrong emails)
      const defaultProf: ClientProfile = {
        id: user.id,
        role: 'klient',
        full_name: 'Nový Používateľ',
        email: user.email,
        phone: '',
        gdpr_signed_at: null,
        metadata: {},
        permissions: await fetchRolePermissions('klient'),
      };
      setCurrentUserProfile(defaultProf);
    }
  };

  const [authCode, setAuthCode] = useState('');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: authEmail,
      options: { shouldCreateUser: true },
    });

    if (error) {
      defaultTriggerToast(`Chyba: ${error.message}`);
    } else {
      setMagicLinkSent(true); // Budeme to brať ako 'otpSent'
      defaultTriggerToast('Kód bol odoslaný na váš e-mail.');
    }
    
    setIsAuthLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email: authEmail,
      token: authCode,
      type: 'email'
    });
    if (error) {
      defaultTriggerToast(`Chyba: nesprávny alebo expirovaný kód.`);
    } else {
      defaultTriggerToast('Prihlásenie úspešné.');
    }
    setIsAuthLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
    setCurrentUserProfile(null);
    defaultTriggerToast('Úspešne odhlásený.');
  };

  const updateProfilePhone = async (phoneValue: string) => {
    if (!currentUserProfile) return;
    const { error } = await supabase
      .from('profiles')
      .update({ phone: phoneValue })
      .eq('id', currentUserProfile.id);

    if (!error) {
      defaultTriggerToast('Telefónne číslo bolo úspešne aktualizované.');
      if (sessionUser) {
        await fetchUserProfile(sessionUser);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session?.user) {
        setSessionUser(session.user);
        await fetchUserProfile(session.user);
      } else {
        setSessionUser(null);
        setCurrentUserProfile(null);
      }
      setAuthInitialized(true);
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (!mounted) return;
      if (session?.user) {
        setSessionUser(session.user);
        fetchUserProfile(session.user);
      } else {
        setSessionUser(null);
        setCurrentUserProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    sessionUser,
    setSessionUser,
    currentUserProfile,
    setCurrentUserProfile,
    authEmail,
    setAuthEmail,
    isAuthLoading,
    magicLinkSent,
    authInitialized,
    handleAuthSubmit,
    handleVerifyOtp,
    authCode,
    setAuthCode,
    handleSignOut,
    updateProfilePhone,
    fetchUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext musí byť použitý vo vnútri AuthProvider");
  }
  return context;
}
