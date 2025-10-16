import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { put } from "@vercel/blob";
import { pdf } from "@react-pdf/renderer";
import { ProposalDocument } from "@/components/ProposalDocument";
import React from "react";
import { auth } from "../../../../../auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

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

    // --- INÍCIO DO CÓDIGO DE DEPURAÇÃO ---
    console.log("--- INICIANDO GERAÇÃO DE PDF ---");
    console.log("Dados do Lead:", JSON.stringify(lead, null, 2));
    console.log("Dados da Configuração:", JSON.stringify(config, null, 2));
    console.log(
      "Dados da Proposta (do formulário):",
      JSON.stringify(proposalData, null, 2)
    );
    console.log("--- TENTANDO RENDERIZAR O DOCUMENTO ---");
    // --- FIM DO CÓDIGO DE DEPURAÇÃO ---

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

    const doc = React.createElement(ProposalDocument, {
      client: lead,
      proposalData: proposalData,
      config: config,
    });

    const pdfBlob = await pdf(doc as any).toBlob();

    const filename = `proposta-${negocio.id}-${Date.now()}.pdf`;

    const blob = await put(filename, pdfBlob, {
      access: "public",
      contentType: "application/pdf",
    });

    const novaProposta = await prisma.proposta.create({
      data: {
        negocioId: negocio.id,
        objeto: proposalData.objeto,
        escopo: proposalData.escopo,
        valores: proposalData.valores,
        validade: new Date(proposalData.validade),
        caminhoArquivo: blob.url,
        nomeArquivo: `Proposta - ${lead.nomeDevedor.substring(0, 20)}.pdf`,
      },
    });

    return NextResponse.json(
      { success: true, proposta: novaProposta },
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
