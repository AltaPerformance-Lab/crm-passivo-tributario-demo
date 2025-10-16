"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { Lead, LeadStatus } from "@prisma/client";
import { formatCNPJ } from "@/lib/utils";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import {
  PieChart as ChartIcon,
  Download,
  Settings,
  Upload,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import UpcomingReminders from "./UpcomingReminders";

const statusOptions: LeadStatus[] = [
  "A_VERIFICAR",
  "VERIFICADO",
  "CONTATADO",
  "AGUARDANDO_RESPOSTA",
  "EM_NEGOCIACAO",
  "NAO_TEM_INTERESSE",
  "CONVERTIDO",
  "DESCARTADO",
];

const statusColors: Record<LeadStatus, { bg: string; text: string }> = {
  A_VERIFICAR: { bg: "bg-gray-200", text: "text-gray-900" },
  VERIFICADO: { bg: "bg-blue-200", text: "text-blue-900" },
  CONTATADO: { bg: "bg-cyan-200", text: "text-cyan-900" },
  AGUARDANDO_RESPOSTA: { bg: "bg-orange-200", text: "text-orange-900" },
  EM_NEGOCIACAO: { bg: "bg-purple-200", text: "text-purple-900" },
  NAO_TEM_INTERESSE: { bg: "bg-pink-200", text: "text-pink-900" },
  CONVERTIDO: { bg: "bg-green-200", text: "text-green-900" },
  DESCARTADO: { bg: "bg-red-200", text: "text-red-900" },
};

// COMPONENTE DE LINHA PARA DESKTOP (Otimizado)
const LeadRow = ({
  lead,
  isSelected,
  onSelect,
}: {
  lead: Lead;
  isSelected: boolean;
  onSelect: (leadId: number) => void;
}) => {
  const router = useRouter();
  const handleRowClick = () => router.push(`/leads/${lead.id}`);
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(lead.id);
  };
  const colors = statusColors[lead.status] || statusColors.A_VERIFICAR;

  return (
    <tr
      onClick={handleRowClick}
      className={`transition-colors duration-200 cursor-pointer ${
        isSelected ? "bg-blue-900/50" : "hover:bg-gray-700"
      }`}
    >
      <td className="px-5 py-4 border-b border-gray-600 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onClick={handleCheckboxClick}
          onChange={() => {}}
          className="form-checkbox h-5 w-5 bg-gray-800 border-gray-600 rounded text-blue-600 focus:ring-blue-500"
        />
      </td>
      <td className="px-5 py-4 border-b border-gray-600 text-sm">
        <p className="font-semibold whitespace-nowrap">{lead.nomeDevedor}</p>
        {lead.nomeFantasia && (
          <p className="text-gray-400 text-xs whitespace-nowrap">
            {lead.nomeFantasia}
          </p>
        )}
      </td>
      <td className="px-5 py-4 border-b border-gray-600 text-sm font-mono">
        {formatCNPJ(lead.cnpj)}
      </td>
      <td className="px-5 py-4 border-b border-gray-600 text-sm">
        <span
          className={`relative inline-block px-3 py-1 font-semibold leading-tight ${colors.text}`}
        >
          <span
            aria-hidden
            className={`absolute inset-0 ${colors.bg} opacity-50 rounded-full`}
          ></span>
          <span className="relative text-xs">
            {lead.status.replace(/_/g, " ")}
          </span>
        </span>
      </td>
      <td className="px-5 py-4 border-b border-gray-600 text-sm text-right font-semibold text-red-400">
        {lead.valorTotalDivida.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}
      </td>
    </tr>
  );
};

// NOVO: COMPONENTE DE CARTÃO PARA TELEMÓVEL
const LeadCard = ({
  lead,
  isSelected,
  onSelect,
}: {
  lead: Lead;
  isSelected: boolean;
  onSelect: (leadId: number) => void;
}) => {
  const router = useRouter();
  const handleCardClick = () => router.push(`/leads/${lead.id}`);
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(lead.id);
  };
  const colors = statusColors[lead.status] || statusColors.A_VERIFICAR;

  return (
    <div
      onClick={handleCardClick}
      className={`bg-gray-800 p-4 rounded-lg mb-3 shadow-md flex items-center gap-4 transition-colors duration-200 cursor-pointer ${
        isSelected ? "ring-2 ring-blue-500" : "hover:bg-gray-700"
      }`}
    >
      <div className="flex-shrink-0">
        <input
          type="checkbox"
          checked={isSelected}
          onClick={handleCheckboxClick}
          onChange={() => {}}
          className="form-checkbox h-6 w-6 bg-gray-900 border-gray-600 rounded text-blue-600 focus:ring-blue-500"
        />
      </div>
      <div className="flex-grow">
        <p className="font-bold text-white break-words">{lead.nomeDevedor}</p>
        {lead.nomeFantasia && (
          <p className="text-sm text-gray-400 break-words">
            {lead.nomeFantasia}
          </p>
        )}
      </div>
      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        <p className="text-sm font-semibold text-red-400 whitespace-nowrap">
          {lead.valorTotalDivida.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </p>
        <span
          className={`relative inline-block px-2 py-1 font-semibold leading-tight text-xs ${colors.text}`}
        >
          <span
            aria-hidden
            className={`absolute inset-0 ${colors.bg} opacity-50 rounded-full`}
          ></span>
          <span className="relative">{lead.status.replace(/_/g, " ")}</span>
        </span>
      </div>
    </div>
  );
};

