// src/app/api/leads/import/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Lead } from "@prisma/client";

// Definindo o tipo de dado que esperamos receber
type LeadInput = Omit<Lead, "id" | "createdAt" | "updatedAt">;

export async function POST(request: NextRequest) {
  try {
    const leads: LeadInput[] = await request.json();

    if (!leads || leads.length === 0) {
      return NextResponse.json(
        { message: "Nenhum lead fornecido." },
        { status: 400 }
      );
    }

    // Usamos uma transação para fazer todos os 'upserts' de uma vez.
    // Isso é muito mais performático do que um loop com chamadas individuais.
    const transaction = leads.map((lead) =>
      prisma.lead.upsert({
        where: { cnpj: lead.cnpj },
        update: {
          nomeDevedor: lead.nomeDevedor,
          nomeFantasia: lead.nomeFantasia,
          valorTotalDivida: lead.valorTotalDivida,
        },
        create: {
          cnpj: lead.cnpj,
          nomeDevedor: lead.nomeDevedor,
          nomeFantasia: lead.nomeFantasia,
          valorTotalDivida: lead.valorTotalDivida,
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
