// Caminho inferido: src/app/api/cnpj/verify/route.ts (Versão Segura)

import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "../../../../../auth"; // 1. Importar a autenticação

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // 2. Obter a sessão e garantir que o usuário está logado
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { cnpj } = await req.json();

    if (!cnpj || typeof cnpj !== "string") {
      return NextResponse.json(
        { message: "CNPJ é obrigatório." },
        { status: 400 }
      );
    }

    const cleanedCnpj = cnpj.replace(/[^\d]/g, "");

    // 3. BUSCA SEGURA: Procuramos o lead que tenha o CNPJ E pertença ao usuário logado
    const lead = await prisma.lead.findFirst({
      where: {
        cnpj: cleanedCnpj,
        userId: userId, // <-- Filtro de segurança
      },
    });

    if (!lead) {
      return NextResponse.json(
        {
          message: `Nenhum lead encontrado para o CNPJ ${cleanedCnpj} em sua carteira.`,
        },
        { status: 404 }
      );
    }

    // A partir daqui, todo o resto da sua lógica já está correta e segura,
    // pois estamos operando sobre um 'lead' que já foi verificado.

    const response = await fetch(
      `https://brasilapi.com.br/api/cnpj/v1/${cleanedCnpj}`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );

    if (!response.ok) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: "DESCARTADO" },
      });
      const errorText = await response.text();
      return NextResponse.json(
        {
          message: `Erro ao consultar a API externa. Status: ${response.status}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.descricao_situacao_cadastral !== "ATIVA") {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: "DESCARTADO" },
      });
      return NextResponse.json(
        {
          message: `Empresa com CNPJ ${cleanedCnpj} não está ATIVA. Status do lead alterado para DESCARTADO.`,
        },
        { status: 200 }
      );
    }

    let regimeTributarioRecente = null;
    if (data.regime_tributario && data.regime_tributario.length > 0) {
      const maisRecente = data.regime_tributario.sort(
        (a: any, b: any) => b.ano - a.ano
      )[0];
      regimeTributarioRecente = maisRecente.forma_de_tributacao;
    } else if (data.opcao_pelo_simples) {
      regimeTributarioRecente = "SIMPLES NACIONAL";
    }

    const empresaData = {
      cnpj: cleanedCnpj,
      razaoSocial: data.razao_social,
      nomeFantasia: data.nome_fantasia,
      situacaoCadastral: data.descricao_situacao_cadastral,
      dataSituacaoCadastral: data.data_situacao_cadastral,
      logradouro: data.logradouro,
      numero: data.numero,
      bairro: data.bairro,
      cep: data.cep,
      municipio: data.municipio,
      uf: data.uf,
      capitalSocial: data.capital_social,
      telefone: data.ddd_telefone_1 || data.ddd_telefone_2,
      porte: data.porte,
      naturezaJuridica: data.natureza_juridica,
      cnaeFiscalDescricao: data.cnae_fiscal_descricao,
      dataInicioAtividade: data.data_inicio_atividade,
      regimeTributario: regimeTributarioRecente,
      cnaesSecundarios: data.cnaes_secundarios || [],
    };

    const empresa = await prisma.empresa.upsert({
      where: { cnpj: cleanedCnpj },
      update: {
        ...empresaData,
        socios: {
          deleteMany: {},
          create: data.qsa.map((socio: any) => ({
            nomeSocio: socio.nome_socio,
            qualificacaoSocio: socio.qualificacao_socio,
            dataEntradaSociedade: socio.data_entrada_sociedade,
            documento: socio.cnpj_cpf_do_socio,
          })),
        },
      },
      create: {
        ...empresaData,
        socios: {
          create: data.qsa.map((socio: any) => ({
            nomeSocio: socio.nome_socio,
            qualificacaoSocio: socio.qualificacao_socio,
            dataEntradaSociedade: socio.data_entrada_sociedade,
            documento: socio.cnpj_cpf_do_socio,
          })),
        },
      },
    });

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        empresa: { connect: { id: empresa.id } },
        status: "VERIFICADO",
      },
    });

    return NextResponse.json(empresa, { status: 200 });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Erro interno no servidor.", error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}
