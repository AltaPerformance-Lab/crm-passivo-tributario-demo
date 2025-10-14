import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
// --- MUDANÇA FINAL: Importando 'pdf' em vez de 'render' ---
import { pdf } from "@react-pdf/renderer";
import { ProposalDocument } from "@/components/ProposalDocument";
import React from "react";

export async function POST(request: Request) {
  try {
    const { leadId, proposalData } = await request.json();

    if (!leadId || !proposalData) {
      return NextResponse.json(
        { message: "Dados insuficientes para gerar a proposta." },
        { status: 400 }
      );
    }

    const config = await prisma.configuracao.findUnique({ where: { id: 1 } });
    if (!config) {
      throw new Error("Configurações da empresa não encontradas.");
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json(
        { message: "Lead não encontrado." },
        { status: 404 }
      );
    }

    const negocio = await prisma.negocio.upsert({
      where: { leadId: leadId },
      update: {},
      create: {
        leadId: leadId,
        valorFechado: 0,
        valorOutraParte: 0,
        valorRecebido: 0,
      },
    });

    const novaProposta = await prisma.proposta.create({
      data: {
        negocioId: negocio.id,
        objeto: proposalData.objeto,
        escopo: proposalData.escopo,
        valores: proposalData.valores,
        validade: new Date(proposalData.validade),
        caminhoArquivo: "", // Temporário
      },
    });

    // --- CORREÇÃO DE TIPO APLICADA AQUI ---
    const doc = React.createElement(ProposalDocument, {
      client: lead,
      proposalData: proposalData,
      config: config,
    });

    // Forçamos o tipo para 'any' para contornar a incompatibilidade do build
    const pdfBuffer = await pdf(doc as any).toBuffer();

    // A lógica de salvar o ficheiro permanece a mesma e já está correta
    const proposalsDir = path.join(process.cwd(), "public", "propostas");
    await mkdir(proposalsDir, { recursive: true });

    const filename = `proposta-${negocio.id}-${novaProposta.id}.pdf`;
    const savePath = path.join(proposalsDir, filename);
    await writeFile(savePath, pdfBuffer);

    const publicPath = `/propostas/${filename}`;
    const propostaAtualizada = await prisma.proposta.update({
      where: { id: novaProposta.id },
      data: {
        caminhoArquivo: publicPath,
        nomeArquivo: `Proposta - ${lead.nomeDevedor.substring(0, 20)}.pdf`,
      },
    });

    return NextResponse.json(
      { success: true, proposta: propostaAtualizada },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    return NextResponse.json(
      { message: "Falha ao gerar o PDF.", error: (error as Error).message },
      { status: 500 }
    );
  }
}
