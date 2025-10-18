// src/app/api/contacts/[id]/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "../../../../../auth";

export const runtime = "nodejs";

// Função utilitária para verificar se o contato pertence ao usuário logado
async function checkContactOwnership(contactId: number, userId: string) {
  const contact = await prisma.contato.findUnique({
    where: {
      id: contactId,
    },
    select: {
      empresa: {
        select: {
          lead: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!contact || contact.empresa?.lead?.userId !== userId) {
    return false;
  }
  return true;
}

// Função PATCH para ATUALIZAR um contato existente
export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json(
        { message: "Acesso negado. Usuário não autenticado." },
        { status: 401 }
      );
    }

    const contactId = parseInt(context.params.id, 10);
    const body = await request.json();
    const { nome, cargo, telefone, email, observacao } = body;

    if (!nome) {
      return NextResponse.json(
        { message: "O nome é obrigatório." },
        { status: 400 }
      );
    }

    if (!(await checkContactOwnership(contactId, userId))) {
      return NextResponse.json(
        { message: "Contato não encontrado ou acesso negado." },
        { status: 404 }
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
  context: { params: { id: string } }
) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json(
        { message: "Acesso negado. Usuário não autenticado." },
        { status: 401 }
      );
    }

    const contactId = parseInt(context.params.id, 10);

    if (!(await checkContactOwnership(contactId, userId))) {
      return NextResponse.json(
        { message: "Contato não encontrado ou acesso negado." },
        { status: 404 }
      );
    }

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
