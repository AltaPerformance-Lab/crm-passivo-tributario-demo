"use client";

import type { Contato } from "@prisma/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPhone, formatPhoneOnType } from "@/lib/utils";
import {
  User,
  Briefcase,
  Phone,
  Mail,
  MessageSquare,
  Trash2,
  Edit,
  Save,
  XCircle,
} from "lucide-react";

export default function ContactManager({
  contatos,
  empresaId,
}: {
  contatos: Contato[];
  empresaId: number;
}) {
  // States para o formulário de ADIÇÃO
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [observacao, setObservacao] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(""); // Estado de erro unificado

  // States para a funcionalidade de EDIÇÃO
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Contato>>({});

  // State para a funcionalidade de DELEÇÃO
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const router = useRouter();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefone(formatPhoneOnType(e.target.value));
  };

  const handleEditPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFormData({
      ...editFormData,
      telefone: formatPhoneOnType(e.target.value),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const cleanedPhone = telefone.replace(/\D/g, "");
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          cargo,
          telefone: cleanedPhone,
          email,
          observacao,
          empresaId,
        }),
      });
      if (!response.ok) throw new Error("Falha ao salvar o contato.");
      setNome("");
      setCargo("");
      setTelefone("");
      setEmail("");
      setObservacao("");
      setIsFormOpen(false);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (contactId: number) => {
    if (!window.confirm("Tem certeza que deseja apagar este contato?")) return;
    setDeletingId(contactId);
    setError("");
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Falha ao apagar o contato.");
      router.refresh();
    } catch (err) {
      // MELHORIA: Usa o estado de erro em vez do alert
      setError((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditStart = (contato: Contato) => {
    setEditingId(contato.id);
    setEditFormData({
      nome: contato.nome,
      cargo: contato.cargo,
      telefone: contato.telefone,
      email: contato.email,
      observacao: contato.observacao,
    });
    setError(""); // Limpa erros antigos ao começar a editar
  };

  const handleEditCancel = () => {
    setEditingId(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setIsLoading(true);
    setError("");
    try {
      const cleanedPhone = (editFormData.telefone || "").replace(/\D/g, "");
      const response = await fetch(`/api/contacts/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editFormData, telefone: cleanedPhone }),
      });
      if (!response.ok) throw new Error("Falha ao atualizar o contato.");
      setEditingId(null);
      router.refresh();
    } catch (err) {
      // MELHORIA: Usa o estado de erro em vez do alert
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Gestão de Contatos</h2>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {isFormOpen ? "Fechar Formulário" : "+ Adicionar Contato"}
        </button>
      </div>

      {/* MELHORIA: Exibe a mensagem de erro geral aqui */}
      {error && (
        <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
      )}

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 bg-gray-700 p-4 rounded-lg space-y-4 animate-in fade-in-0 duration-300"
        >
          <h3 className="text-lg font-semibold">Adicionar Novo Contato</h3>
          {/* ... seu formulário de adição ... */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do Contato*"
              required
              className="input-style"
            />
            <input
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Cargo"
              className="input-style"
            />
            <input
              value={telefone}
              onChange={handlePhoneChange}
              placeholder="Telefone"
              className="input-style"
              maxLength={15}
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email"
              className="input-style"
            />
          </div>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Observação (Ex: Contato principal, decisor...)"
            className="input-style w-full min-h-[80px]"
          ></textarea>
          <button
            type="submit"
            disabled={isLoading || editingId !== null}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isLoading ? "Salvando..." : "Salvar Novo Contato"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Contatos Salvos</h3>
        {/* ... sua lista de contatos ... */}
        {contatos.length > 0 ? (
          contatos.map((contato) => (
            <div key={contato.id} className="bg-gray-700 p-4 rounded-lg">
              {editingId === contato.id ? (
                <form onSubmit={handleUpdate} className="space-y-3">
                  {/* ... seu formulário de edição ... */}
                  <input
                    required
                    value={editFormData.nome ?? ""}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, nome: e.target.value })
                    }
                    className="input-style font-bold"
                  />
                  <input
                    value={editFormData.cargo ?? ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        cargo: e.target.value,
                      })
                    }
                    placeholder="Cargo"
                    className="input-style text-sm"
                  />
                  <input
                    value={formatPhoneOnType(editFormData.telefone ?? "")}
                    onChange={handleEditPhoneChange}
                    placeholder="Telefone"
                    maxLength={15}
                    className="input-style text-sm"
                  />
                  <input
                    value={editFormData.email ?? ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        email: e.target.value,
                      })
                    }
                    type="email"
                    placeholder="Email"
                    className="input-style text-sm"
                  />
                  <textarea
                    value={editFormData.observacao ?? ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        observacao: e.target.value,
                      })
                    }
                    placeholder="Observação"
                    className="input-style w-full text-sm"
                  ></textarea>
                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleEditCancel}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-1 px-3 rounded flex items-center gap-1 text-sm"
                    >
                      <XCircle size={16} /> Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded flex items-center gap-1 disabled:bg-gray-500 text-sm"
                    >
                      <Save size={16} /> Salvar
                    </button>
                  </div>
                </form>
              ) : (
                <div
                  className={`transition-opacity ${
                    deletingId === contato.id ? "opacity-50" : ""
                  }`}
                >
                  {/* ... sua visualização de contato ... */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-grow space-y-1">
                      <p className="font-bold flex items-center gap-2">
                        <User size={16} /> {contato.nome}
                      </p>
                      {contato.cargo && (
                        <p className="text-sm text-gray-300 flex items-center gap-2">
                          <Briefcase size={16} /> {contato.cargo}
                        </p>
                      )}
                      {contato.telefone && (
                        <a
                          href={`https://wa.me/55${contato.telefone.replace(
                            /\D/g,
                            ""
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-400 flex items-center gap-2 hover:text-green-400 transition-colors"
                        >
                          <Phone size={16} /> {formatPhone(contato.telefone)}
                        </a>
                      )}
                      {contato.email && (
                        <a
                          href={`mailto:${contato.email}`}
                          className="text-sm text-gray-400 flex items-center gap-2 hover:text-blue-400 transition-colors"
                        >
                          <Mail size={16} /> {contato.email}
                        </a>
                      )}
                      {contato.observacao && (
                        <p className="text-sm italic text-gray-500 mt-2 flex items-center gap-2">
                          <MessageSquare size={16} /> {contato.observacao}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-3 flex-shrink-0 pt-1">
                      <button
                        onClick={() => handleEditStart(contato)}
                        disabled={deletingId !== null || isLoading}
                        className="text-gray-400 hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(contato.id)}
                        disabled={deletingId !== null || isLoading}
                        className="text-gray-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === contato.id ? (
                          "..."
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-400">Nenhum contato adicionado ainda.</p>
        )}
      </div>
    </div>
  );
}
