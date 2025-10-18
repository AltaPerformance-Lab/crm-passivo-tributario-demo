"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react"; // Adicionado ícone para o botão

export default function EnrichButton({
  cnpj,
  buttonText,
}: {
  cnpj: string;
  buttonText: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  // Estados separados para sucesso e erro para podermos estilizá-los de forma diferente
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const handleEnrich = async () => {
    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/cnpj/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnpj }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Se a resposta não for OK, consideramos um erro
        throw new Error(data.message || "Falha ao consultar o CNPJ.");
      }

      setSuccessMessage("Dados atualizados com sucesso!");
      router.refresh();
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 w-full">
      <button
        onClick={handleEnrich}
        disabled={isLoading}
        className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500 w-full flex justify-center items-center gap-2"
      >
        {isLoading ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          <Sparkles size={18} />
        )}
        {isLoading ? "Consultando..." : buttonText}
      </button>

      {/* Mensagens de feedback com cores distintas */}
      {successMessage && (
        <p className="text-sm text-center mt-2 text-green-400">
          {successMessage}
        </p>
      )}
      {errorMessage && (
        <p className="text-sm text-center mt-2 text-red-400">{errorMessage}</p>
      )}
    </div>
  );
}
