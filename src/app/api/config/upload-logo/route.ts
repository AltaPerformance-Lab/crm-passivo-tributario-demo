// src/app/api/config/upload-logo/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@//lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json(
        { message: "Nenhum arquivo de logo enviado." },
        { status: 400 }
      );
    }

    // Converte o arquivo para um buffer que pode ser salvo
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Cria um nome de arquivo estático para a logo, para ser fácil de referenciar
    const fileExtension = path.extname(file.name);
    const filename = `company-logo${fileExtension}`;

    // Define o diretório e garante que ele exista
    const logosDir = path.join(process.cwd(), "public", "logos");
    await mkdir(logosDir, { recursive: true });

    // Salva o arquivo
    const savePath = path.join(logosDir, filename);
    await writeFile(savePath, fileBuffer);

    // Define o caminho público que será salvo no banco
    const publicUrl = `/logos/${filename}`;

    // Atualiza o registro de configuração no banco com o caminho da nova logo
    await prisma.configuracao.update({
      where: { id: 1 },
      data: {
        logoUrl: publicUrl,
      },
    });

    return NextResponse.json(
      { success: true, logoUrl: publicUrl },
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
