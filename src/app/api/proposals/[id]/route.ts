// src/app/api/proposals/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

// Função DELETE: para apagar uma proposta
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const propostaId = parseInt(params.id, 10);

    // 1. Encontrar a proposta para obter o caminho do arquivo
    const proposta = await prisma.proposta.findUnique({
      where: { id: propostaId },
    });

    if (!proposta) {
      return NextResponse.json(
        { message: "Proposta não encontrada." },
        { status: 404 }
      );
    }

    // 2. Se houver um arquivo associado, apague-o do servidor
    if (proposta.caminhoArquivo) {
      const filePath = path.join(
        process.cwd(),
        "public",
        proposta.caminhoArquivo
      );
      try {
        await unlink(filePath);
      } catch (fileError) {
        // Se o arquivo não existir, apenas loga o erro, mas continua para apagar do banco
        console.warn(
          `Arquivo não encontrado para deletar: ${filePath}`,
          fileError
        );
      }
    }

    // 3. Apagar o registro da proposta do banco de dados
    await prisma.proposta.delete({
      where: { id: propostaId },
    });

    return NextResponse.json(
      { message: "Proposta deletada com sucesso." },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Erro ao deletar proposta ${params.id}:`, error);
    return NextResponse.json(
      { message: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
