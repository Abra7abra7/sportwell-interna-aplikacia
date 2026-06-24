"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

interface ClientCardProps {
  client: any;
  showAssignButton: boolean;
  onAssign: () => void;
}

export default function ClientCard({ client, showAssignButton, onAssign }: ClientCardProps) {
  const router = useRouter();

  return (
    <div 
      onClick={() => router.push(`/klienti/${client.id}`)}
      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-brand-navy to-brand-dark-navy flex items-center justify-center text-brand-cyan font-bold text-lg shadow-sm shrink-0">
            {client.full_name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-bold text-brand-navy text-sm truncate group-hover:text-brand-cyan transition-colors">
              {client.full_name}
            </h4>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{client.email || 'Bez e-mailu'}</p>
          </div>
        </div>
        
        {client.gdpr_signed_at ? (
          <span className="px-2.5 py-0.5 inline-flex text-[10px] font-bold rounded-full bg-green-50 text-green-700 border border-green-100 uppercase tracking-wide">
            GDPR
          </span>
        ) : (
          <span className="px-2.5 py-0.5 inline-flex text-[10px] font-bold rounded-full bg-red-50 text-red-700 border border-red-100 uppercase tracking-wide">
            Bez GDPR
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-xs text-gray-500 font-medium">
          <strong>Kontakt: </strong> {client.phone || 'Bez telefónneho čísla'}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 inline-flex text-[10px] font-bold rounded-full bg-purple-50 text-purple-700 border border-purple-100 items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            {client.plansCount || 0} plánov
          </span>
        </div>

        <div>
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Priradený personál:</div>
          {client.assignments && client.assignments.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {client.assignments.map((specName: string, i: number) => (
                <span key={i} className="px-2 py-0.5 inline-flex text-[10px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  {specName}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic font-medium">Nepriradený</span>
          )}
        </div>
      </div>

      {showAssignButton && (
        <div className="pt-3 border-t border-gray-50 flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAssign();
            }}
            className="text-brand-cyan hover:text-brand-navy font-bold text-xs bg-brand-light-cyan/30 px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 min-h-[44px]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
            Priradiť
          </button>
        </div>
      )}
    </div>
  );
}
