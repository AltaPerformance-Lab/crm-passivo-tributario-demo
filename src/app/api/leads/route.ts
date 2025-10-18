// src/app/api/leads/route.ts (Versão Polida)

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// Importamos o tipo 'Prisma' para uma tipagem mais forte
import { LeadStatus, Prisma } from "@prisma/client";
import { auth } from "../../../../auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const take = 50;
    const skip = (page - 1) * take;
    const sortBy = searchParams.get("sortBy") || "valorTotalDivida";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    // ... outros filtros ...

    // O 'where' agora tem a tipagem correta, o que nos dá autocomplete e segurança
    const where: Prisma.LeadWhereInput = {
      userId: userId,
    };

    const filterConditions: Prisma.LeadWhereInput[] = [];

    if (search) {
      filterConditions.push({
        OR: [
          { nomeDevedor: { contains: search, mode: "insensitive" } },
          { cnpj: { contains: search } },
        ],
      });
    }
    if (status && Object.values(LeadStatus).includes(status as LeadStatus)) {
      filterConditions.push({ status: status as LeadStatus });
    }
    // ... adicione outros filtros aqui no futuro ...

    if (filterConditions.length > 0) {
      where.AND = filterConditions;
    }

    const [leads, total] = await prisma.$transaction([
      prisma.lead.findMany({
        where, // A variável 'where' agora é totalmente tipada
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.lead.count({ where }),
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
