"use client";

import React, { useEffect, useState } from 'react';
import { useAssignments } from '../hooks/useAssignments';

interface AssignmentModalProps {
  client: any;
  onClose: () => void;
  currentUserProfile: any;
}

export default function AssignmentModal({ client, onClose, currentUserProfile }: AssignmentModalProps) {
  const { specialists, fetchSpecialists, fetchAssignedSpecialists, assignSpecialist, removeAssignment } = useAssignments();
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSpecialists();
    fetchAssignedSpecialists(client.id).then((ids) => {
      setAssignedIds(ids);
      setIsLoading(false);
    });
  }, [client.id]);

  const handleToggle = async (specialistId: string) => {
    try {
      if (assignedIds.includes(specialistId)) {
        setAssignedIds(prev => prev.filter(id => id !== specialistId));
        await removeAssignment(client.id, specialistId);
      } else {
        setAssignedIds(prev => [...prev, specialistId]);
        await assignSpecialist(client.id, specialistId, currentUserProfile.id);
      }
    } catch (err) {
      console.error("Assignment toggle failed:", err);
      alert("Chyba pri zmene priradenia.");
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-dark-navy/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-brand-off-white px-6 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
          <h3 className="text-xl font-bold text-brand-navy">Priradenie personálu</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 flex flex-col min-h-0">
          <div className="flex items-center mb-6 p-3 bg-brand-light-cyan/30 rounded-xl shrink-0">
             <div className="h-10 w-10 rounded-full bg-brand-light-cyan flex items-center justify-center text-brand-navy font-bold text-sm">
                {client.full_name.charAt(0)}
             </div>
             <div className="ml-3">
                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">Klient</div>
                <div className="font-bold text-brand-navy">{client.full_name}</div>
             </div>
          </div>
          
          <p className="text-sm text-gray-500 mb-3 font-medium shrink-0">Vyberte zamestnancov, ktorí sa o klienta starajú:</p>
          
          {isLoading ? (
            <div className="py-8 flex justify-center">
               <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-brand-cyan"></div>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto flex-1 pr-2 custom-scrollbar">
              {specialists.map(spec => (
                <label key={spec.id} className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-colors border ${assignedIds.includes(spec.id) ? 'bg-brand-light-cyan/20 border-brand-cyan/50' : 'hover:bg-gray-50 border-gray-100'}`}>
                  <input
                    type="checkbox"
                    checked={assignedIds.includes(spec.id)}
                    onChange={() => handleToggle(spec.id)}
                    className="h-5 w-5 text-brand-cyan focus:ring-brand-cyan border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-bold text-gray-800 block">{spec.full_name}</span>
                    <span className="text-xs text-gray-500">{spec.metadata?.position || 'Tréner'}</span>
                  </div>
                </label>
              ))}
            </div>
          )}
          
          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-brand-cyan hover:shadow-md text-brand-dark-navy rounded-xl font-bold transition-all"
            >
              Hotovo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
