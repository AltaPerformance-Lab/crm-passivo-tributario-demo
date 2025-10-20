// src/app/api/proposals/[id]/route.ts (Versão Segura com ID String)

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "../../../../../auth";
import { del } from "@vercel/blob";

export const runtime = "nodejs";

// Função DELETE para apagar uma proposta específica de forma segura
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    // 1. O ID agora é uma string, removemos o parseInt
    const proposalId = params.id;

    // VERIFICAÇÃO DE POSSE: Buscamos a proposta garantindo que ela
    // pertence a um negócio do usuário logado.
    const proposal = await prisma.proposta.findFirst({
      where: {
        id: proposalId, // Usa a string diretamente
        negocio: {
          userId: userId,
        },
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { message: "Proposta não encontrada ou acesso negado." },
        { status: 404 }
      );
    }

    // Se a proposta tiver um arquivo associado, apagamo-lo do Vercel Blob
    if (proposal.caminhoArquivo) {
      try {
        await del(proposal.caminhoArquivo);
      } catch (fileError) {
        console.warn(
          `Arquivo não encontrado no Blob para apagar (mas a operação continuará): ${proposal.caminhoArquivo}`,
          fileError
        );
      }
    }

    // Agora, com a certeza de que a proposta pertence ao usuário, apagamos o registro
    await prisma.proposta.delete({
      where: { id: proposalId }, // Usa a string diretamente
    });

    return NextResponse.json(
      { message: "Proposta apagada com sucesso." },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Erro ao apagar proposta ${params.id}:`, error);
    return NextResponse.json(
      { message: "Erro interno ao apagar a proposta." },
      { status: 500 }
    );
  }
}
