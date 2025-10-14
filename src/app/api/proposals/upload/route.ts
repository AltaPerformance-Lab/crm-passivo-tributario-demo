import { NextResponse } from "next/server";
import prisma from "@//lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("proposal") as File | null;
    const negocioId = formData.get("negocioId") as string | null;

    if (!file || !negocioId) {
      return NextResponse.json(
        { message: "Arquivo da proposta e ID do negócio são obrigatórios." },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;

    const proposalsDir = path.join(process.cwd(), "public", "propostas");
    await mkdir(proposalsDir, { recursive: true });

    const savePath = path.join(proposalsDir, filename);
    await writeFile(savePath, fileBuffer);

    const publicPath = `/propostas/${filename}`;

    const novaProposta = await prisma.proposta.create({
      data: {
        negocioId: parseInt(negocioId),
        caminhoArquivo: publicPath, // Correto
        nomeArquivo: file.name, // Correto
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
