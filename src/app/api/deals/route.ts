// src/app/api/deals/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const {
      leadId,
      valorFechado,
      valorEscritorio,
      valorOutraParte,
      valorRecebido,
    } = await request.json();
    if (!leadId) {
      return NextResponse.json(
        { message: "ID do Lead é obrigatório." },
        { status: 400 }
      );
    }

    const newDeal = await prisma.negocio.create({
      data: {
        leadId: leadId,
        valorFechado: valorFechado || 0,
        valorEscritorio: valorEscritorio || 0,
        valorOutraParte: valorOutraParte || 0,
        valorRecebido: valorRecebido || 0,
      },
    });
    return NextResponse.json(newDeal, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Erro ao criar negócio." },
      { status: 500 }
    );
  }
}
