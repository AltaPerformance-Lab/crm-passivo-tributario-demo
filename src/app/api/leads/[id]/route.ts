import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { LeadStatus } from "@prisma/client";
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
      return NextResponse.json(
        { message: "Acesso negado. Usuário não autenticado." },
        { status: 401 }
      );
    }

    // 1. O ID agora é uma string, removemos o parseInt
    const leadId = params.id;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { message: "Novo status é obrigatório." },
        { status: 400 }
      );
    }

    const validStatuses = Object.values(LeadStatus); // Usamos Object.values para o enum
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { message: `Status '${status}' é inválido.` },
        { status: 400 }
      );
    }

    // 2. VERIFICAÇÃO DE POSSE: Primeiro, garantimos que o lead pertence ao usuário
    const leadToUpdate = await prisma.lead.findFirst({
      where: {
        id: leadId,
        userId: userId,
      },
    });

    if (!leadToUpdate) {
      return NextResponse.json(
        { message: "Lead não encontrado ou acesso negado." },
        { status: 404 }
      );
    }

    // 3. Se a verificação passar, fazemos a atualização com segurança
    const updatedLead = await prisma.lead.update({
      where: {
        id: leadId, // Agora podemos usar o ID único com segurança
      },
      data: { status: status as LeadStatus },
    });

    return NextResponse.json(updatedLead, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar o status do lead:", error);

    // O catch genérico já é suficiente agora
    return NextResponse.json(
      { message: "Erro interno no servidor ao atualizar o status do lead." },
      { status: 500 }
    );
  }
}
