import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { put } from "@vercel/blob";
import { pdf } from "@react-pdf/renderer";
import { ProposalDocument } from "@/components/ProposalDocument";
import React from "react";
import { auth } from "../../../../../auth";
import type { Lead, Configuracao } from "@prisma/client"; // Import types if needed

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

    // Crie objetos "planos" com apenas os dados necessários para o PDF.
    const plainClient = {
      nomeDevedor: lead.nomeDevedor,
      cnpj: lead.cnpj,
    };

    const plainConfig = {
      nomeEmpresa: config.nomeEmpresa,
      cnpj: config.cnpj,
      endereco: config.endereco,
      email: config.email,
      telefone: config.telefone,
    };

    // Formate a data ANTES de enviar para o componente
    const validadeDate = new Date(proposalData.validade);
    const validadeFormatada = validadeDate.toLocaleDateString("pt-BR", {
      timeZone: "UTC", // Garante que a data não mude por fuso horário
    });

    // Atualiza o objeto proposalData com a data já formatada como string
    const finalProposalData = {
      ...proposalData,
      validade: validadeFormatada,
    };

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

    // Use os objetos planos e os dados finais da proposta
    const doc = React.createElement(ProposalDocument, {
      client: plainClient,
      proposalData: finalProposalData,
      config: plainConfig,
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
        validade: new Date(proposalData.validade), // Salva a data original no BD
        caminhoArquivo: blob.url,
        nomeArquivo: `Proposta - ${lead.nomeDevedor.substring(0, 20)}.pdf`,
      },
    });

    return NextResponse.json(
      { success: true, proposta: novaProposta },
      { status: 201 }
    );
  } catch (error) {
    console.error("ERRO DETALHADO AO GERAR PDF:", error);
    return NextResponse.json(
      { message: "Falha ao gerar o PDF.", error: (error as Error).message },
      { status: 500 }
    );
  }
}
