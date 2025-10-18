"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Configuracao } from "@prisma/client";
import Image from "next/image";
import { Download, Loader2, Upload, AlertTriangle } from "lucide-react";

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<Partial<Configuracao>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/config");
        if (!response.ok) throw new Error("Falha ao carregar configurações");
        const data = await response.json();
        setConfig(data);
      } catch (error) {
        console.error("Falha ao carregar configurações", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const textResponse = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!textResponse.ok) throw new Error("Falha ao salvar dados de texto");

      if (logoFile) {
        const formData = new FormData();
        formData.append("logo", logoFile);
        const logoResponse = await fetch("/api/config/upload-logo", {
          method: "POST",
          body: formData,
        });
        if (!logoResponse.ok) throw new Error("Falha ao fazer upload da logo");
        const newLogoData = await logoResponse.json();
        setConfig((prev) => ({ ...prev, logoUrl: newLogoData.logoUrl }));
      }

      alert("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar as configurações.");
    } finally {
      setIsSaving(false);
      setLogoFile(null);
    }
  };

  const handleBackup = () => {
    setIsBackingUp(true);
    // CORREÇÃO 1: Apontando para a rota correta que criamos
    window.location.href = "/api/backup/generate";
    // Usamos um timeout um pouco maior para dar tempo do download começar
    setTimeout(() => setIsBackingUp(false), 5000);
  };

  const handleRestore = async () => {
    if (!backupFile) {
      alert(
        "Por favor, selecione um ficheiro de backup (.sql) para restaurar."
      );
      return;
    }
    const confirmation = prompt(
      "ATENÇÃO! Esta ação é irreversível e irá apagar TODOS os dados atuais. Para confirmar, digite 'RESTAURAR'."
    );
    if (confirmation !== "RESTAURAR") {
      alert("Restauração cancelada.");
      return;
    }

    setIsRestoring(true);
    try {
      const formData = new FormData();
      formData.append("backupFile", backupFile);
      // CORREÇÃO 2: Apontando para a rota correta que criamos
      const response = await fetch("/api/backup/restore", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Falha na resposta da API.");
      alert("Restauração concluída com sucesso! A aplicação será recarregada.");
      window.location.reload();
    } catch (error) {
      console.error("Erro ao restaurar:", error);
      alert(`Erro ao restaurar: ${(error as Error).message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  if (isLoading) {
    return (
      <p className="text-center p-8 text-white">Carregando configurações...</p>
    );
  }

  // O resto do seu JSX continua exatamente o mesmo...
  return (
    <main className="bg-gray-900 text-white min-h-screen p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            &larr; Voltar para o painel
          </Link>
        </div>
        <div className="bg-gray-800 shadow-md rounded-lg p-6">
          <h1 className="text-3xl font-bold mb-6">Configurações da Empresa</h1>
          <div className="mb-6">
            <label className="block mb-2 text-sm text-gray-400">
              Logo da Empresa
            </label>
            <div className="flex items-center gap-4">
              {config.logoUrl && (
                <Image
                  src={config.logoUrl}
                  alt="Logo da Empresa"
                  width={80}
                  height={80}
                  className="rounded-md bg-white p-1"
                />
              )}
              <input
                type="file"
                name="logo"
                accept="image/png, image/jpeg"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-300 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
            </div>
          </div>
          <div className="space-y-4">
            {/* Campos de input (nome, cnpj, etc.) */}
            <div>
              <label className="block mb-1 text-sm text-gray-400">
                Nome da Empresa
              </label>
              <input
                type="text"
                name="nomeEmpresa"
                value={config.nomeEmpresa || ""}
                onChange={handleInputChange}
                className="input-style w-full bg-gray-700 p-2 rounded border border-gray-600"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm text-gray-400">CNPJ</label>
              <input
                type="text"
                name="cnpj"
                value={config.cnpj || ""}
                onChange={handleInputChange}
                className="input-style w-full bg-gray-700 p-2 rounded border border-gray-600"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm text-gray-400">
                Endereço Completo
              </label>
              <input
                type="text"
                name="endereco"
                value={config.endereco || ""}
                onChange={handleInputChange}
                className="input-style w-full bg-gray-700 p-2 rounded border border-gray-600"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm text-gray-400">
                E-mail de Contato
              </label>
              <input
                type="email"
                name="email"
                value={config.email || ""}
                onChange={handleInputChange}
                className="input-style w-full bg-gray-700 p-2 rounded border border-gray-600"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm text-gray-400">
                Telefone
              </label>
              <input
                type="tel"
                name="telefone"
                value={config.telefone || ""}
                onChange={handleInputChange}
                className="input-style w-full bg-gray-700 p-2 rounded border border-gray-600"
              />
            </div>
          </div>
          <div className="mt-6 border-t border-gray-700 pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500 flex items-center justify-center"
            >
              {isSaving ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Salvar Configurações"
              )}
            </button>
          </div>
        </div>
        <div className="bg-gray-800 shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Backup e Restauração</h2>
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-2">
              Gere e baixe um ficheiro de backup completo (.sql) de todo o seu
              banco de dados.
            </p>
            <button
              onClick={handleBackup}
              disabled={isBackingUp}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500 flex justify-center items-center gap-2"
            >
              {isBackingUp ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Download size={18} />
              )}
              {isBackingUp ? "A gerar backup..." : "Gerar e Baixar Backup"}
            </button>
          </div>
          <div className="border-t border-gray-700 pt-6">
            <div className="flex items-center gap-2 text-yellow-400 mb-2">
              <AlertTriangle size={18} />
              <h3 className="text-lg font-bold">
                Restaurar a partir de um Backup
              </h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Selecione um ficheiro `.sql` de um backup anterior para substituir
              todos os dados atuais.{" "}
              <strong>Esta ação não pode ser desfeita.</strong>
            </p>
            <div className="flex items-center gap-4 mb-4">
              <input
                type="file"
                accept=".sql"
                onChange={(e) =>
                  setBackupFile(e.target.files ? e.target.files[0] : null)
                }
                className="w-full text-sm text-gray-300 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-600 file:text-white hover:file:bg-gray-500"
                disabled={isRestoring}
              />
            </div>
            <button
              onClick={handleRestore}
              disabled={isRestoring || !backupFile}
              className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isRestoring ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Upload size={18} />
              )}
              {isRestoring
                ? "A restaurar..."
                : "Restaurar a partir do Ficheiro"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
