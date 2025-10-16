import { NextRequest, NextResponse } from "next/server";

// Deixamos o prisma comentado para o teste
// import prisma from "@/lib/prisma";

// Mantemos o runtime para consistência
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // Todo o código original foi comentado para o teste.
  // Apenas retornamos uma resposta simples.
  return NextResponse.json({ message: "Teste de build da API de Atividades" });

  /*
  try {
    const { leadId, conteudo } = await request.json();

    if (!leadId || !conteudo) {
      return NextResponse.json(
        { message: "ID do Lead e conteúdo são obrigatórios." },
        { status: 400 }
      );
    }

    const novaAtividade = await prisma.atividade.create({
      data: {
        leadId: parseInt(leadId, 10),
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
  */
}
