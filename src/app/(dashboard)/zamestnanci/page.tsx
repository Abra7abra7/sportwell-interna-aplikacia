"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { createClient } from "@/utils/supabase/client";

export default function ZamestnanciPage() {
  const { currentUserProfile } = useAuthContext();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchEmployees = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('role', 'klient')
      .order('full_name');
    
    if (data) setEmployees(data);
    setLoading(false);
  };

  useEffect(() => {
    if (currentUserProfile?.role === 'admin') {
      fetchEmployees();
    }
  }, [currentUserProfile]);

  if (currentUserProfile?.role !== "admin") {
    return <div className="text-red-500">Nemáte prístup do tejto sekcie.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-2xl font-bold text-brand-navy">Správa Zamestnancov</h2>
        <button
          onClick={() => setShowInviteModal(true)}
          className="mt-4 md:mt-0 bg-brand-navy hover:bg-brand-dark-navy text-white px-4 py-2 rounded-full font-medium transition-colors whitespace-nowrap"
        >
          + Pridať zamestnanca
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Načítavam zamestnancov...</div>
        ) : employees.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Žiadni zamestnanci nenašli.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meno</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email / Telefón</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pozícia</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-brand-light-cyan/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-brand-navy">{emp.full_name}</div>
                    {emp.role === 'admin' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                        Admin
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{emp.email || 'N/A'}</div>
                    <div className="text-sm text-gray-400">{emp.phone || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {emp.metadata?.position || emp.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showInviteModal && (
        <InviteEmployeeModal 
          onClose={() => setShowInviteModal(false)}
          currentUserProfile={currentUserProfile}
        />
      )}
    </div>
  );
}

function InviteEmployeeModal({ onClose, currentUserProfile }: any) {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [roleTitle, setRoleTitle] = useState("Tréner");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('employee_invitations').insert({
      email,
      full_name: fullName,
      phone,
      address,
      role_title: roleTitle,
      created_by: currentUserProfile?.id
    });
    
    setLoading(false);
    if (!error) {
      alert("Pozvánka úspešne vytvorená. Zamestnanec sa teraz môže prihlásiť týmto e-mailom.");
      onClose();
    } else {
      alert("Chyba: " + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-brand-navy mb-4">Pozvať nového zamestnanca</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meno a Priezvisko</label>
            <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full p-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefón</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresa</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pozícia</label>
            <select value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} className="w-full p-2 border rounded-md">
              <option>Tréner</option>
              <option>Fyzioterapeut</option>
              <option>Masér</option>
              <option>Nutričný poradca</option>
              <option>Ortopéd</option>
            </select>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded font-medium">Zrušiť</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-brand-cyan hover:bg-[#00d0e0] text-brand-navy rounded font-bold">Uložiť a pozvať</button>
          </div>
        </form>
      </div>
    </div>
  );
}
