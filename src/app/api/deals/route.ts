// src/app/api/deals/route.ts (Versão Segura)

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "../../../../auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await auth();
    // Usamos o tipo correto para ter autocomplete e segurança, sem 'as any'
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { message: "Acesso negado. O usuário deve estar autenticado." },
        { status: 401 }
      );
    }

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

    // ==========================================================
    //          VERIFICAÇÃO DE POSSE DO LEAD (SEGURANÇA)
    // ==========================================================
    const leadPertenceAoUsuario = await prisma.lead.findFirst({
      where: {
        id: leadId,
        userId: userId, // Verifica se o lead pertence ao usuário logado
      },
    });

    if (!leadPertenceAoUsuario) {
      return NextResponse.json(
        { message: "Lead não encontrado ou não pertence a este usuário." },
        { status: 404 }
      );
    }
    // ==========================================================

    const newDeal = await prisma.negocio.create({
      data: {
        valorFechado: valorFechado || 0,
        valorEscritorio: valorEscritorio || 0,
        valorOutraParte: valorOutraParte || 0,
        valorRecebido: valorRecebido || 0,
        // Conecta o novo negócio ao Lead existente
        lead: {
          connect: {
            id: leadId,
          },
        },
        // Conecta o novo negócio ao Usuário autenticado
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });

    return NextResponse.json(newDeal, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar negócio:", error);
    return NextResponse.json(
      { message: "Erro interno no servidor ao criar negócio." },
      { status: 500 }
    );
  }
}