const Pagination = ({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="flex justify-center items-center gap-2 sm:gap-4 text-xs sm:text-sm">
      <button
        onClick={() => router.push(createPageURL(currentPage - 1))}
        disabled={currentPage <= 1}
        className="flex items-center gap-1 px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={16} />{" "}
        <span className="hidden sm:inline">Anterior</span>
      </button>
      <span>
        Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
      </span>
      <button
        onClick={() => router.push(createPageURL(currentPage + 1))}
        disabled={currentPage >= totalPages}
        className="flex items-center gap-1 px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="hidden sm:inline">Próxima</span>{" "}
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

type LocationData = { uf: string; cities: string[] };

export default function LeadsTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<number>>(
    new Set()
  );

  const [isBulkEnriching, setIsBulkEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState(0);
  const [enrichMessage, setEnrichMessage] = useState("");

  const currentPage = Number(searchParams.get("page")) || 1;
  const searchTerm = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || "A_VERIFICAR";
  const ufFilter = searchParams.get("uf") || "";
  const cityFilter = searchParams.get("city") || "";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const [locations, setLocations] = useState<LocationData[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const handleFilterChange = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams);
      params.set(name, value);
      if (name !== "page") {
        params.set("page", "1");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  useEffect(() => {
    const fetchLeads = async () => {
      setIsLoading(true);
      const params = new URLSearchParams(searchParams);
      if (!params.get("page")) params.set("page", "1");
      if (!params.get("status")) params.set("status", "A_VERIFICAR");
      if (!params.get("sortOrder")) params.set("sortOrder", "desc");

      try {
        const response = await fetch(`/api/leads?${params.toString()}`);
        if (!response.ok) throw new Error("Falha na resposta da API");
        const { data, total, totalPages } = await response.json();
        setLeads(data);
        setTotalLeads(total);
        setTotalPages(totalPages);
        setSelectedLeadIds(new Set());
      } catch (error) {
        console.error("Erro ao buscar leads:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeads();
  }, [searchParams]);

  useEffect(() => {
    const getLocations = async () => {
      try {
        const response = await fetch("/api/locations");
        const data = await response.json();
        setLocations(data);
      } catch (error) {
        console.error("Erro ao buscar cidades:", error);
      }
    };
    getLocations();
  }, []);

  useEffect(() => {
    if (ufFilter) {
      const selectedUfData = locations.find((loc) => loc.uf === ufFilter);
      setAvailableCities(selectedUfData?.cities || []);
    } else {
      setAvailableCities([]);
    }
    if (!searchParams.has("city")) {
      handleFilterChange("city", "");
    }
  }, [ufFilter, locations, searchParams, handleFilterChange]);

  const handleSelectLead = (leadId: number) => {
    setSelectedLeadIds((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(leadId)) newSelected.delete(leadId);
      else newSelected.add(leadId);
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (selectedLeadIds.size === leads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(leads.map((lead) => lead.id)));
    }
  };

  const handleExport = () => {
    if (selectedLeadIds.size === 0) return;
    const leadsToExport = leads.filter((lead) => selectedLeadIds.has(lead.id));
    const content = leadsToExport
      .map((lead) => `${formatCNPJ(lead.cnpj)}\n${lead.nomeDevedor}`)
      .join("\n\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "leads_para_contato.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkEnrich = async () => {
    const leadsToEnrich = leads.filter((lead) => !lead.empresaId);
    if (leadsToEnrich.length === 0) {
      // Usar uma notificação mais amigável em vez de alert
      alert("Todos os leads nesta página já foram enriquecidos.");
      return;
    }
    setIsBulkEnriching(true);
    setEnrichMessage(`Iniciando... 0 de ${leadsToEnrich.length} enriquecidos.`);
    let processedCount = 0;
    for (const lead of leadsToEnrich) {
      try {
        await fetch("/api/cnpj/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cnpj: lead.cnpj }),
        });
      } catch (error) {
        console.error(`Falha ao enriquecer CNPJ ${lead.cnpj}:`, error);
      } finally {
        processedCount++;
        setEnrichProgress((processedCount / leadsToEnrich.length) * 100);
        setEnrichMessage(
          `${processedCount} de ${leadsToEnrich.length} leads processados.`
        );
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    setEnrichMessage("Enriquecimento concluído! Atualizando a lista...");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsBulkEnriching(false);
    setEnrichProgress(0);
    setEnrichMessage("");
    router.refresh();
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <Link href="/">
          <h1 className="text-2xl sm:text-3xl font-bold hover:text-blue-400 transition-colors">
            Painel de Leads
          </h1>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center">
          <Link
            href="/importar"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 sm:px-4 rounded flex items-center gap-2 text-sm"
          >
            <Upload size={18} />{" "}
            <span className="hidden sm:inline">Importar</span>
          </Link>
          <button
            onClick={handleBulkEnrich}
            disabled={isBulkEnriching || isLoading}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-3 sm:px-4 rounded flex items-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed text-sm"
          >
            {isBulkEnriching ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Sparkles size={18} />
            )}{" "}
            <span className="hidden sm:inline">Enriquecer</span>
          </button>
          <button
            onClick={handleExport}
            disabled={selectedLeadIds.size === 0 || isBulkEnriching}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 sm:px-4 rounded flex items-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed text-sm"
          >
            <Download size={18} />{" "}
            <span className="hidden sm:inline">Exportar</span> (
            {selectedLeadIds.size})
          </button>
          <Link
            href="/dashboard"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 sm:px-4 rounded flex items-center gap-2 text-sm"
          >
            <ChartIcon size={18} />{" "}
            <span className="hidden sm:inline">Métricas</span>
          </Link>
          <Link
            href="/configuracoes"
            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
          >
            <Settings size={18} />
          </Link>
          <LogoutButton />
        </div>
      </div>

      {isBulkEnriching && (
        <div className="mb-4">
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-teal-600 h-2.5 rounded-full"
              style={{
                width: `${enrichProgress}%`,
                transition: "width 0.5s ease-in-out",
              }}
            ></div>
          </div>
          <p className="text-center text-sm text-teal-300 mt-1">
            {enrichMessage}
          </p>
        </div>
      )}

      <UpcomingReminders />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <input
          type="text"
          defaultValue={searchTerm}
          onBlur={(e) => handleFilterChange("search", e.target.value)}
          placeholder="Buscar por Nome ou CNPJ..."
          className="lg:col-span-2 px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os Status</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select
          value={ufFilter}
          onChange={(e) => handleFilterChange("uf", e.target.value)}
          className="px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os Estados</option>
          {locations.map((loc) => (
            <option key={loc.uf} value={loc.uf}>
              {loc.uf}
            </option>
          ))}
        </select>
        <select
          value={cityFilter}
          onChange={(e) => handleFilterChange("city", e.target.value)}
          disabled={!ufFilter && availableCities.length === 0}
          className="px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Todas as Cidades</option>
          {availableCities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 bg-gray-700 px-4 py-2 border border-gray-600 rounded-lg md:col-span-2 lg:col-span-5">
          <label className="text-sm text-gray-400">Ordenar por:</label>
          <button
            onClick={() => handleFilterChange("sortOrder", "desc")}
            className={`px-2 py-1 rounded-md text-sm transition-colors ${
              sortOrder === "desc"
                ? "bg-blue-600 text-white"
                : "bg-gray-600 hover:bg-gray-500"
            }`}
          >
            <ArrowDown className="inline-block" size={16} /> Maior Valor
          </button>
          <button
            onClick={() => handleFilterChange("sortOrder", "asc")}
            className={`px-2 py-1 rounded-md text-sm transition-colors ${
              sortOrder === "asc"
                ? "bg-blue-600 text-white"
                : "bg-gray-600 hover:bg-gray-500"
            }`}
          >
            <ArrowUp className="inline-block" size={16} /> Menor Valor
          </button>
        </div>
      </div>

      {/* --- MUDANÇA ESTRUTURAL PARA RESPONSIVIDADE --- */}
      {/* Lista de cartões para telemóvel */}
      <div className="md:hidden space-y-3">
        {isLoading && (
          <div className="p-8 text-center text-gray-400">
            <Loader2 className="mx-auto animate-spin" />
          </div>
        )}
        {!isLoading &&
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              isSelected={selectedLeadIds.has(lead.id)}
              onSelect={handleSelectLead}
            />
          ))}
      </div>

      {/* Tabela para desktop */}
      <div className="hidden md:block bg-gray-800 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="bg-gray-700 text-gray-300 uppercase text-sm">
              <th className="px-5 py-3 border-b-2 border-gray-600 text-center">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    leads.length > 0 && selectedLeadIds.size === leads.length
                  }
                  className="form-checkbox h-5 w-5 bg-gray-800 border-gray-600 rounded text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-600 text-left">
                Nome do Devedor
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-600 text-left">
                CNPJ
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-600 text-left">
                Status
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-600 text-right">
                Valor da Dívida
              </th>
            </tr>
          </thead>
          <tbody>
            {!isLoading &&
              leads.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  isSelected={selectedLeadIds.has(lead.id)}
                  onSelect={handleSelectLead}
                />
              ))}
          </tbody>
        </table>
        {isLoading && (
          <div className="p-8 text-center text-gray-400">
            <Loader2 className="mx-auto animate-spin" />
          </div>
        )}
      </div>

      {/* Paginação Comum */}
      <div className="p-4">
        {!isLoading && totalLeads > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        )}
        {!isLoading && totalLeads === 0 && (
          <p className="text-center text-gray-400">
            Nenhum resultado encontrado.
          </p>
        )}
      </div>
    </div>
  );
}
