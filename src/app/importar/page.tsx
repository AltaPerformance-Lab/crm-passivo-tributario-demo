"use client";

import { useState } from "react";
import Papa from "papaparse";
import Link from "next/link";
import { UploadCloud } from "lucide-react";

export default function ImportarPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Aguardando arquivo...");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatusMessage(`Arquivo selecionado: ${e.target.files[0].name}`);
    }
  };

  const handleImport = async () => {
    if (!file) {
      alert("Por favor, selecione um arquivo CSV.");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setStatusMessage("Lendo e processando o arquivo...");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: ";",

      // A função 'beforeFirstChunk' foi REMOVIDA por ser muito sensível.

      complete: async (results) => {
        // --- NOVA LÓGICA DE FILTRAGEM (MUITO MAIS ROBUSTA) ---
        // Filtramos os resultados para pegar apenas as linhas que contêm a coluna "CPF/CNPJ".
        // Isso efetivamente ignora todo o cabeçalho extra no início do arquivo.
        const validData = (results.data as any[]).filter(
          (row) => row && row["CPF/CNPJ"] && row["CPF/CNPJ"].trim() !== ""
        );

        if (validData.length === 0) {
          setStatusMessage(
            "Erro: Nenhuma linha com a coluna 'CPF/CNPJ' foi encontrada. Verifique se o delimitador (;) está correto e o arquivo não está corrompido."
          );
          setIsProcessing(false);
          return;
        }
        // ------------------------------------------------------------------

        setStatusMessage(
          `Encontrados ${validData.length} registros válidos. Limpando e preparando dados...`
        );

        const leadsToImport = [];
        // Agora iteramos sobre os dados já filtrados e válidos
        for (const row of validData) {
          const cleanedCnpj = row["CPF/CNPJ"]?.replace(/[^\d]/g, "") || "";
          if (cleanedCnpj.length !== 14) continue;

          const valorString =
            row["Valor Total"]?.replace(/\./g, "").replace(",", ".") || "0";
          const valorFloat = parseFloat(valorString);

          if (!cleanedCnpj || !row["Nome"]) continue;

          leadsToImport.push({
            cnpj: cleanedCnpj,
            nomeDevedor: row["Nome"],
            nomeFantasia: row["Nome Fantasia"] || null,
            valorTotalDivida: valorFloat,
          });
        }

        if (leadsToImport.length === 0) {
          setStatusMessage(
            "Nenhum registro de CNPJ válido (14 dígitos) encontrado para importar."
          );
          setIsProcessing(false);
          return;
        }

        const chunkSize = 500;
        let totalProcessed = 0;
        for (let i = 0; i < leadsToImport.length; i += chunkSize) {
          const chunk = leadsToImport.slice(i, i + chunkSize);

          try {
            const response = await fetch("/api/leads/import", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(chunk),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(
                errorData.message ||
                  `Falha ao importar o lote ${i / chunkSize + 1}`
              );
            }

            totalProcessed += chunk.length;
            const currentProgress =
              (totalProcessed / leadsToImport.length) * 100;
            setProgress(currentProgress);
            setStatusMessage(
              `Importando... ${totalProcessed} de ${leadsToImport.length} leads salvos.`
            );
          } catch (error) {
            console.error(error);
            setStatusMessage(`Erro ao importar: ${(error as Error).message}`);
            setIsProcessing(false);
            return;
          }
        }

        setStatusMessage("🎉 Importação concluída com sucesso!");
        setIsProcessing(false);
      },
      error: (error: any) => {
        console.error("Erro ao parsear CSV:", error);
        setStatusMessage("Erro ao ler o arquivo CSV.");
        setIsProcessing(false);
      },
    });
  };

  return (
    <main className="bg-gray-900 text-white min-h-screen p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            &larr; Voltar para o painel
          </Link>
        </div>
        <div className="bg-gray-800 shadow-md rounded-lg p-6">
          <h1 className="text-3xl font-bold mb-6">Importar Leads por CSV</h1>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
              <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer rounded-md font-semibold text-blue-400 hover:text-blue-300"
              >
                <span>Selecione um arquivo</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={isProcessing}
                />
              </label>
              <p className="text-xs leading-5 text-gray-400">
                CSV da PGFN (delimitador ponto e vírgula)
              </p>
            </div>

            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{
                  width: `${progress}%`,
                  transition: "width 0.5s ease-in-out",
                }}
              ></div>
            </div>
            <p className="text-center text-sm text-gray-300">{statusMessage}</p>

            <button
              onClick={handleImport}
              disabled={!file || isProcessing}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processando..." : "Iniciar Importação"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
