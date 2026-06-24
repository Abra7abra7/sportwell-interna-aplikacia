"use client";

import React, { useState, useTransition } from "react";
import { savePermissionsAction, RolePermissionInput } from "../actions";

interface ModuleDef {
  id: string;
  name: string;
  description: string;
}

interface SettingsOverviewProps {
  initialModules: ModuleDef[];
  initialPermissions: RolePermissionInput[];
}

const CONFIGURABLE_ROLES = [
  "trener",
  "fitness_trener",
  "fyzioterapeut",
  "maser",
  "nutricny_poradca",
  "lekar",
  "recepcia",
  "klient",
];

export default function SettingsOverview({
  initialModules,
  initialPermissions,
}: SettingsOverviewProps) {
  const [permissions, setPermissions] = useState<RolePermissionInput[]>(initialPermissions);
  const [activeRole, setActiveRole] = useState<string>("trener");
  const [isPending, startTransition] = useTransition();

  const handleToggle = (
    role: string,
    moduleId: string,
    field: "can_read" | "can_write" | "can_delete"
  ) => {
    setPermissions((prev) => {
      const existing = prev.find((p) => p.role === role && p.module_id === moduleId);
      if (existing) {
        return prev.map((p) =>
          p.role === role && p.module_id === moduleId
            ? { ...p, [field]: !p[field] }
            : p
        );
      } else {
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

  const handleSave = () => {
    startTransition(async () => {
      try {
        await savePermissionsAction(permissions);
        alert("Oprávnenia boli úspešne uložené!");
      } catch (err: any) {
        alert(err.message || "Chyba pri ukladaní oprávnení.");
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 animate-in fade-in duration-300">
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy tracking-tight mb-2">Nastavenia oprávnení (RBAC)</h1>
          <p className="text-gray-500 font-medium">Spravujte prístup k modulom pre jednotlivé roly zamestnancov a klientov.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="h-12 bg-brand-cyan hover:bg-[#00d9e6] text-brand-dark-navy font-bold px-6 rounded-xl shadow-md transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 min-w-[180px]"
        >
          {isPending ? (
            <div className="w-5 h-5 border-2 border-brand-dark-navy border-t-transparent rounded-full animate-spin"></div>
          ) : (
            "Uložiť všetky zmeny"
          )}
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Left Sidebar - Roles Selection */}
        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-100 bg-gray-100/50">
            <h3 className="font-bold text-gray-400 text-xs uppercase tracking-wider">Vyberte rolu</h3>
          </div>
          <div className="flex-1 p-2 space-y-1">
            {CONFIGURABLE_ROLES.map((role) => (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`w-full text-left h-12 px-4 rounded-xl transition-all font-bold text-sm capitalize cursor-pointer flex items-center ${
                  activeRole === role
                    ? "bg-brand-navy text-white shadow-md"
                    : "text-gray-600 hover:bg-white hover:text-brand-navy"
                }`}
              >
                {role.replace("_", " ")}
              </button>
            ))}
          </div>
          <div className="p-5 border-t border-gray-100 bg-yellow-50/50 text-xs text-yellow-800 font-medium leading-relaxed">
            <strong>Admin</strong> a <strong>Majiteľ</strong> majú automaticky plný prístup ku všetkému a nepodliehajú tejto matici.
          </div>
        </div>

        {/* Right Content - Configurable Modules list */}
        <div className="flex-1 p-6 md:p-8 bg-white">
          <div className="mb-6 pb-6 border-b border-gray-100">
            <h2 className="text-2xl font-black text-brand-navy capitalize mb-1">{activeRole.replace("_", " ")}</h2>
            <p className="text-gray-500 text-sm font-medium">Aké moduly môže táto rola vidieť a upravovať?</p>
          </div>

          <div className="space-y-4">
            {initialModules.map((mod) => {
              const perm = permissions.find((p) => p.role === activeRole && p.module_id === mod.id) || {
                can_read: false,
                can_write: false,
                can_delete: false,
              };

              // Clients cannot see staff or other client lists (security constraint check)
              const isClientAndDangerous = activeRole === "klient" && ["zamestnanci", "klienti"].includes(mod.id);
              if (isClientAndDangerous) return null;

              return (
                <div
                  key={mod.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-5 rounded-2xl border border-gray-100 hover:border-brand-cyan/20 hover:shadow-sm transition-all bg-gray-50/30 gap-4"
                >
                  <div className="max-w-md">
                    <h4 className="font-bold text-brand-navy text-lg">{mod.name}</h4>
                    <p className="text-sm text-gray-500 mt-1 font-medium leading-relaxed">{mod.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {/* Read Toggle with touch target h-11 */}
                    <label
                      className={`flex items-center gap-2.5 px-4 h-11 rounded-xl border cursor-pointer select-none transition-all ${
                        perm.can_read
                          ? "bg-blue-50/60 border-blue-200 text-blue-700"
                          : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={perm.can_read}
                        onChange={() => handleToggle(activeRole, mod.id, "can_read")}
                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="font-bold text-sm">Vidieť</span>
                    </label>

                    {/* Write Toggle with touch target h-11 */}
                    <label
                      className={`flex items-center gap-2.5 px-4 h-11 rounded-xl border cursor-pointer select-none transition-all ${
                        perm.can_write
                          ? "bg-green-50/60 border-green-200 text-green-700"
                          : "bg-white border-gray-200 text-gray-400 hover:border-gray-300 disabled:opacity-40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={perm.can_write}
                        onChange={() => handleToggle(activeRole, mod.id, "can_write")}
                        disabled={!perm.can_read}
                        className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500 cursor-pointer"
                      />
                      <span className="font-bold text-sm">Upraviť</span>
                    </label>

                    {/* Delete Toggle with touch target h-11 */}
                    <label
                      className={`flex items-center gap-2.5 px-4 h-11 rounded-xl border cursor-pointer select-none transition-all ${
                        perm.can_delete
                          ? "bg-red-50/60 border-red-200 text-red-700"
                          : "bg-white border-gray-200 text-gray-400 hover:border-gray-300 disabled:opacity-40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={perm.can_delete}
                        onChange={() => handleToggle(activeRole, mod.id, "can_delete")}
                        disabled={!perm.can_read}
                        className="w-5 h-5 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer"
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
