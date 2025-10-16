// src/lib/pdf-generator.ts

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Defina as interfaces de dados que a função receberá
interface SimpleClient {
  nomeDevedor: string | null;
  cnpj: string | null;
}
interface SimpleConfig {
  nomeEmpresa: string | null;
}
interface ProposalData {
  objeto: string;
  escopo: string;
  valores: string;
  validade: string; // Já vem formatada
}

interface PdfData {
  client: SimpleClient;
  config: SimpleConfig;
  proposalData: ProposalData;
}

// Função para quebrar o texto em linhas para caber na página
function wrapText(
  text: string,
  width: number,
  font: any,
  fontSize: number
): string[] {
  const words = text.split(" ");
  let line = "";
  const lines = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (testWidth > width) {
      lines.push(line);
      line = words[n] + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line);
  return lines;
}

export async function generateProposalPdf(data: PdfData): Promise<Uint8Array> {
  const { client, config, proposalData } = data;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  const contentWidth = width - 2 * margin;
  let y = height - margin; // O "cursor" que controla a posição vertical

  // Título
  page.drawText("Proposta de Serviços Jurídicos", {
    x: margin,
    y: y,
    font: boldFont,
    size: 18,
    color: rgb(0, 0, 0),
  });
  y -= 40; // Move o cursor para baixo

  // Informações do Cliente
  page.drawText(`Para: ${client.nomeDevedor || "Não informado"}`, {
    x: margin,
    y: y,
    font,
    size: 12,
  });
  y -= 20;
  page.drawText(`Data de Emissão: ${new Date().toLocaleDateString("pt-BR")}`, {
    x: margin,
    y: y,
    font,
    size: 12,
  });
  y -= 20;
  page.drawText(`Válida até: ${proposalData.validade}`, {
    x: margin,
    y: y,
    font,
    size: 12,
  });
  y -= 40;

  // Função auxiliar para desenhar uma seção inteira (título + parágrafo)
  const drawSection = (title: string, content: string) => {
    page.drawText(title, {
      x: margin,
      y: y,
      font: boldFont,
      size: 14,
    });
    y -= 25;

    const lines = wrapText(content, contentWidth, font, 12);
    lines.forEach((line) => {
      page.drawText(line, { x: margin, y: y, font, size: 12, lineHeight: 15 });
      y -= 15; // Move para a próxima linha
    });
    y -= 20; // Espaço extra após a seção
  };

  // Construindo o PDF seção por seção
  drawSection("1. Objeto da Proposta", proposalData.objeto);
  drawSection("2. Escopo dos Serviços", proposalData.escopo);
  drawSection("3. Valores e Forma de Pagamento", proposalData.valores);

  // Rodapé
  page.drawText(
    `${config.nomeEmpresa || "Sua Empresa"} - Todos os direitos reservados.`,
    {
      x: margin,
      y: margin / 2,
      font,
      size: 8,
      color: rgb(0.5, 0.5, 0.5),
    }
  );

  return pdfDoc.save();
}
