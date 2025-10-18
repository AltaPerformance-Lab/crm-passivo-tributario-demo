// Caminho inferido: src/app/api/proposals/upload/route.ts (Versão Segura)

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { put } from "@vercel/blob";
import { auth } from "../../../../../auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("proposal") as File | null;
    const negocioIdString = formData.get("negocioId") as string | null;

    if (!file || !negocioIdString) {
      return NextResponse.json(
        { message: "Arquivo da proposta e ID do negócio são obrigatórios." },
        { status: 400 }
      );
    }

    const negocioId = parseInt(negocioIdString, 10);
    if (isNaN(negocioId)) {
      return NextResponse.json(
        { message: "ID do negócio inválido." },
        { status: 400 }
      );
    }

    // ==========================================================
    //          VERIFICAÇÃO DE POSSE DO NEGÓCIO (SEGURANÇA)
    // ==========================================================
    const negocioPertenceAoUsuario = await prisma.negocio.findFirst({
      where: {
        id: negocioId,
        userId: userId, // Verifica se o negócio pertence ao usuário logado
      },
    });

    if (!negocioPertenceAoUsuario) {
      return NextResponse.json(
        { message: "Negócio não encontrado ou acesso negado." },
        { status: 404 }
      );
    }
    // ==========================================================

    // Se a verificação passar, continuamos com o upload e criação
    const filename = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;

    const blob = await put(filename, file, {
      access: "public",
    });

    const novaProposta = await prisma.proposta.create({
      data: {
        negocioId: negocioId,
        caminhoArquivo: blob.url,
        nomeArquivo: file.name,
      },
    });

    return NextResponse.json(novaProposta, { status: 201 });
  } catch (error) {
    console.error("Erro no upload da proposta:", error);
    return NextResponse.json(
      { message: "Erro interno no servidor ao fazer upload." },
      { status: 500 }
    );
  }
}
