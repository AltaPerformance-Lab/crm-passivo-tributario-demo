// src/app/api/config/upload-logo/route.ts (Versão Segura)

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { put } from "@vercel/blob";
import { auth } from "../../../../../auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json(
        { message: "Nenhum arquivo de logo enviado." },
        { status: 400 }
      );
    }

    // Criamos um nome de arquivo único para o usuário para evitar colisões
    const filename = `logo-${userId}.${file.name.split(".").pop()}`;

    const blob = await put(filename, file, {
      access: "public",
      // addRandomSuffix: false é ótimo para garantir que o logo do usuário seja sempre substituído
      addRandomSuffix: false,
    });

    // CORREÇÃO: Atualizamos a configuração do usuário logado
    await prisma.configuracao.update({
      where: {
        userId: userId, // Usamos o userId da sessão para encontrar o registro correto
      },
      data: {
        logoUrl: blob.url,
      },
    });

    return NextResponse.json(
      { success: true, logoUrl: blob.url },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro no upload da logo:", error);
    return NextResponse.json(
      { message: "Erro interno no servidor ao fazer upload." },
      { status: 500 }
    );
  }
}
