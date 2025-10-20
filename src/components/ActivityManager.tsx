// src/components/ActivityManager.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Atividade } from "@prisma/client";
import { MessageSquarePlus, Clock } from "lucide-react";

interface ActivityManagerProps {
  leadId: string;
  atividades: Atividade[];
}

export default function ActivityManager({
  leadId,
  atividades,
}: ActivityManagerProps) {
  const [conteudo, setConteudo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conteudo.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/atividades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, conteudo }),
      });

      if (!response.ok) {
        throw new Error("Falha ao salvar a atividade.");
      }

      setConteudo(""); // Limpa o campo de texto
      router.refresh(); // Recarrega os dados da página para mostrar a nova atividade
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar a atividade.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-800 shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Histórico de Atividades</h2>

      {/* Formulário para adicionar nova atividade */}
      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          placeholder="Descreva a interação com o lead (ex: 'Liguei para o cliente, ele pediu para retornar na sexta-feira')..."
          className="w-full bg-gray-700 p-2 rounded border border-gray-600 focus:ring-2 focus:ring-blue-500"
          rows={3}
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting || !conteudo.trim()}
          className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <MessageSquarePlus size={18} />
          {isSubmitting ? "Salvando..." : "Adicionar ao Histórico"}
        </button>
      </form>

      {/* Lista de atividades existentes */}
      <div className="space-y-4">
        <h3 className="font-semibold border-b border-gray-700 pb-2">
          Registros Anteriores
        </h3>
        {atividades.length > 0 ? (
          // Ordena as atividades da mais nova para a mais antiga
          [...atividades]
            .sort(
              (a, b) =>
                new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
            )
            .map((atividade) => (
              <div key={atividade.id} className="bg-gray-700/50 p-3 rounded-lg">
                <p className="text-white whitespace-pre-wrap">
                  {atividade.conteudo}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  <Clock size={14} />
                  <span>
                    {new Date(atividade.criadoEm).toLocaleString("pt-BR")}
                  </span>
                </div>
              </div>
            ))
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">
            Nenhuma atividade registrada para este lead.
          </p>
        )}
      </div>
    </div>
  );
}
