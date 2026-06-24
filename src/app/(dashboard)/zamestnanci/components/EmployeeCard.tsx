"use client";

import React from "react";

interface Employee {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  role: string;
  is_active?: boolean;
  metadata?: {
    position?: string;
  };
}

interface EmployeeCardProps {
  employee: Employee;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

export default function EmployeeCard({
  employee,
  onEdit,
  onToggleActive,
  onDelete
}: EmployeeCardProps) {
  return (
    <div
      className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-100 transition-all flex flex-col gap-4 ${
        employee.is_active === false ? "opacity-60 bg-gray-50/50" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-navy to-brand-dark-navy flex items-center justify-center text-brand-cyan font-bold text-lg shadow-sm shrink-0">
          {employee.full_name.charAt(0)}
        </div>
        <div className="overflow-hidden">
          <h4 className="font-bold text-brand-navy truncate">{employee.full_name}</h4>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-brand-light-cyan text-brand-dark-navy border border-brand-cyan/20">
              {employee.metadata?.position || employee.role}
            </span>
            {employee.role === "admin" && (
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-purple-50 text-purple-700 border border-purple-100 uppercase">
                Admin
              </span>
            )}
            {employee.is_active === false && (
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-red-50 text-red-700 border border-red-100 uppercase">
                Deaktivovaný
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-50 pt-3 text-sm space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 font-medium text-xs">E-mail</span>
          <span className="text-brand-navy text-xs truncate max-w-[200px]">
            {employee.email || "Bez e-mailu"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 font-medium text-xs">Telefón</span>
          <span className="text-brand-navy text-xs">
            {employee.phone || "Bez telefónu"}
          </span>
        </div>
      </div>

      <div className="border-t border-gray-50 pt-3 flex items-center justify-end gap-2">
        <button
          onClick={onEdit}
          className="text-xs text-brand-cyan hover:text-brand-navy font-bold bg-brand-light-cyan/30 px-4 py-2.5 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          Upraviť
        </button>
        <button
          onClick={onToggleActive}
          className="text-xs text-orange-600 hover:text-orange-700 font-bold bg-orange-50 px-4 py-2.5 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          {employee.is_active === false ? "Aktivovať" : "Deaktivovať"}
        </button>
        <button
          onClick={onDelete}
          className="text-xs text-red-600 hover:text-red-700 font-bold bg-red-50 px-4 py-2.5 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          Odstrániť
        </button>
      </div>
    </div>
  );
}
