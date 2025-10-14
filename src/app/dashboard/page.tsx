"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Link from "next/link";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import {
  Calendar as CalendarIcon,
  Filter as FunnelIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type StatusDistribution = { name: string; value: number };
type FinancialSummary = {
  totalFechado: number;
  totalEscritorio: number;
  totalOutraParte: number;
  totalRecebido: number;
  quantidadeNegocios: number;
};
type DailyPerformance = {
  date: string;
  "Leads Contatados": number;
  "Valor Convertido": number;
};
type FunnelData = { name: string; value: number };

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#ff4d4d",
  "#A333FF",
  "#FF33A8",
];

const DashboardSkeleton = () => (
  <div className="animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-gray-800/50 h-28 rounded-lg"></div>
      <div className="bg-gray-800/50 h-28 rounded-lg"></div>
      <div className="bg-gray-800/50 h-28 rounded-lg"></div>
      <div className="bg-gray-800/50 h-28 rounded-lg"></div>
    </div>
    <div className="mt-8 bg-gray-800/50 h-[350px] rounded-lg"></div>
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-gray-800/50 h-[350px] rounded-lg"></div>
      <div className="bg-gray-800/50 h-[350px] rounded-lg"></div>
    </div>
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const [statusData, setStatusData] = useState<StatusDistribution[]>([]);
  const [financialData, setFinancialData] = useState<FinancialSummary | null>(
    null
  );
  const [dailyData, setDailyData] = useState<DailyPerformance[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!date?.from || !date?.to) return;
      setIsLoading(true);
      const startDate = date.from.toISOString();
      const endDate = date.to.toISOString();
      try {
        const response = await fetch(
          `/api/dashboard-metrics?startDate=${startDate}&endDate=${endDate}`
        );
        if (!response.ok) throw new Error("Falha ao buscar métricas");
        const data = await response.json();
        setStatusData(data.statusDistribution);
        setFinancialData(data.financialSummary);
        setDailyData(data.dailyPerformance);
        setFunnelData(data.funnelData);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetrics();
  }, [date]);

  const handlePieClick = (data: any) => {
    const statusKey = data.name.replace(/ /g, "_").toUpperCase();
    router.push(`/?status=${statusKey}`);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const linkToConverted =
    financialData && date?.from && date?.to
      ? `/?status=CONVERTIDO&startDate=${date.from.toISOString()}&endDate=${date.to.toISOString()}`
      : "#";

  return (
    <main className="bg-gray-900 text-white min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold">Dashboard de Métricas</h1>
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full sm:w-[300px] justify-start text-left font-normal bg-gray-800 hover:bg-gray-700 border-gray-600 text-white"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                        {format(date.to, "dd/MM/yy", { locale: ptBR })}
                      </>
                    ) : (
                      format(date.from, "dd/MM/yy", { locale: ptBR })
                    )
                  ) : (
                    <span>Escolha um período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 bg-gray-800 border-gray-600 text-white"
                align="end"
              >
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            <Link
              href="/"
              className="text-blue-400 hover:text-blue-300 whitespace-nowrap"
            >
              &larr; Voltar para a lista
            </Link>
          </div>
        </div>

        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {financialData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link href={linkToConverted}>
                  <div className="bg-gray-800 p-6 rounded-lg shadow-lg hover:bg-gray-700 transition-colors h-full cursor-pointer">
                    <h3 className="text-gray-400">Total Convertido</h3>
                    <p className="text-3xl font-bold text-purple-400">
                      {formatCurrency(financialData.totalFechado)}
                    </p>
                    <p className="text-gray-500">
                      {financialData.quantidadeNegocios} negócios
                    </p>
                  </div>
                </Link>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                  <h3 className="text-gray-400">Sua Parte Total</h3>
                  <p className="text-3xl font-bold text-green-400">
                    {formatCurrency(financialData.totalRecebido)}
                  </p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                  <h3 className="text-gray-400">Total Escritório</h3>
                  <p className="text-3xl font-bold text-yellow-400">
                    {formatCurrency(financialData.totalEscritorio)}
                  </p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                  <h3 className="text-gray-400">Total Sócio</h3>
                  <p className="text-3xl font-bold text-orange-400">
                    {formatCurrency(financialData.totalOutraParte)}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="font-bold mb-4">Performance no Período</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={dailyData}
                  margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
                >
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis
                    yAxisId="left"
                    stroke="#8884d8"
                    fontSize={12}
                    label={{
                      value: "Leads Contatados",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#8884d8",
                      dy: 40,
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#00C49F"
                    fontSize={12}
                    tickFormatter={formatCurrency}
                    label={{
                      value: "Valor Convertido (R$)",
                      angle: -90,
                      position: "insideRight",
                      fill: "#00C49F",
                      dy: -40,
                    }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(107, 114, 128, 0.2)" }}
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #4b5563",
                      borderRadius: "0.5rem",
                    }}
                    formatter={(value: number, name) =>
                      name === "Valor Convertido"
                        ? formatCurrency(value)
                        : value
                    }
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="Leads Contatados"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="Valor Convertido"
                    stroke="#00C49F"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <FunnelIcon size={18} /> Funil de Vendas
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    layout="vertical"
                    data={funnelData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis
                      type="number"
                      stroke="#9ca3af"
                      fontSize={12}
                      tickFormatter={(value) => value.toLocaleString("pt-BR")}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#9ca3af"
                      fontSize={12}
                      width={100}
                      interval={0}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(107, 114, 128, 0.2)" }}
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #4b5563",
                      }}
                      formatter={(value: number) =>
                        value.toLocaleString("pt-BR")
                      }
                    />
                    <Bar dataKey="value" name="Leads">
                      {funnelData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="font-bold mb-4">
                  Distribuição de Leads por Status
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      labelLine={false}
                      label={({ name, percent }: any) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                      onClick={handlePieClick}
                      className="cursor-pointer"
                    >
                      {statusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #4b5563",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
