import { PDFDocument, rgb, StandardFonts, PDFFont } from "pdf-lib";

// Interfaces (sem alterações)
interface SimpleConfig {
  nomeEmpresa: string | null;
  cnpj: string | null;
  endereco: string | null;
  email: string | null;
  telefone: string | null;
}
interface SimpleClient {
  nomeDevedor: string | null;
  cnpj: string | null;
}
interface ProposalData {
  objeto: string;
  escopo: string;
  valores: string;
  validade: string;
}
interface PdfData {
  client: SimpleClient;
  config: SimpleConfig;
  proposalData: ProposalData;
  logoImageBuffer?: ArrayBuffer;
}

// ==========================================================
//                 MELHORIAS DE DESIGN
// ==========================================================
// Centralizamos as configurações de design em um objeto "theme"
// Fica muito mais fácil ajustar cores e fontes no futuro!
const theme = {
  colors: {
    primary: rgb(0.12, 0.38, 0.57), // Um azul profissional
    text: rgb(0.2, 0.2, 0.2), // Cinza escuro para texto
    lightText: rgb(0.5, 0.5, 0.5), // Cinza claro para detalhes
    line: rgb(0.9, 0.9, 0.9), // Linhas divisórias
  },
  fontSizes: {
    h1: 20,
    h2: 14,
    body: 10,
    small: 8,
  },
  lineHeight: 16,
};
// ==========================================================

// Função para formatar o CNPJ
const formatCNPJ = (cnpj: string | null): string => {
  if (!cnpj) return "CNPJ não informado";
  // Remove caracteres não numéricos
  const cleaned = cnpj.replace(/\D/g, "");
  // Aplica a máscara
  if (cleaned.length !== 14) return cnpj; // Retorna o original se não tiver 14 dígitos
  return cleaned.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
};

function wrapText(
  text: string,
  width: number,
  font: PDFFont,
  fontSize: number
): string[] {
  const words = text.replace(/\n/g, " \n ").split(" ");
  let line = "";
  const lines = [];
  for (const word of words) {
    if (word === "\n") {
      lines.push(line.trim());
      line = "";
      continue;
    }
    const testLine = line + word + " ";
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (testWidth > width && line.length > 0) {
      lines.push(line.trim());
      line = word + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());
  return lines;
}

export async function generateProposalPdf(data: PdfData): Promise<Uint8Array> {
  const { client, config, proposalData, logoImageBuffer } = data;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  let y = height - margin;

  // --- CABEÇALHO REFEITO ---
  const headerStartY = y;
  let logoHeight = 40; // Altura fixa para a logo para consistência

  if (logoImageBuffer) {
    try {
      const logoImage = await pdfDoc.embedPng(logoImageBuffer);
      const scale = logoHeight / logoImage.height;
      const logoWidth = logoImage.width * scale;
      page.drawImage(logoImage, {
        x: margin,
        y: headerStartY - logoHeight,
        width: logoWidth,
        height: logoHeight,
      });
    } catch (e) {
      console.error("Não foi possível incorporar a imagem.", e);
    }
  }

  const drawRightAlignedText = (
    text: string,
    options: { font: PDFFont; size: number; y: number; color?: any }
  ) => {
    const textWidth = options.font.widthOfTextAtSize(text, options.size);
    page.drawText(text, {
      x: width - margin - textWidth,
      y: options.y,
      font: options.font,
      size: options.size,
      color: options.color || theme.colors.text,
    });
  };

  let headerTextY = headerStartY;
  drawRightAlignedText(config.nomeEmpresa || "Nome da Empresa", {
    font: boldFont,
    size: theme.fontSizes.body,
    y: headerTextY,
    color: theme.colors.text,
  });
  headerTextY -= 12;
  // CNPJ CORRIGIDO E FORMATADO
  drawRightAlignedText(formatCNPJ(config.cnpj), {
    font: font,
    size: theme.fontSizes.small,
    y: headerTextY,
    color: theme.colors.lightText,
  });
  headerTextY -= 12;
  drawRightAlignedText(config.endereco || "Endereço", {
    font: font,
    size: theme.fontSizes.small,
    y: headerTextY,
    color: theme.colors.lightText,
  });
  headerTextY -= 12;
  drawRightAlignedText(
    `Email: ${config.email || ""} | Tel: ${config.telefone || ""}`,
    {
      font: font,
      size: theme.fontSizes.small,
      y: headerTextY,
      color: theme.colors.lightText,
    }
  );

  y = headerStartY - logoHeight - 20;
  page.drawLine({
    start: { x: margin, y: y },
    end: { x: width - margin, y: y },
    thickness: 1,
    color: theme.colors.line,
  });
  y -= 40;

  // --- CORPO DO DOCUMENTO ---
  page.drawText("Proposta de Serviços Jurídicos", {
    x: margin,
    y: y,
    font: boldFont,
    size: theme.fontSizes.h1,
    color: theme.colors.text,
  });
  y -= 30;

  // Bloco de informações do cliente
  const clientInfoY = y;
  page.drawText("Para:", {
    x: margin,
    y: clientInfoY,
    font: boldFont,
    size: theme.fontSizes.body,
    color: theme.colors.text,
  });
  page.drawText(client.nomeDevedor || "Não informado", {
    x: margin + 35,
    y: clientInfoY,
    font: font,
    size: theme.fontSizes.body,
    color: theme.colors.text,
  });

  const dates = `Data de Emissão: ${new Date().toLocaleDateString(
    "pt-BR"
  )}   |   Válida até: ${proposalData.validade}`;
  const datesWidth = font.widthOfTextAtSize(dates, theme.fontSizes.small);
  page.drawText(dates, {
    x: width - margin - datesWidth,
    y: clientInfoY,
    font: font,
    size: theme.fontSizes.small,
    color: theme.colors.lightText,
  });
  y -= 40;

  // Função de Seção Refeita
  const drawSection = (title: string, content: string) => {
    page.drawText(title, {
      x: margin,
      y: y,
      font: boldFont,
      size: theme.fontSizes.h2,
      color: theme.colors.primary,
    });
    y -= 5;
    page.drawLine({
      start: { x: margin, y: y },
      end: { x: margin + 100, y: y },
      thickness: 1.5,
      color: theme.colors.primary,
    });
    y -= 20;

    const lines = wrapText(
      content,
      width - 2 * margin,
      font,
      theme.fontSizes.body
    );
    lines.forEach((line) => {
      page.drawText(line, {
        x: margin,
        y: y,
        font,
        size: theme.fontSizes.body,
        color: theme.colors.text,
        lineHeight: theme.lineHeight,
      });
      y -= theme.lineHeight;
    });
    y -= 25;
  };

  drawSection("1. Objeto da Proposta", proposalData.objeto);
  drawSection("2. Escopo dos Serviços", proposalData.escopo);
  drawSection("3. Valores e Forma de Pagamento", proposalData.valores);

  // --- RODAPÉ REFEITO ---
  const footerY = margin;
  page.drawLine({
    start: { x: margin, y: footerY },
    end: { x: width - margin, y: footerY },
    thickness: 1,
    color: theme.colors.line,
  });
  const footerText = `${
    config.nomeEmpresa || "Sua Empresa"
  } - Todos os direitos reservados.`;
  const footerTextWidth = font.widthOfTextAtSize(
    footerText,
    theme.fontSizes.small
  );
  page.drawText(footerText, {
    x: (width - footerTextWidth) / 2,
    y: footerY - 20,
    font,
    size: theme.fontSizes.small,
    color: theme.colors.lightText,
  });

  return pdfDoc.save();
}
