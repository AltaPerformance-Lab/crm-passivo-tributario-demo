import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { put } from "@vercel/blob";
import { auth } from "../../../../../auth";
import { generateProposalPdf } from "@/lib/pdf-generator";

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
        { message: "Dados insuficientes." },
        { status: 400 }
      );
    }

    const config = await prisma.configuracao.findUnique({ where: { id: 1 } });
    if (!config) {
      throw new Error("Configurações não encontradas.");
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

    // ==========================================================
    //          BUSCANDO A IMAGEM DA LOGO
    // ==========================================================
    let logoImageBuffer: ArrayBuffer | undefined = undefined;
    if (config.logoUrl) {
      try {
        const imageResponse = await fetch(config.logoUrl);
        if (imageResponse.ok) {
          logoImageBuffer = await imageResponse.arrayBuffer();
        }
      } catch (e) {
        console.error("Falha ao buscar a imagem da logo:", e);
        // Continua sem a logo se a busca falhar
      }
    }
    // ==========================================================

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

    const validadeDate = new Date(proposalData.validade);
    const validadeFormatada = validadeDate.toLocaleDateString("pt-BR", {
      timeZone: "UTC",
    });

    const pdfBytes = await generateProposalPdf({
      client: plainClient,
      config: plainConfig,
      proposalData: { ...proposalData, validade: validadeFormatada },
      logoImageBuffer: logoImageBuffer, // Enviando a imagem para o gerador
    });

    const pdfBuffer = Buffer.from(pdfBytes);

    const filename = `proposta-${negocio.id}-${Date.now()}.pdf`;
    const blobResult = await put(filename, pdfBuffer, {
      access: "public",
      contentType: "application/pdf",
    });

    await prisma.proposta.create({
      data: {
        negocioId: negocio.id,
        objeto: proposalData.objeto,
        escopo: proposalData.escopo,
        valores: proposalData.valores,
        validade: new Date(proposalData.validade),
        caminhoArquivo: blobResult.url,
        nomeArquivo: `Proposta - ${lead.nomeDevedor.substring(0, 20)}.pdf`,
      },
    });

    return NextResponse.json(
      { success: true, proposta: { caminhoArquivo: blobResult.url } },
      { status: 201 }
    );
  } catch (error) {
    console.error("ERRO DETALHADO AO GERAR PDF COM PDF-LIB:", error);
    return NextResponse.json(
      { message: "Falha ao gerar o PDF.", error: (error as Error).message },
      { status: 500 }
    );
  }
}
