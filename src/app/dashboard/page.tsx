"use client";

import { useEffect, useState, useMemo, ReactElement } from "react";
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
  Loader2,
  AlertTriangle,
  Users,
  DollarSign,
  Target,
  Percent,
  Briefcase,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type MetricsData = {
  financialSummary: {
    totalFechado: number;
    quantidadeNegocios: number;
    totalRecebido: number;
    totalEscritorio: number; // Campo já existe na API
    totalOutraParte: number; // Campo já existe na API
  };
  geral: {
    totalLeads: number;
    conversionRate: number;
    convertedCount: number;
  };
  statusDistribution: { name: string; value: number }[];
  dailyPerformance: {
    date: string;
    "Leads Contatados": number;
    "Valor Convertido": number;
  }[];
  funnelData: { name: string; value: number }[];
};

const STATUS_COLORS: Record<string, string> = {
  "A VERIFICAR": "#e5e7eb",
  VERIFICADO: "#93c5fd",
  CONTATADO: "#67e8f9",
  "AGUARDANDO RESPOSTA": "#fdbb74",
  "EM NEGOCIACAO": "#c084fc",
  "NAO TEM INTERESSE": "#f9a8d4",
  CONVERTIDO: "#86efac",
  DESCARTADO: "#fca5a5",
};

// --- COMPONENTES AUXILIARES ---

const MetricCard = ({
  title,
  value,
  icon: Icon,
  link,
  tooltip,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  link?: string;
  tooltip?: string;
}) => {
  const CardContent = () => (
    <div
      title={tooltip}
      className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg hover:bg-gray-700/50 transition-colors h-full flex flex-col justify-between"
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-400">{title}</p>
        <div className="bg-gray-900/50 p-2 rounded-full">
          <Icon className="h-5 w-5 text-blue-400" />
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-white mt-2">{value}</p>
    </div>
  );
  return link ? (
    <Link href={link}>
      <CardContent />
    </Link>
  ) : (
    <CardContent />
  );
};

const ChartContainer = ({
  title,
  children,
}: {
  title: string;
  children: ReactElement;
}) => (
  <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
    <h3 className="text-lg font-bold mb-4 text-white">{title}</h3>
    <ResponsiveContainer width="100%" height={350}>
      {children}
    </ResponsiveContainer>
  </div>
);

const DashboardSkeleton = () => (
  <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-gray-800/50 h-32 rounded-lg"></div>
      ))}
    </div>
    <div className="bg-gray-800/50 h-[400px] rounded-lg"></div>
  </div>
);

// --- COMPONENTE PRINCIPAL DA PÁGINA ---

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!date?.from || !date?.to) return;
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({
        startDate: date.from.toISOString(),
        endDate: date.to.toISOString(),
      });
      try {
        const response = await fetch(`/api/metrics?${params.toString()}`);
        if (!response.ok)
          throw new Error(
            "Falha ao buscar métricas. Verifique se está logado."
          );
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        console.error("Erro ao carregar dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetrics();
  }, [date]);

  const {
    financialData,
    funnelData,
    statusDistribution,
    dailyPerformance,
    geralData,
  } = useMemo(
    () => ({
      // AJUSTE: Garantimos que todos os campos financeiros tenham um valor padrão
      financialData: metrics?.financialSummary || {
        totalFechado: 0,
        quantidadeNegocios: 0,
        totalRecebido: 0,
        totalEscritorio: 0,
        totalOutraParte: 0,
      },
      funnelData: metrics?.funnelData || [],
      statusDistribution: metrics?.statusDistribution || [],
      dailyPerformance: metrics?.dailyPerformance || [],
      geralData: metrics?.geral || {
        totalLeads: 0,
        conversionRate: 0,
        convertedCount: 0,
      },
    }),
    [metrics]
  );

  const handlePieClick = (data: any) => {
    const statusKey = data.name.replace(/ /g, "_").toUpperCase();
    router.push(`/?status=${statusKey}`);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <main className="bg-gray-900 text-white min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold">Dashboard de Métricas</h1>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full sm:w-auto min-w-[280px] justify-start text-left font-normal bg-gray-800 hover:bg-gray-700 border-gray-600 text-white"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      `${format(date.from, "dd/MM/yy")} - ${format(
                        date.to,
                        "dd/MM/yy"
                      )}`
                    ) : (
                      format(date.from, "dd/MM/yy")
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
              className="text-blue-400 hover:text-blue-300 whitespace-nowrap hidden sm:block"
            >
              &larr; Voltar para a lista
            </Link>
          </div>
        </div>

        {isLoading && <DashboardSkeleton />}
        {error && (
          <div className="text-center text-red-400 p-8 bg-red-900/20 rounded-lg">
            <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
            {error}
          </div>
        )}

        {!isLoading && !error && metrics && (
          <div className="space-y-8">
            {/* AJUSTE: Layout do grid alterado para 3 colunas e novos cards adicionados */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MetricCard
                title="Total Convertido (Geral)"
                value={formatCurrency(financialData.totalFechado)}
                icon={Target}
                tooltip={`${financialData.quantidadeNegocios} negócios fechados no total`}
              />
              <MetricCard
                title="Total Escritório (Geral)"
                value={formatCurrency(financialData.totalEscritorio)}
                icon={Briefcase}
              />
              <MetricCard
                title="Total Sócio (Outra Parte)"
                value={formatCurrency(financialData.totalOutraParte)}
                icon={UserPlus}
              />
              <MetricCard
                title="Receita Real (Sua Parte)"
                value={formatCurrency(financialData.totalRecebido)}
                icon={DollarSign}
              />
              <MetricCard
                title="Total de Leads (Geral)"
                value={geralData.totalLeads.toString()}
                icon={Users}
              />
              <MetricCard
                title="Taxa de Conversão (Geral)"
                value={`${geralData.conversionRate.toFixed(1)}%`}
                icon={Percent}
                tooltip={`${geralData.convertedCount} de ${geralData.totalLeads} leads no total`}
              />
            </div>

            <ChartContainer title="Performance Diária (no período selecionado)">
              {/* ... O restante do código dos gráficos continua o mesmo ... */}
              <LineChart
                data={dailyPerformance}
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(107, 114, 128, 0.1)" }}
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #4b5563",
                  }}
                  formatter={(value: number, name) => [
                    formatCurrency(value),
                    name,
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Line
                  type="monotone"
                  dataKey="Valor Convertido"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Leads Contatados"
                  stroke="#818cf8"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3">
                <ChartContainer title="Funil de Vendas (Leads criados no período)">
                  <BarChart
                    layout="vertical"
                    data={funnelData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#9ca3af"
                      fontSize={12}
                      width={110}
                      interval={0}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(107, 114, 128, 0.1)" }}
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #4b5563",
                      }}
                    />
                    <Bar
                      dataKey="value"
                      name="Leads na etapa"
                      fill="#60a5fa"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
              <div className="lg:col-span-2">
                <ChartContainer title="Distribuição de Status (no período)">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      labelLine={false}
                      onClick={handlePieClick}
                      className="cursor-pointer"
                    >
                      {statusDistribution?.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            STATUS_COLORS[entry.name.toUpperCase()] || "#8884d8"
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} leads`, name]}
                    />
                  </PieChart>
                </ChartContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
