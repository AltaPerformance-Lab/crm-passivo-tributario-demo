"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Negocio, Proposta } from "@prisma/client";
import { FileText, Trash2, X, Loader2 } from "lucide-react";
import CurrencyInput from "react-currency-input-field";

type DealModalProps = {
  // CORREÇÃO: O ID do Lead agora é string
  leadId: string;
  initialNegocio: (Negocio & { propostas: Proposta[] }) | null;
  onClose: () => void;
};

export default function DealModal({
  leadId,
  initialNegocio,
  onClose,
}: DealModalProps) {
  const router = useRouter();
  const [dealData, setDealData] = useState(initialNegocio);
  const [financials, setFinancials] = useState({
    valorFechado: initialNegocio?.valorFechado || 0,
    valorEscritorio: initialNegocio?.valorEscritorio || 0,
    valorOutraParte: initialNegocio?.valorOutraParte || 0,
    valorRecebido: initialNegocio?.valorRecebido || 0,
  });
  const [proposalFile, setProposalFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // CORREÇÃO: O ID da proposta agora é string
  const [deletingProposalId, setDeletingProposalId] = useState<string | null>(
    null
  );

  const handleCurrencyChange = (value: string | undefined, name: string) => {
    setFinancials((prev) => ({ ...prev, [name]: parseFloat(value || "0") }));
  };

  const handleSaveDeal = async () => {
    setIsSubmitting(true);
    try {
      let currentNegocio = dealData;
      let refreshNeeded = false;

      if (!currentNegocio) {
        const res = await fetch("/api/deals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId, ...financials }),
        });
        if (!res.ok) throw new Error("Falha ao criar o negócio.");
        currentNegocio = await res.json();
        refreshNeeded = true;
      } else {
        const res = await fetch(`/api/deals/${currentNegocio.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(financials),
        });
        if (!res.ok) throw new Error("Falha ao atualizar o negócio.");
        currentNegocio = await res.json();
        refreshNeeded = true;
      }

      setDealData(currentNegocio);

      if (proposalFile && currentNegocio) {
        const formData = new FormData();
        formData.append("proposal", proposalFile);
        formData.append("negocioId", currentNegocio.id); // O ID já é string

        const uploadRes = await fetch("/api/proposals/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok)
          throw new Error("Falha ao fazer upload da proposta.");
        refreshNeeded = true;
      }

      if (refreshNeeded) {
        router.refresh();
      }
      onClose();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar o negócio.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // CORREÇÃO: A função agora aceita o ID como string
  const handleDeleteProposal = async (proposalId: string) => {
    if (!window.confirm("Tem certeza que deseja apagar esta proposta?")) return;

    setDeletingProposalId(proposalId);
    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Falha ao apagar a proposta.");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Erro ao apagar a proposta.");
    } finally {
      setDeletingProposalId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Gerenciar Negócio Convertido</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X />
          </button>
        </div>

        {/* O resto do seu JSX continua igual, pois ele já lida com os tipos corretamente */}
        <div className="bg-gray-700 p-4 rounded-lg space-y-3">
          <h3 className="font-semibold">Valores do Acordo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-sm text-gray-400 block mb-1">
                Valor Total Fechado
              </label>
              <CurrencyInput
                name="valorFechado"
                defaultValue={financials.valorFechado}
                onValueChange={(value) =>
                  handleCurrencyChange(value, "valorFechado")
                }
                className="input-style w-full bg-gray-800 rounded p-2 border border-gray-600"
                intlConfig={{ locale: "pt-BR", currency: "BRL" }}
                decimalsLimit={2}
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">
                Valor do Escritório
              </label>
              <CurrencyInput
                name="valorEscritorio"
                defaultValue={financials.valorEscritorio}
                onValueChange={(value) =>
                  handleCurrencyChange(value, "valorEscritorio")
                }
                className="input-style w-full bg-gray-800 rounded p-2 border border-gray-600"
                intlConfig={{ locale: "pt-BR", currency: "BRL" }}
                decimalsLimit={2}
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">
                Parte do Sócio
              </label>
              <CurrencyInput
                name="valorOutraParte"
                defaultValue={financials.valorOutraParte}
                onValueChange={(value) =>
                  handleCurrencyChange(value, "valorOutraParte")
                }
                className="input-style w-full bg-gray-800 rounded p-2 border border-gray-600"
                intlConfig={{ locale: "pt-BR", currency: "BRL" }}
                decimalsLimit={2}
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">
                Sua Parte Recebida
              </label>
              <CurrencyInput
                name="valorRecebido"
                defaultValue={financials.valorRecebido}
                onValueChange={(value) =>
                  handleCurrencyChange(value, "valorRecebido")
                }
                className="input-style w-full bg-gray-800 rounded p-2 border border-gray-600"
                intlConfig={{ locale: "pt-BR", currency: "BRL" }}
                decimalsLimit={2}
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-700 p-4 rounded-lg space-y-3">
          <h3 className="font-semibold">Gerenciar Propostas (PDF)</h3>
          <div className="space-y-2">
            {dealData?.propostas && dealData.propostas.length > 0 ? (
              dealData.propostas.map((proposta) => {
                const isDeleting = deletingProposalId === proposta.id; // Agora a comparação funciona
                return (
                  <div
                    key={proposta.id}
                    className={`flex justify-between items-center bg-gray-800 p-2 rounded transition-opacity ${
                      isDeleting ? "opacity-50" : ""
                    }`}
                  >
                    <a
                      href={proposta.caminhoArquivo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:text-blue-400 truncate"
                    >
                      <FileText size={16} />
                      <span className="truncate">
                        {proposta.nomeArquivo || "Proposta Salva"}
                      </span>
                    </a>
                    <button
                      onClick={() => handleDeleteProposal(proposta.id)}
                      disabled={isDeleting}
                      className="text-gray-500 hover:text-red-500 disabled:cursor-not-allowed ml-4"
                    >
                      {isDeleting ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-400">Nenhuma proposta enviada.</p>
            )}
          </div>
          <div className="pt-2">
            <label className="text-sm text-gray-400 block mb-1">
              Adicionar nova proposta
            </label>
            <input
              type="file"
              onChange={(e) =>
                setProposalFile(e.target.files ? e.target.files[0] : null)
              }
              accept=".pdf"
              className="input-style w-full text-sm text-gray-300 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
          </div>
        </div>

        <button
          onClick={handleSaveDeal}
          disabled={isSubmitting}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500 flex justify-center items-center gap-2"
        >
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? "Salvando..." : "Salvar Alterações do Negócio"}
        </button>
      </div>
    </div>
  );
}
