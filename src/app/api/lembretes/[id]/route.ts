// src/app/api/lembretes/[id]/route.ts (Versão Segura com ID String)

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "../../../../../auth";

export const runtime = "nodejs";

// Função PATCH: agora atualiza 'concluido' ou a 'data' de forma segura
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    // 1. O ID agora é uma string, removemos o parseInt e a verificação isNaN
    const lembreteId = params.id;

    // VERIFICAÇÃO DE POSSE: Checamos se o lembrete pertence a um lead do usuário
    const lembrete = await prisma.lembrete.findFirst({
      where: {
        id: lembreteId, // Usa a string diretamente
        lead: {
          userId: userId,
        },
      },
    });

    if (!lembrete) {
      return NextResponse.json(
        { message: "Lembrete não encontrado ou acesso negado." },
        { status: 404 }
      );
    }

    // Se a checagem passou, podemos continuar com a atualização
    const body = await request.json();
    const dataToUpdate: { concluido?: boolean; data?: Date } = {};
    if (body.concluido !== undefined) {
      dataToUpdate.concluido = body.concluido;
    }
    if (body.data) {
      dataToUpdate.data = new Date(body.data);
    }

    const lembreteAtualizado = await prisma.lembrete.update({
      where: { id: lembreteId },
      data: dataToUpdate,
    });

    return NextResponse.json(lembreteAtualizado);
  } catch (error) {
    console.error(`Erro ao atualizar lembrete ${params.id}:`, error);
    return NextResponse.json(
      { message: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

// Função DELETE: agora apaga o lembrete de forma segura
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    // 2. O ID agora é uma string, removemos o parseInt e a verificação isNaN
    const lembreteId = params.id;

    // VERIFICAÇÃO DE POSSE EMBUTIDA NO DELETE
    const deleteResult = await prisma.lembrete.deleteMany({
      where: {
        id: lembreteId, // Usa a string diretamente
        lead: {
          userId: userId,
        },
      },
    });

    if (deleteResult.count === 0) {
      return NextResponse.json(
        { message: "Lembrete não encontrado ou acesso negado." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Lembrete deletado com sucesso." },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Erro ao deletar lembrete ${params.id}:`, error);
    return NextResponse.json(
      { message: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
