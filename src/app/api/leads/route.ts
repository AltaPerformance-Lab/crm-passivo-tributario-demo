import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { LeadStatus } from "@prisma/client";

// --- CORREÇÃO: Força a rota a ser sempre dinâmica ---
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Agora usamos request.nextUrl.searchParams que é compatível com builds de produção
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const take = 50;
    const skip = (page - 1) * take;
    const sortBy = searchParams.get("sortBy") || "valorTotalDivida";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const city = searchParams.get("city");
    const uf = searchParams.get("uf");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = { AND: [] };
    if (search) {
      where.AND.push({
        OR: [
          { nomeDevedor: { contains: search, mode: "insensitive" } },
          { cnpj: { contains: search } },
        ],
      });
    }
    if (status && Object.values(LeadStatus).includes(status as LeadStatus)) {
      where.AND.push({ status: status as LeadStatus });
    }
    if (uf) {
      where.AND.push({ empresa: { uf: uf } });
    }
    if (city) {
      where.AND.push({ empresa: { municipio: city } });
    }
    if (startDate && endDate) {
      where.AND.push({
        updatedAt: { gte: new Date(startDate), lte: new Date(endDate) },
      });
    }
    if (where.AND.length === 0) {
      delete where.AND;
    }

    const [leads, total] = await prisma.$transaction([
      prisma.lead.findMany({
        where: where,
        skip: skip,
        take: take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.lead.count({ where: where }),
    ]);

    return NextResponse.json({
      data: leads,
      total: total,
      totalPages: Math.ceil(total / take),
    });
  } catch (error) {
    console.error("Erro ao buscar leads:", error);
    return NextResponse.json(
      { message: "Erro ao buscar leads." },
      { status: 500 }
    );
  }
}
