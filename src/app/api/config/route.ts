// src/app/api/config/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ADICIONADO: Força a rota a usar o runtime do Node.js
export const runtime = "nodejs";

// Função GET: Busca a configuração atual no banco de dados
export async function GET() {
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

// Função PUT: Atualiza a configuração no banco de dados
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
