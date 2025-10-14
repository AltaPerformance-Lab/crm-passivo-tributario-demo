import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { put } from "@vercel/blob";
// CORREÇÃO FINAL: Ajustamos o caminho para 5 níveis acima, alcançando a raiz.
import { auth } from "../../../../../auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

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

    const filename = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;

    const blob = await put(filename, file, {
      access: "public",
    });

    const novaProposta = await prisma.proposta.create({
      data: {
        negocioId: parseInt(negocioId),
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
