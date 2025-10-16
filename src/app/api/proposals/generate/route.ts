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

    // ======================= LOGS PARA DEPURACAO =======================
    // Aqui verificamos os tipos de dados antes de passá-los para o componente PDF.
    console.log("--- INÍCIO DEBUG PDF ---");
    console.log("Verificando os tipos de dados de 'proposalData':");
    console.log(`Tipo de 'objeto': ${typeof proposalData.objeto}`);
    console.log(`Tipo de 'escopo': ${typeof proposalData.escopo}`);
    console.log(`Tipo de 'valores': ${typeof proposalData.valores}`);

    // Este log mostrará a estrutura completa do objeto.
    // Se for um JSON de um editor de texto, você verá aqui.
    console.log(
      "Conteúdo completo de 'proposalData':",
      JSON.stringify(proposalData, null, 2)
    );
    console.log("--- FIM DEBUG PDF ---");
    // ===================================================================

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
    // O erro será capturado aqui e logado nos logs da Vercel
    console.error("ERRO DETALHADO AO GERAR PDF:", error);
    return NextResponse.json(
      { message: "Falha ao gerar o PDF.", error: (error as Error).message },
      { status: 500 }
    );
  }
}
