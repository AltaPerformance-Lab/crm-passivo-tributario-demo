import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "../../../../../auth";
import { del } from "@vercel/blob"; // 1. Importamos a função 'del' do Vercel Blob

// Removemos as importações de 'fs/promises' e 'path'
// import { unlink } from "fs/promises";
// import path from "path";

export const runtime = "nodejs";

// Função DELETE para apagar uma proposta específica
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 2. Verificamos se o utilizador está autenticado
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const proposalId = parseInt(params.id, 10);

    // 3. Primeiro, encontramos a proposta no banco de dados para obter a URL do ficheiro
    const proposal = await prisma.proposta.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) {
      return NextResponse.json(
        { message: "Proposta não encontrada." },
        { status: 404 }
      );
    }

    // 4. Se a proposta tiver um ficheiro associado, apagamo-lo do Vercel Blob
    // A função 'del' aceita a URL completa do blob.
    if (proposal.caminhoArquivo) {
      try {
        await del(proposal.caminhoArquivo);
      } catch (fileError) {
        // Se o ficheiro não existir no Blob, apenas registamos o aviso mas continuamos
        console.warn(
          `Ficheiro não encontrado no Blob para apagar: ${proposal.caminhoArquivo}`,
          fileError
        );
      }
    }

    // 5. Depois de apagar o ficheiro (ou se não houver ficheiro), apagamos o registo do banco de dados
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
