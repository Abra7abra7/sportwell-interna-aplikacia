"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";

interface ModuleDef {
  id: string;
  name: string;
  description: string;
}

interface RolePermission {
  role: string;
  module_id: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
}

const CONFIGURABLE_ROLES = [
  "trener", 
  "fitness_trener", 
  "fyzioterapeut", 
  "maser", 
  "nutricny_poradca", 
  "lekar", 
  "recepcia", 
  "klient"
];

export default function SettingsPage() {
  const { currentUserProfile } = useAuthContext();
  const router = useRouter();
  const supabase = createClient();

  const [modules, setModules] = useState<ModuleDef[]>([]);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeRole, setActiveRole] = useState<string>("trener");

  useEffect(() => {
    if (currentUserProfile && !["admin", "majitel"].includes(currentUserProfile.role)) {
      router.push("/dashboard");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      
      const { data: mods } = await supabase.from("modules").select("*").order("name");
      if (mods) setModules(mods);

      const { data: perms } = await supabase.from("role_permissions").select("*");
      if (perms) setPermissions(perms);

      setLoading(false);
    };

    fetchData();
  }, [currentUserProfile, router, supabase]);

  const handleToggle = (role: string, moduleId: string, field: "can_read" | "can_write" | "can_delete") => {
    setPermissions(prev => {
      const existing = prev.find(p => p.role === role && p.module_id === moduleId);
      if (existing) {
        return prev.map(p => 
          p.role === role && p.module_id === moduleId 
            ? { ...p, [field]: !p[field] } 
            : p
        );
      } else {
        // Create new permission entry if it doesn't exist
        const newPerm = {
          role,
          module_id: moduleId,
          can_read: field === "can_read" ? true : false,
          can_write: field === "can_write" ? true : false,
          can_delete: field === "can_delete" ? true : false,
        };
        return [...prev, newPerm];
      }
    });
  };

  const savePermissions = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("role_permissions")
        .upsert(
          permissions.map(p => ({
            role: p.role,
            module_id: p.module_id,
            can_read: p.can_read,
            can_write: p.can_write,
            can_delete: p.can_delete
          })), 
          { onConflict: 'role, module_id' }
        );

      if (error) throw error;
      alert("Oprávnenia boli úspešne uložené!");
    } catch (err: any) {
      alert("Chyba pri ukladaní oprávnení: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-cyan"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy mb-2">Nastavenia oprávnení (RBAC)</h1>
          <p className="text-gray-500">Spravujte prístup k modulom pre jednotlivé roly zamestnancov a klientov.</p>
        </div>
        <button
          onClick={savePermissions}
          disabled={saving}
          className="bg-brand-cyan hover:bg-[#00d9e6] text-brand-dark-navy font-bold py-3 px-6 rounded-xl shadow-lg transition-all disabled:opacity-50"
        >
          {saving ? "Ukladám..." : "Uložiť všetky zmeny"}
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Left Sidebar - Roles */}
        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-100/50">
            <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider">Vyberte rolu</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {CONFIGURABLE_ROLES.map(role => (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all font-bold text-sm capitalize ${
                  activeRole === role 
                    ? "bg-brand-navy text-white shadow-md" 
                    : "text-gray-600 hover:bg-white hover:text-brand-navy"
                }`}
              >
                {role.replace("_", " ")}
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-gray-200 bg-yellow-50 text-xs text-yellow-800">
            <strong>Admin</strong> a <strong>Majiteľ</strong> majú automaticky plný prístup ku všetkému a nepodliehajú tejto matici.
          </div>
        </div>

        {/* Right Content - Modules for selected Role */}
        <div className="flex-1 p-6 md:p-8 bg-white overflow-y-auto">
          <div className="mb-6 pb-6 border-b border-gray-100">
            <h2 className="text-2xl font-black text-brand-navy capitalize mb-2">{activeRole.replace("_", " ")}</h2>
            <p className="text-gray-500">Aké moduly môže táto rola vidieť a upravovať?</p>
          </div>

          <div className="space-y-6">
            {modules.map(mod => {
              const perm = permissions.find(p => p.role === activeRole && p.module_id === mod.id) || {
                can_read: false, can_write: false, can_delete: false
              };

              // Logika pre klienta - nesmie vidiet citlive veci
              const isClientAndDangerous = activeRole === 'klient' && ['zamestnanci', 'klienti'].includes(mod.id);

              if (isClientAndDangerous) return null; // Skryjeme moznost udelit klientovi pristup k zamestnancom

              return (
                <div key={mod.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl border border-gray-100 hover:border-brand-cyan/30 hover:shadow-sm transition-all bg-gray-50/30">
                  <div className="mb-4 md:mb-0 max-w-sm">
                    <h4 className="font-bold text-brand-navy text-lg">{mod.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{mod.description}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <label className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-all ${perm.can_read ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                      <input 
                        type="checkbox" 
                        checked={perm.can_read} 
                        onChange={() => handleToggle(activeRole, mod.id, 'can_read')}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="font-bold text-sm">Vidieť</span>
                    </label>

                    <label className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-all ${perm.can_write ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                      <input 
                        type="checkbox" 
                        checked={perm.can_write} 
                        onChange={() => handleToggle(activeRole, mod.id, 'can_write')}
                        className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                        disabled={!perm.can_read} // Cannot write if cannot read
                      />
                      <span className="font-bold text-sm">Upraviť</span>
                    </label>

                    <label className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-all ${perm.can_delete ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                      <input 
                        type="checkbox" 
                        checked={perm.can_delete} 
                        onChange={() => handleToggle(activeRole, mod.id, 'can_delete')}
                        className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                        disabled={!perm.can_read} // Cannot delete if cannot read
                      />
                      <span className="font-bold text-sm">Zmazať</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
