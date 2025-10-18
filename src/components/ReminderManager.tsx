"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Lembrete } from "@prisma/client";
import { BellPlus, Calendar, Trash2, Loader2 } from "lucide-react";

interface ReminderManagerProps {
  leadId: number;
  lembretes: Lembrete[];
}

export default function ReminderManager({
  leadId,
  lembretes,
}: ReminderManagerProps) {
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null); // Estado para o erro
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim() || !data) {
      setError("Por favor, preencha a descrição e a data do lembrete.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await fetch("/api/lembretes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, descricao, data }),
      });
      setDescricao("");
      setData("");
      router.refresh();
    } catch (err) {
      setError("Erro ao agendar o lembrete.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleConcluido = async (lembrete: Lembrete) => {
    setBusyId(lembrete.id);
    setError(null);
    try {
      await fetch(`/api/lembretes/${lembrete.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concluido: !lembrete.concluido }),
      });
      router.refresh();
    } catch (err) {
      setError("Erro ao atualizar o lembrete.");
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (lembreteId: number) => {
    if (!window.confirm("Tem certeza que deseja apagar este lembrete?")) return;
    setBusyId(lembreteId);
    setError(null);
    try {
      await fetch(`/api/lembretes/${lembreteId}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      setError("Erro ao apagar o lembrete.");
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const sortedLembretes = [...lembretes].sort((a, b) => {
    if (a.concluido !== b.concluido) return a.concluido ? 1 : -1;
    return new Date(a.data).getTime() - new Date(b.data).getTime();
  });

  return (
    <div className="bg-gray-800 shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Lembretes</h2>

      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <input
          type="text"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descrição do lembrete..."
          className="input-style w-full bg-gray-700 p-2 rounded border border-gray-600"
          disabled={isSubmitting}
        />
        <input
          type="datetime-local"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="input-style w-full bg-gray-700 p-2 rounded border border-gray-600"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting || !descricao.trim() || !data}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <BellPlus size={18} />
          {isSubmitting ? "Agendando..." : "Agendar Lembrete"}
        </button>
        {error && (
          <p className="text-red-400 text-center text-sm mt-2">{error}</p>
        )}
      </form>

      <div className="space-y-3">
        {sortedLembretes.length > 0 ? (
          sortedLembretes.map((lembrete) => (
            <div
              key={lembrete.id}
              className={`p-3 rounded-lg flex items-start gap-3 transition-opacity ${
                lembrete.concluido ? "bg-gray-700/50 opacity-60" : "bg-gray-700"
              }`}
            >
              <input
                type="checkbox"
                checked={lembrete.concluido}
                onChange={() => handleToggleConcluido(lembrete)}
                className="mt-1 h-5 w-5 rounded border-gray-500 text-blue-500 focus:ring-blue-600 cursor-pointer"
                disabled={busyId === lembrete.id}
              />
              <div className="flex-1">
                <p
                  className={`text-white ${
                    lembrete.concluido ? "line-through" : ""
                  }`}
                >
                  {lembrete.descricao}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  <Calendar size={14} />
                  <span>{new Date(lembrete.data).toLocaleString("pt-BR")}</span>
                </div>
              </div>
              {busyId === lembrete.id ? (
                <Loader2 className="animate-spin text-gray-400" size={16} />
              ) : (
                <button
                  onClick={() => handleDelete(lembrete.id)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">
            Nenhum lembrete agendado.
          </p>
        )}
      </div>
    </div>
  );
}
