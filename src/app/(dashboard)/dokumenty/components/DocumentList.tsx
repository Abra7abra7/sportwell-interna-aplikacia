"use client";

import React, { useState } from "react";
import { getSignedDocumentUrlAction } from "../actions";

interface DocumentRecord {
  id: string;
  client_id: string;
  file_name: string;
  storage_path: string;
  created_at: string;
  profiles?: {
    full_name: string;
  } | null;
}

interface DocumentListProps {
  initialDocuments: DocumentRecord[];
  role: string;
}

export default function DocumentList({ initialDocuments, role }: DocumentListProps) {
  const [documents] = useState<DocumentRecord[]>(initialDocuments);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (id: string, path: string, fileName: string) => {
    setDownloadingId(id);
    try {
      const signedUrl = await getSignedDocumentUrlAction(path);
      const a = document.createElement("a");
      a.href = signedUrl;
      a.download = fileName;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error: any) {
      console.error("Error downloading document:", error);
      alert(error.message || "Chyba pri sťahovaní súboru");
    } finally {
      setDownloadingId(null);
    }
  };

  const isClient = role === "klient";

  const filteredDocuments = documents.filter((doc) => {
    const searchLower = searchQuery.toLowerCase();
    const matchName = doc.file_name.toLowerCase().includes(searchLower);
    const matchClient =
      !isClient &&
      doc.profiles?.full_name?.toLowerCase().includes(searchLower);
    return matchName || matchClient;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6">
      <div className="mb-2">
        <h2 className="text-3xl font-bold text-brand-navy tracking-tight">Dokumenty</h2>
        <p className="text-gray-500 font-medium mt-1">
          {isClient ? "Vaše zmluvy, súhlasy a reporty" : "Zoznam všetkých klientskych dokumentov"}
        </p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder={isClient ? "Vyhľadaj dokument podľa názvu..." : "Vyhľadaj dokument alebo meno klienta..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition-all text-sm bg-white text-brand-navy placeholder-gray-400"
        />
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-brand-off-white rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg font-medium">Nenašli sa žiadne dokumenty.</p>
          {!isClient && (
            <p className="text-sm text-gray-400 mt-2">Nové dokumenty môžete nahrať priamo v detaile konkrétneho klienta.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredDocuments.map((doc) => {
            const isDownloading = downloadingId === doc.id;
            return (
              <div
                key={doc.id}
                className="flex flex-col p-5 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md hover:border-brand-cyan/50 transition-all duration-300 group justify-between min-h-[160px]"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-light-cyan text-brand-cyan rounded-xl flex items-center justify-center font-bold border border-brand-cyan/20 shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-base font-bold text-brand-navy truncate leading-snug" title={doc.file_name}>
                      {doc.file_name}
                    </p>
                    <p className="text-xs text-gray-400 font-semibold mt-1">
                      {new Date(doc.created_at).toLocaleDateString("sk-SK")}
                    </p>
                  </div>
                </div>

                <div className="mt-6 border-t border-gray-50 pt-4 flex items-center justify-between">
                  {!isClient ? (
                    <div className="flex items-center text-xs text-gray-500 font-bold truncate pr-2 max-w-[180px]">
                      <svg className="w-4 h-4 mr-1.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="truncate">{doc.profiles?.full_name || "Neznámy klient"}</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-xs text-green-600 font-bold">
                      <svg className="w-4 h-4 mr-1.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Váš dokument
                    </div>
                  )}

                  <button
                    onClick={() => handleDownload(doc.id, doc.storage_path, doc.file_name)}
                    disabled={isDownloading}
                    className="h-10 text-brand-cyan hover:bg-brand-cyan/10 px-4 rounded-xl font-bold transition-all flex items-center shrink-0 text-sm gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <div className="w-4 h-4 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Stiahnuť</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
