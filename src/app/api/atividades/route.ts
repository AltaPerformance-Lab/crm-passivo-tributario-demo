// src/app/api/atividades/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
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
}
