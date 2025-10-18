// src/app/api/lembretes/upcoming/route.ts (Versão Segura)

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "../../../../../auth"; // 1. Importar a autenticação

export const runtime = "nodejs";

export async function GET() {
  try {
    // 2. Obter a sessão do usuário logado
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 3. Adicionar o filtro de usuário à busca no banco de dados
    const upcomingReminders = await prisma.lembrete.findMany({
      where: {
        concluido: false, // Busca apenas os lembretes pendentes
        lead: {
          userId: userId, // CRÍTICO: Filtra apenas lembretes de leads que pertencem ao usuário logado
        },
      },
      orderBy: {
        data: "asc", // Ordena pelo mais próximo
      },
      take: 5, // Boa prática: Limita a um número razoável de resultados
      include: {
        // Inclui o nome e o ID do lead para podermos criar um link
        lead: {
          select: {
            id: true,
            nomeDevedor: true,
          },
        },
      },
    });

    return NextResponse.json(upcomingReminders);
  } catch (error) {
    console.error("Erro ao buscar próximos lembretes:", error);
    return NextResponse.json(
      { message: "Erro interno ao buscar lembretes." },
      { status: 500 }
    );
  }
}
