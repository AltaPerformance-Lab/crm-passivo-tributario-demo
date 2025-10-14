// src/app/api/contacts/route.ts

import { NextResponse } from "next/server";
import prisma from "@//lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, cargo, telefone, email, observacao, empresaId } = body;

    // Validações básicas
    if (!nome || !empresaId) {
      return NextResponse.json(
        { message: "Nome e ID da Empresa são obrigatórios." },
        { status: 400 }
      );
    }

    const newContact = await prisma.contato.create({
      data: {
        nome,
        cargo,
        telefone,
        email,
        observacao,
        empresa: {
          connect: { id: empresaId },
        },
      },
    });

    return NextResponse.json(newContact, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar contato:", error);
    return NextResponse.json(
      { message: "Erro interno no servidor ao criar contato." },
      { status: 500 }
    );
  }
}
