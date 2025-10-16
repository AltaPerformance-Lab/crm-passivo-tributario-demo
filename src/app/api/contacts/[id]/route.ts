// src/app/api/contacts/[id]/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

// Função PATCH para ATUALIZAR um contato existente
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = parseInt(params.id, 10);
    const body = await request.json();
    const { nome, cargo, telefone, email, observacao } = body;

    if (!nome) {
      return NextResponse.json(
        { message: "O nome é obrigatório." },
        { status: 400 }
      );
    }

    const updatedContact = await prisma.contato.update({
      where: { id: contactId },
      data: {
        nome,
        cargo,
        telefone,
        email,
        observacao,
      },
    });

    return NextResponse.json(updatedContact, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar contato:", error);
    return NextResponse.json(
      { message: "Erro interno no servidor ao atualizar contato." },
      { status: 500 }
    );
  }
}

// Função DELETE para APAGAR um contato (já existente)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = parseInt(params.id, 10);

    await prisma.contato.delete({
      where: { id: contactId },
    });

    return NextResponse.json(
      { message: "Contato apagado com sucesso." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao apagar contato:", error);
    return NextResponse.json(
      { message: "Erro interno no servidor ao apagar contato." },
      { status: 500 }
    );
  }
}
