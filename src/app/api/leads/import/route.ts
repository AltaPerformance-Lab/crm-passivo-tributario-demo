// src/app/api/leads/import/route.ts (Versão Segura e Corrigida)

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "../../../../../auth"; // 1. Importamos a função de autenticação

import type { Lead } from "@prisma/client";

type LeadInput = Omit<Lead, "id" | "createdAt" | "updatedAt" | "userId">;

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // Adicionamos a verificação de segurança no início da função
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const leads: LeadInput[] = await request.json();

    if (!leads || leads.length === 0) {
      return NextResponse.json(
        { message: "Nenhum lead fornecido." },
        { status: 400 }
      );
    }

    // Modificamos a transação para incluir o userId em cada operação
    const transaction = leads.map((lead) =>
      prisma.lead.upsert({
        where: {
          // A verificação agora é composta: o CNPJ + o ID do usuário
          cnpj_userId: {
            cnpj: lead.cnpj,
            userId: userId,
          },
        },
        update: {
          nomeDevedor: lead.nomeDevedor,
          nomeFantasia: lead.nomeFantasia,
          valorTotalDivida: lead.valorTotalDivida,
        },
        create: {
          // Ao criar um novo lead, associamos ele ao usuário logado
          cnpj: lead.cnpj,
          nomeDevedor: lead.nomeDevedor,
          nomeFantasia: lead.nomeFantasia,
          valorTotalDivida: lead.valorTotalDivida,
          userId: userId, // <-- A LINHA ESSENCIAL
        },
      })
    );

    const result = await prisma.$transaction(transaction);

    return NextResponse.json({
      message: `${result.length} leads processados com sucesso.`,
    });
  } catch (error) {
    console.error("Erro na importação em massa:", error);
    return NextResponse.json(
      { message: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}
