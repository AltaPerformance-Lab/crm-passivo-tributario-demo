import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

// Função PATCH: agora atualiza tanto 'concluido' quanto a 'data'
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lembreteId = parseInt(params.id, 10);
    const body = await request.json();

    // Prepara os dados para atualização, permitindo que apenas um dos campos seja enviado
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

// Função DELETE: permanece a mesma
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lembreteId = parseInt(params.id, 10);

    await prisma.lembrete.delete({
      where: { id: lembreteId },
    });

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
