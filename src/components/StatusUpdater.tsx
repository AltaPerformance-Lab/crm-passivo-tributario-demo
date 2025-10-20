// src/components/StatusUpdater.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// MUDANÇA 1: O tipo 'LeadStatus' ainda é útil para tipagem, então o mantemos.
import type { LeadStatus } from "@prisma/client";

// MUDANÇA 2: Definimos as opções manualmente como um array de strings.
const statusOptions: LeadStatus[] = [
  "A_VERIFICAR",
  "VERIFICADO",
  "CONTATADO",
  "AGUARDANDO_RESPOSTA",
  "EM_NEGOCIACAO",
  "NAO_TEM_INTERESSE",
  "CONVERTIDO",
  "DESCARTADO",
];

export default function StatusUpdater({
  leadId,
  currentStatus,
}: {
  leadId: string;
  currentStatus: LeadStatus;
}) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStatusChange = async (newStatus: LeadStatus) => {
    setIsLoading(true);
    setSelectedStatus(newStatus);

    try {
      await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      setSelectedStatus(currentStatus);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-700 p-4 rounded-lg">
      <h3 className="text-sm font-semibold text-gray-400 mb-2">
        Alterar Status do Lead
      </h3>
      <select
        value={selectedStatus}
        onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
        disabled={isLoading}
        className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {statusOptions.map((status) => (
          <option key={status} value={status}>
            {status.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      {isLoading && (
        <p className="text-xs text-gray-400 mt-2 text-center">Salvando...</p>
      )}
    </div>
  );
}
