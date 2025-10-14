"use client";

import { useState } from "react";
import type { Lead, Negocio, Proposta } from "@prisma/client";
import { ProposalModal } from "./ProposalModal";
import { FilePlus } from "lucide-react";

type FullLead = Lead & {
  negocio: (Negocio & { propostas: Proposta[] }) | null;
};

export default function ProposalManager({ lead }: { lead: FullLead }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Nenhuma verificação de status é feita aqui.
  // O botão abaixo sempre será renderizado.

  return (
    <div>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors duration-200"
      >
        <FilePlus size={18} /> Gerar Nova Proposta
      </button>

      {isModalOpen && (
        <ProposalModal client={lead} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}
