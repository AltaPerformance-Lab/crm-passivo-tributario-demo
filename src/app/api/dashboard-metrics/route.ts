import { NextResponse, NextRequest } from "next/server";
import prisma from "@//lib/prisma";
import { LeadStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { message: "Período de data é obrigatório." },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // --- MUDANÇA ESTRUTURAL: FAZEMOS UMA ÚNICA BUSCA DE LEADS ---
    const dateFilterLeadCreation = { createdAt: { gte: start, lte: end } };
    const leadsInPeriod = await prisma.lead.findMany({
      where: dateFilterLeadCreation,
      select: { status: true },
    });

    // --- A PARTIR DAQUI, TODOS OS CÁLCULOS SÃO FEITOS EM JAVASCRIPT, GARANTINDO CONSISTÊNCIA ---

    // 1. Cálculo da Distribuição de Status (para o Gráfico de Pizza)
    const statusCounts: { [key in LeadStatus]?: number } = {};
    for (const lead of leadsInPeriod) {
      statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
    }
    const statusDistribution = Object.entries(statusCounts).map(
      ([name, value]) => ({
        name: name.replace(/_/g, " "),
        value: value,
      })
    );

    // 2. Cálculo do Funil de Vendas
    const totalLeadsInPeriod = leadsInPeriod.length;
    const verifiedLeadsInPeriod = leadsInPeriod.filter(
      (l) => l.status !== "A_VERIFICAR"
    ).length;
    const contactedLeadsInPeriod = leadsInPeriod.filter((l) =>
      [
        "CONTATADO",
        "AGUARDANDO_RESPOSTA",
        "EM_NEGOCIACAO",
        "CONVERTIDO",
      ].includes(l.status)
    ).length;
    const negotiationLeadsInPeriod = leadsInPeriod.filter((l) =>
      ["EM_NEGOCIACAO", "CONVERTIDO"].includes(l.status)
    ).length;
    const convertedLeadsInPeriod = leadsInPeriod.filter(
      (l) => l.status === "CONVERTIDO"
    ).length;

    // --- DEMAIS MÉTRICAS CONTINUAM IGUAIS ---
    const dateFilterNegocio = { dataFechamento: { gte: start, lte: end } };

    const [financialSummary, dailyPerformance] = await Promise.all([
      prisma.negocio.aggregate({
        where: dateFilterNegocio,
        _sum: {
          valorFechado: true,
          valorEscritorio: true,
          valorOutraParte: true,
          valorRecebido: true,
        },
        _count: { id: true },
      }),
      prisma.$queryRaw`
        SELECT
          day_series.day::date,
          COALESCE(leads_contatados.count, 0) AS "leadsContatados",
          COALESCE(negocios_convertidos.sum, 0) AS "valorConvertido"
        FROM (SELECT generate_series(${start}::date, ${end}::date, '1 day'::interval) AS day) AS day_series
        LEFT JOIN (SELECT DATE_TRUNC('day', "updatedAt") AS day, COUNT(*) AS count FROM "Lead" WHERE "status" = 'CONTATADO' AND "updatedAt" BETWEEN ${start} AND ${end} GROUP BY 1) AS leads_contatados ON day_series.day = leads_contatados.day
        LEFT JOIN (SELECT DATE_TRUNC('day', "dataFechamento") AS day, SUM("valorFechado") AS sum FROM "Negocio" WHERE "dataFechamento" BETWEEN ${start} AND ${end} GROUP BY 1) AS negocios_convertidos ON day_series.day = negocios_convertidos.day
        ORDER BY day_series.day ASC;
      `,
    ]);

    const metrics = {
      statusDistribution,
      financialSummary: {
        totalFechado: financialSummary._sum.valorFechado || 0,
        totalEscritorio: financialSummary._sum.valorEscritorio || 0,
        totalOutraParte: financialSummary._sum.valorOutraParte || 0,
        totalRecebido: financialSummary._sum.valorRecebido || 0,
        quantidadeNegocios: financialSummary._count.id,
      },
      dailyPerformance: (dailyPerformance as any[]).map((d) => ({
        date: new Date(d.day).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
        "Leads Contatados": Number(d.leadsContatados),
        "Valor Convertido": Number(d.valorConvertido) || 0,
      })),
      funnelData: [
        { name: "Novos Leads", value: totalLeadsInPeriod },
        { name: "Verificados", value: verifiedLeadsInPeriod },
        { name: "Contatados", value: contactedLeadsInPeriod },
        { name: "Em Negociação", value: negotiationLeadsInPeriod },
        { name: "Convertidos", value: convertedLeadsInPeriod },
      ],
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Erro ao buscar métricas:", error);
    return NextResponse.json(
      { message: "Erro ao buscar métricas." },
      { status: 500 }
    );
  }
}
