// src/app/api/metrics/route.ts (Versão Final Polida)

import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "../../../../auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 1. Definimos um tipo para o resultado da query raw, melhorando a segurança de tipos.
type DailyPerformanceRaw = {
  day: Date;
  leadsContatados: bigint; // queryRaw com COUNT retorna bigint
  valorConvertido: number | null;
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

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

    // --- QUERIES PARA OS CARDS (TOTAIS HISTÓRICOS) ---
    const [totalLeadsGeral, convertedCountGeral, financialSummaryGeral] =
      await Promise.all([
        prisma.lead.count({ where: { userId } }),
        prisma.lead.count({ where: { userId, status: "CONVERTIDO" } }),
        prisma.negocio.aggregate({
          where: { userId },
          _sum: {
            valorFechado: true,
            valorEscritorio: true,
            valorOutraParte: true,
            valorRecebido: true,
          },
          _count: { id: true },
        }),
      ]);
    const conversionRateGeral =
      totalLeadsGeral > 0 ? (convertedCountGeral / totalLeadsGeral) * 100 : 0;

    // --- QUERIES PARA OS GRÁFICOS (PERÍODO) ---
    const whereClauseLeadsPeriodo = {
      userId,
      createdAt: { gte: start, lte: end },
    };

    const [
      statusDistributionPeriodo,
      totalLeadsPeriodo,
      verifiedLeadsPeriodo,
      contactedLeadsPeriodo,
      negotiationLeadsPeriodo,
      convertedLeadsPeriodo,
      dailyPerformance,
    ] = await Promise.all([
      prisma.lead.groupBy({
        by: ["status"],
        where: whereClauseLeadsPeriodo,
        _count: { status: true },
      }),
      prisma.lead.count({ where: whereClauseLeadsPeriodo }),
      prisma.lead.count({
        where: { ...whereClauseLeadsPeriodo, NOT: { status: "A_VERIFICAR" } },
      }),
      prisma.lead.count({
        where: {
          ...whereClauseLeadsPeriodo,
          status: {
            in: [
              "CONTATADO",
              "AGUARDANDO_RESPOSTA",
              "EM_NEGOCIACAO",
              "CONVERTIDO",
            ],
          },
        },
      }),
      prisma.lead.count({
        where: {
          ...whereClauseLeadsPeriodo,
          status: { in: ["EM_NEGOCIACAO", "CONVERTIDO"] },
        },
      }),
      prisma.lead.count({
        where: { ...whereClauseLeadsPeriodo, status: "CONVERTIDO" },
      }),
      // 2. Usamos o tipo para remover o 'as any' e garantir a segurança
      prisma.$queryRaw<DailyPerformanceRaw[]>`
        SELECT
          day_series.day::date,
          COALESCE(leads_contatados.count, 0) AS "leadsContatados",
          COALESCE(negocios_convertidos.sum, 0) AS "valorConvertido"
        FROM (SELECT generate_series(${start}::date, ${end}::date, '1 day'::interval) AS day) AS day_series
        LEFT JOIN (SELECT DATE_TRUNC('day', "updatedAt") AS day, COUNT(*) AS count FROM "Lead" WHERE "userId" = ${userId} AND "status" = 'CONTATADO' AND "updatedAt" BETWEEN ${start} AND ${end} GROUP BY 1) AS leads_contatados ON day_series.day = leads_contatados.day
        LEFT JOIN (SELECT DATE_TRUNC('day', "dataFechamento") AS day, SUM("valorFechado") AS sum FROM "Negocio" WHERE "userId" = ${userId} AND "dataFechamento" BETWEEN ${start} AND ${end} GROUP BY 1) AS negocios_convertidos ON day_series.day = negocios_convertidos.day
        ORDER BY day_series.day ASC;
      `,
    ]);

    // Montando o objeto de resposta final
    const metrics = {
      financialSummary: {
        totalFechado: financialSummaryGeral._sum.valorFechado || 0,
        totalEscritorio: financialSummaryGeral._sum.valorEscritorio || 0,
        totalOutraParte: financialSummaryGeral._sum.valorOutraParte || 0,
        totalRecebido: financialSummaryGeral._sum.valorRecebido || 0,
        quantidadeNegocios: financialSummaryGeral._count.id,
      },
      geral: {
        totalLeads: totalLeadsGeral,
        conversionRate: conversionRateGeral,
        convertedCount: convertedCountGeral,
      },
      statusDistribution: statusDistributionPeriodo.map((item) => ({
        name: item.status.replace(/_/g, " "),
        value: item._count.status,
      })),
      dailyPerformance: dailyPerformance.map((d) => ({
        date: new Date(d.day).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
        "Leads Contatados": Number(d.leadsContatados),
        "Valor Convertido": Number(d.valorConvertido) || 0,
      })),
      funnelData: [
        { name: "Novos Leads", value: totalLeadsPeriodo },
        { name: "Verificados", value: verifiedLeadsPeriodo },
        { name: "Contatados", value: contactedLeadsPeriodo },
        { name: "Em Negociação", value: negotiationLeadsPeriodo },
        { name: "Convertidos", value: convertedLeadsPeriodo },
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
