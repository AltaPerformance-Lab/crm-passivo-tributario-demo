// src/app/api/proposals/generate/route.ts (Versão Segura e Multi-Usuário)

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { put } from "@vercel/blob";
import { auth } from "../../../../../auth";
import { generateProposalPdf } from "@/lib/pdf-generator";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // 1. Obter e validar a sessão do usuário
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
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

    // 2. Buscar a configuração DO USUÁRIO LOGADO
    const config = await prisma.configuracao.findUnique({
      where: { userId: userId },
    });
    if (!config) {
      // Usamos status 404 para indicar que um recurso essencial não foi encontrado
      return NextResponse.json(
        {
          message:
            "Configurações da empresa não encontradas para este usuário.",
        },
        { status: 404 }
      );
    }

    // 3. Buscar o lead, GARANTINDO QUE ELE PERTENCE AO USUÁRIO LOGADO
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        userId: userId, // Filtro de segurança
      },
    });
    if (!lead) {
      return NextResponse.json(
        { message: "Lead não encontrado ou acesso negado." },
        { status: 404 }
      );
    }

    // 4. Criar ou atualizar o negócio, ASSOCIANDO AO USUÁRIO
    const negocio = await prisma.negocio.upsert({
      where: { leadId: leadId },
      update: {}, // Não precisamos atualizar nada se ele já existe
      create: {
        valorFechado: 0,
        valorEscritorio: 0,
        valorOutraParte: 0,
        valorRecebido: 0,
        // Conecta o novo negócio ao Lead E ao User
        lead: { connect: { id: leadId } },
        user: { connect: { id: userId } },
      },
    });

    // A partir daqui, a lógica de gerar PDF e salvar o arquivo continua a mesma,
    // pois já está segura por ter pego os dados corretos nos passos anteriores.

    let logoImageBuffer: ArrayBuffer | undefined = undefined;
    if (config.logoUrl) {
      try {
        const imageResponse = await fetch(config.logoUrl);
        if (imageResponse.ok) {
          logoImageBuffer = await imageResponse.arrayBuffer();
        }
      } catch (e) {
        console.error("Falha ao buscar a imagem da logo:", e);
      }
    }

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
      logoImageBuffer: logoImageBuffer,
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
    console.error("ERRO DETALHADO AO GERAR PDF:", error);
    return NextResponse.json(
      { message: "Falha ao gerar o PDF.", error: (error as Error).message },
      { status: 500 }
    );
  }
}
