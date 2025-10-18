// src/app/api/contacts/route.ts (Versão Segura)

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "../../../../auth"; // 1. Importar a autenticação

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // 2. Obter a sessão do usuário logado
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    const body = await request.json();
    const { nome, cargo, telefone, email, observacao, empresaId } = body;

    // Validações básicas
    if (!nome || !empresaId) {
      return NextResponse.json(
        { message: "Nome e ID da Empresa são obrigatórios." },
        { status: 400 }
      );
    }

    // 3. VERIFICAÇÃO DE POSSE (O PASSO DE SEGURANÇA)
    // Verificamos se existe uma empresa com este ID E se ela está
    // ligada a um lead que pertence ao usuário logado.
    const empresaPertenceAoUsuario = await prisma.empresa.findFirst({
      where: {
        id: empresaId,
        lead: {
          userId: userId,
        },
      },
    });

    if (!empresaPertenceAoUsuario) {
      return NextResponse.json(
        { message: "Empresa não encontrada ou acesso negado." },
        { status: 404 } // Usamos 404 para não vazar informação de que a empresa existe
      );
    }

    // 4. Se a verificação passar, podemos criar o contato com segurança
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
