// src/app/api/deals/[id]/route.ts (Versão Segura)

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "../../../../../auth"; // 1. Importar a autenticação
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 2. Obter a sessão e o ID do usuário logado
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    const dealId = parseInt(params.id, 10);
    if (isNaN(dealId)) {
      return NextResponse.json({ message: "ID inválido." }, { status: 400 });
    }

    const { valorFechado, valorEscritorio, valorOutraParte, valorRecebido } =
      await request.json();

    // 3. FAZER O UPDATE COM A VERIFICAÇÃO DE POSSE EMBUTIDA
    // O 'where' agora exige que o ID do negócio E o ID do usuário correspondam.
    // Se um usuário tentar atualizar o negócio de outro, o Prisma não encontrará
    // o registro e lançará um erro, que será capturado pelo catch.
    const updatedDeal = await prisma.negocio.update({
      where: {
        id: dealId,
        userId: userId, // <-- A VERIFICAÇÃO DE SEGURANÇA ACONTECE AQUI!
      },
      data: {
        valorFechado,
        valorEscritorio,
        valorOutraParte,
        valorRecebido,
      },
    });

    return NextResponse.json(updatedDeal);
  } catch (error) {
    console.error("Erro ao atualizar negócio:", error);

    // Tratamento de erro específico do Prisma para "registro não encontrado"
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { message: "Negócio não encontrado ou acesso negado." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Erro interno no servidor ao atualizar negócio." },
      { status: 500 }
    );
  }
}
