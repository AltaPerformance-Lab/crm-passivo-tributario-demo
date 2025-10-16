// src/app/api/config/upload-logo/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { put } from "@vercel/blob"; // 1. Importamos o 'put' do Vercel Blob
import { auth } from "../../../../../auth"; // 2. Importamos a autenticação

// Removemos as importações de 'fs' e 'path'
// import { writeFile, mkdir } from "fs/promises";
// import path from "path";

// Adicionamos o runtime do Node.js por usar o Prisma
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // 3. Adicionamos a verificação de sessão
  const session = await auth();
  if (!session) {
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

    // 4. Criamos um nome de ficheiro estático para ser fácil de substituir
    const filename = `company-logo.${file.name.split(".").pop()}`;

    // 5. Enviamos o ficheiro para o Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      // Adicionamos 'addRandomSuffix: false' para garantir que o nome do ficheiro seja sempre o mesmo,
      // substituindo o logótipo antigo.
      addRandomSuffix: false,
    });

    // 6. Atualizamos o registro de configuração com a URL do Blob
    await prisma.configuracao.update({
      where: { id: 1 },
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
