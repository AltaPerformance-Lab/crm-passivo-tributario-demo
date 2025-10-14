// src/app/api/lembretes/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@//lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { leadId, descricao, data } = await request.json();

    if (!leadId || !descricao || !data) {
      return NextResponse.json(
        { message: "ID do Lead, descrição and data são obrigatórios." },
        { status: 400 }
      );
    }

    const novoLembrete = await prisma.lembrete.create({
      data: {
        leadId: parseInt(leadId, 10),
        descricao: descricao,
        data: new Date(data),
      },
    });

    return NextResponse.json(novoLembrete, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar lembrete:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
