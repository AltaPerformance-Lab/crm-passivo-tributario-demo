// src/app/api/proposals/[id]/route.ts (Versão Segura)

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
  // Obtemos o ID do usuário da sessão
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const proposalId = parseInt(params.id, 10);
    if (isNaN(proposalId)) {
      return NextResponse.json(
        { message: "ID da proposta inválido." },
        { status: 400 }
      );
    }

    // VERIFICAÇÃO DE POSSE: Buscamos a proposta garantindo que ela
    // pertence a um negócio do usuário logado.
    const proposal = await prisma.proposta.findFirst({
      where: {
        id: proposalId,
        negocio: {
          userId: userId, // <-- A verificação de segurança acontece aqui
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
      where: { id: proposalId },
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
