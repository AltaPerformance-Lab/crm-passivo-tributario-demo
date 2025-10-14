// src/components/ProposalModal.tsx
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { Lead } from "@prisma/client";

interface ProposalModalProps {
  client: Lead;
  onClose: () => void;
}

interface ProposalData {
  validade: string;
  objeto: string;
  escopo: string;
  valores: string;
}

export const ProposalModal = ({ client, onClose }: ProposalModalProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [proposalData, setProposalData] = useState<ProposalData>({
    validade: "",
    objeto:
      "Assessoria e consultoria jurídica para a regularização de passivos tributários.",
    escopo:
      "1. Análise detalhada dos débitos inscritos na Dívida Ativa da União.\n2. Defesa administrativa e/ou judicial.\n3. Acompanhamento e negociação de parcelamentos.",
    valores:
      "Honorários de R$ XXXX,XX mensais, mais taxa de êxito de 20% sobre o valor economizado.",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProposalData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!proposalData.validade) {
      alert("Por favor, preencha a data de validade.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/proposals/generate", {
        // ROTA ATUALIZADA
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: client.id,
          proposalData,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao salvar a proposta");
      }

      const result = await response.json();

      // Abre o PDF em uma nova aba para o usuário baixar
      if (result.proposta && result.proposta.caminhoArquivo) {
        window.open(result.proposta.caminhoArquivo, "_blank");
      }

      // Fecha o modal e recarrega a página para mostrar a nova proposta na lista
      onClose();
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Ocorreu um erro ao salvar a proposta.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-gray-800 text-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          Gerar Proposta para: {client.nomeDevedor}
        </h2>

        <form>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-bold text-gray-300">
              Data de Validade
            </label>
            <input
              type="date"
              name="validade"
              value={proposalData.validade}
              onChange={handleChange}
              className="w-full p-2 bg-gray-700 rounded border border-gray-600"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-bold text-gray-300">
              Objeto da Proposta
            </label>
            <textarea
              name="objeto"
              value={proposalData.objeto}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 bg-gray-700 rounded border border-gray-600"
            ></textarea>
          </div>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-bold text-gray-300">
              Escopo dos Serviços
            </label>
            <textarea
              name="escopo"
              value={proposalData.escopo}
              onChange={handleChange}
              rows={5}
              className="w-full p-2 bg-gray-700 rounded border border-gray-600"
            ></textarea>
          </div>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-bold text-gray-300">
              Valores e Pagamento
            </label>
            <textarea
              name="valores"
              value={proposalData.valores}
              onChange={handleChange}
              rows={4}
              className="w-full p-2 bg-gray-700 rounded border border-gray-600"
            ></textarea>
          </div>
        </form>

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded"
            disabled={isLoading}
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? "Salvando e Gerando..." : "Salvar e Gerar Proposta"}
          </button>
        </div>
      </div>
    </div>
  );
};
