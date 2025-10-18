// src/app/api/config/route.ts (Versão Final Corrigida)

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "../../../../auth";

export const runtime = "nodejs";

// Função GET: Busca a configuração do USUÁRIO LOGADO
export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const config = await prisma.configuracao.upsert({
      where: {
        userId: userId,
      },
      update: {},
      create: {
        userId: userId,
        nomeEmpresa: "Minha Consultoria",
        cnpj: "XX.XXX.XXX/0001-XX",
        endereco: "Meu Endereço Completo",
        // CORREÇÃO APLICADA AQUI
        email: session?.user?.email || "contato@email.com",
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

// Função PUT: Atualiza a configuração do USUÁRIO LOGADO
export async function PUT(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data = await request.json();
    const { id, userId: dataUserId, ...updateData } = data;

    const updatedConfig = await prisma.configuracao.update({
      where: {
        userId: userId,
      },
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
