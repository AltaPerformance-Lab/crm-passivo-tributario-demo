// src/app/api/leads/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { LeadStatus } from "@prisma/client";
import { auth } from "../../../../../auth"; // Importa a função de autenticação

export const runtime = "nodejs";

// CORRIGIDO: Assinatura da função mudada para usar 'context' para tipagem correta do Next.js
export async function PATCH(
  request: Request,
  context: { params: { id: string } } // Tipagem correta para rotas dinâmicas
) {
  try {
    // 1. Validação de Autenticação
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json(
        { message: "Acesso negado. Usuário não autenticado." },
        { status: 401 } // 401 Unauthorized
      );
    }

    // Acessa o ID via context.params
    const leadId = parseInt(context.params.id, 10);
    const body = await request.json();
    const { status } = body;

    // Validação 1: O status foi enviado?
    if (!status) {
      return NextResponse.json(
        { message: "Novo status é obrigatório." },
        { status: 400 }
      );
    }

    // Validação 2: O status é um dos valores válidos do nosso Enum?
    const validStatuses = Object.keys(LeadStatus);
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          message: `Status '${status}' é inválido. Valores válidos: ${validStatuses.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // 2. Atualiza o lead no banco de dados, GARANTINDO PROPRIEDADE
    const updatedLead = await prisma.lead.update({
      where: {
        id: leadId,
        userId: userId, // CRÍTICO: Garante que o lead pertence ao usuário logado
      },
      data: { status: status as LeadStatus }, // TypeScript agora aceita o status validado
    });

    return NextResponse.json(updatedLead, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar o status do lead:", error);

    // Tratamento específico para erros do Prisma (ex: lead não encontrado ou não pertence)
    if (error instanceof Error && "code" in error && error.code === "P2025") {
      return NextResponse.json(
        { message: "Lead não encontrado ou acesso negado." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Erro interno no servidor ao atualizar o status do lead." },
      { status: 500 }
    );
  }
}
