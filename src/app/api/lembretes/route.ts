// src/app/api/lembretes/route.ts (Versão Segura)

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "../../../../auth"; // 1. Importar a autenticação

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // 2. Obter a sessão do usuário logado
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

    const numericLeadId = parseInt(leadId, 10);
    if (isNaN(numericLeadId)) {
      return NextResponse.json(
        { message: "ID do Lead inválido." },
        { status: 400 }
      );
    }

    // 3. VERIFICAÇÃO DE POSSE (O PASSO DE SEGURANÇA)
    // Verificamos se o lead para o qual queremos criar o lembrete
    // realmente pertence ao usuário que está fazendo a requisição.
    const leadPertenceAoUsuario = await prisma.lead.findFirst({
      where: {
        id: numericLeadId,
        userId: userId,
      },
    });

    if (!leadPertenceAoUsuario) {
      return NextResponse.json(
        { message: "Lead não encontrado ou acesso negado." },
        { status: 404 }
      );
    }

    // 4. Se a verificação passar, podemos criar o lembrete com segurança
    const novoLembrete = await prisma.lembrete.create({
      data: {
        leadId: numericLeadId,
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
