import LeadsTable from "@/components/LeadsTable";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

// Componente de fallback para o loading
const LoadingSkeleton = () => (
  <div className="flex justify-center items-center p-20">
    <Loader2 className="animate-spin text-gray-400" size={48} />
  </div>
);

export default function HomePage() {
  return (
    <main className="bg-gray-900 text-white min-h-screen p-4 sm:p-8">
      {/* --- CORREÇÃO: Envolvendo a tabela com Suspense --- */}
      <Suspense fallback={<LoadingSkeleton />}>
        <LeadsTable />
      </Suspense>
    </main>
  );
}
