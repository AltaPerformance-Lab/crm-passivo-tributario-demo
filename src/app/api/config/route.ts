// src/app/api/config/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

// Função GET: Busca a configuração atual no banco de dados
export async function GET() {
  // --- INÍCIO DO CÓDIGO DE DEPURAÇÃO ---
  // Vamos imprimir a variável de ambiente para ver o que a Vercel está realmente a fornecer.
  console.log("--- INICIANDO TESTE DE VARIÁVEL DE AMBIENTE ---");
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error(
      "ERRO CRÍTICO: A variável DATABASE_URL está indefinida ou vazia!"
    );
  } else {
    console.log("DATABASE_URL recebida:", databaseUrl);
    // Vamos verificar se a string é válida
    if (databaseUrl.startsWith("postgresql://")) {
      console.log("Validação do protocolo: OK");
    } else {
      console.error(
        "Validação do protocolo: FALHOU! A URL não começa com 'postgresql://'"
      );
    }
  }
  console.log("--- FIM DO TESTE DE VARIÁVEL DE AMBIENTE ---");
  // --- FIM DO CÓDIGO DE DEPURAÇÃO ---

  try {
    const config = await prisma.configuracao.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        nomeEmpresa: "Nome da Sua Empresa",
        cnpj: "XX.XXX.XXX/0001-XX",
        endereco: "Seu Endereço Completo",
        email: "contato@seuemail.com",
        telefone: "(XX) XXXXX-XXXX",
      },
    });
    return NextResponse.json(config);
  } catch (error) {
    console.error("Erro ao buscar configuração:", error);
    return NextResponse.json(
      { message: "Erro ao buscar configuração" },
      { status: 500 }
    );
  }
}

// A função PUT permanece a mesma
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;

    const updatedConfig = await prisma.configuracao.update({
      where: { id: 1 },
      data: updateData,
    });
    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error("Erro ao atualizar configuração:", error);
    return NextResponse.json(
      { message: "Erro ao atualizar configuração" },
      { status: 500 }
    );
  }
}
