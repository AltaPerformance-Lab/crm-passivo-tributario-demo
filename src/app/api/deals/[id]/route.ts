// src/app/api/deals/[id]/route.ts (Versão Segura com ID String)

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "../../../../../auth";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    // 1. O ID agora é uma string, removemos o parseInt
    const dealId = params.id;

    const { valorFechado, valorEscritorio, valorOutraParte, valorRecebido } =
      await request.json();

    // 2. VERIFICAÇÃO DE POSSE: Primeiro, garantimos que o negócio pertence ao usuário
    const dealToUpdate = await prisma.negocio.findFirst({
      where: {
        id: dealId,
        userId: userId,
      },
    });

    if (!dealToUpdate) {
      return NextResponse.json(
        { message: "Negócio não encontrado ou acesso negado." },
        { status: 404 }
      );
    }

    // 3. Se a verificação passar, fazemos a atualização com segurança
    const updatedDeal = await prisma.negocio.update({
      where: {
        id: dealId, // Agora podemos usar o ID único com segurança
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
    // Um catch genérico é suficiente aqui, pois já tratamos o caso "não encontrado".
    return NextResponse.json(
      { message: "Erro interno no servidor ao atualizar negócio." },
      { status: 500 }
    );
  }
}
