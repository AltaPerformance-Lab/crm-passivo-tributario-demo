// src/app/api/leads/[id]/route.ts

import { NextResponse } from "next/server";
import prisma from "@//lib/prisma";
import { LeadStatus } from "@prisma/client"; // Importa o Enum LeadStatus do Prisma

// A função PATCH recebe 'params' para pegar o ID da URL
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = parseInt(params.id, 10);
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
    if (!Object.values(LeadStatus).includes(status)) {
      return NextResponse.json(
        { message: `Status '${status}' é inválido.` },
        { status: 400 }
      );
    }

    // Atualiza o lead no banco de dados
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: { status: status },
    });

    return NextResponse.json(updatedLead, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Erro ao atualizar o status do lead." },
      { status: 500 }
    );
  }
}
