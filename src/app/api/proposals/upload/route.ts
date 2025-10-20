// src/app/api/proposals/upload/route.ts (Versão Segura com ID String)

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
    const negocioId = formData.get("negocioId") as string | null; // Já recebemos como string

    if (!file || !negocioId) {
      return NextResponse.json(
        { message: "Arquivo da proposta e ID do negócio são obrigatórios." },
        { status: 400 }
      );
    }

    // O ID já é uma string, não precisamos de parseInt nem isNaN.

    // ==========================================================
    //          VERIFICAÇÃO DE POSSE DO NEGÓCIO (SEGURANÇA)
    // ==========================================================
    const negocioPertenceAoUsuario = await prisma.negocio.findFirst({
      where: {
        id: negocioId, // Usamos a string diretamente
        userId: userId,
      },
    });

    if (!negocioPertenceAoUsuario) {
      return NextResponse.json(
        { message: "Negócio não encontrado ou acesso negado." },
        { status: 404 }
      );
    }
    // ==========================================================

    const filename = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;

    const blob = await put(filename, file, {
      access: "public",
    });

    const novaProposta = await prisma.proposta.create({
      data: {
        negocioId: negocioId, // Usamos a string diretamente
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
