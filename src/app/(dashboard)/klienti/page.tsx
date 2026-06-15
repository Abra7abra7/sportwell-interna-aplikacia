"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext, ClientProfile } from "@/components/providers/AuthProvider";
import { useClients } from "@/hooks/useClients";
import { useAssignments } from "@/hooks/useAssignments";
import { createClient } from "@/utils/supabase/client";

export default function KlientiPage() {
  const router = useRouter();
  const { currentUserProfile } = useAuthContext();
  const { clients, loading, error, fetchClients } = useClients();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);

  useEffect(() => {
    if (currentUserProfile && currentUserProfile.role !== "klient") {
      fetchClients(searchTerm, 0);
    }
  }, [currentUserProfile, searchTerm]);

  if (currentUserProfile?.role === "klient") {
    return <div className="text-red-500">Nemáte prístup do tejto sekcie.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-2xl font-bold text-brand-navy">Správa Klientov</h2>
        <div className="mt-4 md:mt-0 flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Hľadať klienta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border rounded-full focus:ring-brand-cyan focus:border-brand-cyan shadow-sm"
            />
          </div>
        </div>
      </div>

      {error && <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Načítavam klientov...</div>
        ) : clients.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Žiadni klienti nenašli.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meno</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email / Telefón</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priradení zamestnanci</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GDPR Stav</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map((client) => (
                <tr 
                  key={client.id} 
                  className="hover:bg-brand-light-cyan/20 cursor-pointer transition-colors"
                  onClick={() => router.push(`/klienti/${client.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-brand-navy">{client.full_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{client.email || 'N/A'}</div>
                    <div className="text-sm text-gray-400">{client.phone || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* @ts-ignore */}
                    {client.assignments && client.assignments.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {/* @ts-ignore */}
                        {client.assignments.map((specName, i) => (
                          <span key={i} className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {specName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">Nepriradený</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {client.gdpr_signed_at ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Podpísané
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Chýba
                      </span>
                    )}
                  </td>
                  {currentUserProfile?.role === 'admin' && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClient(client);
                        }}
                        className="text-brand-cyan hover:text-brand-navy"
                      >
                        Priradiť Zamestnanca
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedClient && (
        <AssignmentModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          currentUserProfile={currentUserProfile}
        />
      )}
    </div>
  );
}

function AssignmentModal({ client, onClose, currentUserProfile }: any) {
  const { specialists, fetchSpecialists, fetchAssignedSpecialists, assignSpecialist, removeAssignment } = useAssignments();
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSpecialists();
    fetchAssignedSpecialists(client.id).then((ids) => {
      setAssignedIds(ids);
      setIsLoading(false);
    });
  }, []);

  const handleToggle = async (specialistId: string) => {
    if (assignedIds.includes(specialistId)) {
      setAssignedIds(prev => prev.filter(id => id !== specialistId));
      await removeAssignment(client.id, specialistId);
    } else {
      setAssignedIds(prev => [...prev, specialistId]);
      await assignSpecialist(client.id, specialistId, currentUserProfile.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-brand-navy mb-4">Priradiť zamestnancov</h3>
        <p className="text-sm text-gray-500 mb-4">Klient: {client.full_name}</p>
        
        {isLoading ? (
          <div className="py-4 text-center text-gray-500">Načítavam zamestnancov...</div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {specialists.map(spec => (
              <label key={spec.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={assignedIds.includes(spec.id)}
                  onChange={() => handleToggle(spec.id)}
                  className="h-4 w-4 text-brand-cyan focus:ring-brand-cyan border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">{spec.full_name}</span>
              </label>
            ))}
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-medium transition-colors"
          >
            Hotovo
          </button>
        </div>
      </div>
    </div>
  );
}

