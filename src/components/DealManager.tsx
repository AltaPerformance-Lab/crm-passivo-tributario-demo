"use client";

import { useState } from "react";
import type { Lead, Negocio, Proposta } from "@prisma/client";
import DealModal from "./DealModal";

type FullLead = Lead & {
  negocio: (Negocio & { propostas: Proposta[] }) | null;
};

export default function DealManager({ lead }: { lead: FullLead }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- CORREÇÃO APLICADA AQUI ---
  // A verificação de status foi removida para que o botão apareça sempre.

  return (
    <div>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
      >
        Gerenciar Negócio Fechado
      </button>

      {isModalOpen && (
        <DealModal
          leadId={lead.id}
          initialNegocio={lead.negocio}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
