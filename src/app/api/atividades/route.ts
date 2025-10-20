// src/app/api/atividades/route.ts (Versão Corrigida com ID String)

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

    const { leadId, conteudo } = await request.json();

    if (!leadId || !conteudo) {
      return NextResponse.json(
        { message: "ID do Lead e conteúdo são obrigatórios." },
        { status: 400 }
      );
    }

    // A validação do ID agora é feita no Prisma, não precisamos de parseInt.
    // O leadId já é uma string.

    // VERIFICAÇÃO DE POSSE (O PASSO DE SEGURANÇA)
    const leadPertenceAoUsuario = await prisma.lead.findFirst({
      where: {
        id: leadId, // Passamos a string diretamente
        userId: userId,
      },
    });

    if (!leadPertenceAoUsuario) {
      return NextResponse.json(
        { message: "Lead não encontrado ou acesso negado." },
        { status: 404 }
      );
    }

    // Se a verificação passar, podemos criar a atividade com segurança
    const novaAtividade = await prisma.atividade.create({
      data: {
        leadId: leadId, // Passamos a string diretamente
        conteudo: conteudo,
      },
    });

    return NextResponse.json(novaAtividade, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar atividade:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
