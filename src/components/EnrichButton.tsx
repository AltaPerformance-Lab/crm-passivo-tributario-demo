// src/components/EnrichButton.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// MUDANÇA: Adicionamos 'buttonText' como uma propriedade (prop)
export default function EnrichButton({
  cnpj,
  buttonText,
}: {
  cnpj: string;
  buttonText: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleEnrich = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/cnpj/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnpj }),
      });

      const data = await response.json();

      if (
        !response.ok ||
        (response.status !== 200 && response.status !== 201)
      ) {
        setMessage(`Info: ${data.message}`);
      } else {
        setMessage("Operação concluída com sucesso!");
        router.refresh();
      }
    } catch (error) {
      setMessage("Erro ao conectar com a API.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleEnrich}
        disabled={isLoading}
        // MUDANÇA: Usamos a prop 'buttonText' dinamicamente
        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500 w-full"
      >
        {isLoading ? "Consultando..." : buttonText}
      </button>
      {message && (
        <p className="text-sm text-center mt-2 text-gray-400">{message}</p>
      )}
    </div>
  );
}
