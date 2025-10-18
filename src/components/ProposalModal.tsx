"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { Lead } from "@prisma/client";
import { Loader2 } from "lucide-react"; // Adicionado para consistência

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
  const [error, setError] = useState(""); // Estado para mensagens de erro

  // MELHORIA: Data de validade com valor padrão de +7 dias
  const defaultValidityDate = new Date();
  defaultValidityDate.setDate(defaultValidityDate.getDate() + 7);

  const [proposalData, setProposalData] = useState<ProposalData>({
    validade: defaultValidityDate.toISOString().split("T")[0],
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Usado com o onSubmit do formulário
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/proposals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: client.id, proposalData }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Falha ao salvar a proposta");
      }

      if (result.proposta && result.proposta.caminhoArquivo) {
        window.open(result.proposta.caminhoArquivo, "_blank");
      }

      onClose();
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 text-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4">
          Gerar Proposta para: {client.nomeDevedor}
        </h2>

        {/* MELHORIA: Usando onSubmit no formulário */}
        <form
          onSubmit={handleSubmit}
          className="flex-grow overflow-y-auto pr-2 space-y-4"
        >
          <div>
            <label className="block mb-2 text-sm font-bold text-gray-300">
              Data de Validade
            </label>
            <input
              type="date"
              name="validade"
              value={proposalData.validade}
              onChange={handleChange}
              required
              className="input-style w-full p-2 bg-gray-700 rounded border border-gray-600"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-bold text-gray-300">
              Objeto da Proposta
            </label>
            <textarea
              name="objeto"
              value={proposalData.objeto}
              onChange={handleChange}
              rows={3}
              className="input-style w-full p-2 bg-gray-700 rounded border border-gray-600"
            ></textarea>
          </div>
          <div>
            <label className="block mb-2 text-sm font-bold text-gray-300">
              Escopo dos Serviços
            </label>
            <textarea
              name="escopo"
              value={proposalData.escopo}
              onChange={handleChange}
              rows={5}
              className="input-style w-full p-2 bg-gray-700 rounded border border-gray-600"
            ></textarea>
          </div>
          <div>
            <label className="block mb-2 text-sm font-bold text-gray-300">
              Valores e Pagamento
            </label>
            <textarea
              name="valores"
              value={proposalData.valores}
              onChange={handleChange}
              rows={4}
              className="input-style w-full p-2 bg-gray-700 rounded border border-gray-600"
            ></textarea>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <div className="flex justify-end gap-4 pt-4 sticky bottom-0 bg-gray-800 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded"
              disabled={isLoading}
            >
              Cancelar
            </button>
            {/* MELHORIA: Botão com type="submit" */}
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center min-w-[180px]"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Salvar e Gerar Proposta"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
