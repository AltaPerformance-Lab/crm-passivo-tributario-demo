// src/app/api/lembretes/upcoming/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const upcomingReminders = await prisma.lembrete.findMany({
      where: {
        concluido: false, // Busca apenas os lembretes pendentes
      },
      orderBy: {
        data: "asc", // Ordena pelo mais próximo
      },
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
