// src/app/api/lembretes/route.ts (Versão Segura com ID String)

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "../../../../auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    const { leadId, descricao, data } = await request.json();

    if (!leadId || !descricao || !data) {
      return NextResponse.json(
        { message: "ID do Lead, descrição e data são obrigatórios." },
        { status: 400 }
      );
    }

    // O leadId já é uma string, não precisamos mais do parseInt.

    // VERIFICAÇÃO DE POSSE (O PASSO DE SEGURANÇA)
    const leadPertenceAoUsuario = await prisma.lead.findFirst({
      where: {
        id: leadId, // Usamos a string diretamente
        userId: userId,
      },
    });

    if (!leadPertenceAoUsuario) {
      return NextResponse.json(
        { message: "Lead não encontrado ou acesso negado." },
        { status: 404 }
      );
    }

    // Se a verificação passar, podemos criar o lembrete com segurança
    const novoLembrete = await prisma.lembrete.create({
      data: {
        leadId: leadId, // Usamos a string diretamente
        descricao: descricao,
        data: new Date(data),
      },
    });

    return NextResponse.json(novoLembrete, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar lembrete:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
