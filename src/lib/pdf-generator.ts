import { PDFDocument, rgb, StandardFonts, PDFFont } from "pdf-lib";

// As interfaces não precisam de alteração
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

  // ==========================================================
  //         CABEÇALHO COM LÓGICA DE LAYOUT CORRIGIDA
  // ==========================================================
  const initialY = y;
  let logoDims = { width: 0, height: 45 }; // Altura mínima para o texto da direita

  if (logoImageBuffer) {
    try {
      const logoImage = await pdfDoc.embedPng(logoImageBuffer);
      const desiredWidth = 100;
      const scale = desiredWidth / logoImage.width;
      logoDims = { width: desiredWidth, height: logoImage.height * scale };
    } catch (e) {
      console.error("Não foi possível incorporar a imagem.", e);
    }
  }

  // Define a altura total do cabeçalho como a altura do maior elemento (logo ou texto)
  const textBlockHeight = 60; // Altura estimada para o bloco de texto da direita
  const headerHeight = Math.max(logoDims.height, textBlockHeight);

  // Desenha a logo (se existir) centralizada verticalmente no espaço do cabeçalho
  if (logoImageBuffer && logoDims.width > 0) {
    const logoImage = await pdfDoc.embedPng(logoImageBuffer);
    page.drawImage(logoImage, {
      x: margin,
      y: initialY - (headerHeight + logoDims.height) / 2, // Alinha verticalmente
      width: logoDims.width,
      height: logoDims.height,
    });
  } else {
    page.drawText("Logótipo da Empresa", {
      x: margin,
      y: initialY - 10,
      font: font,
      size: 10,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  // Desenha o texto da direita, também alinhado verticalmente
  const drawRightAlignedText = (
    text: string,
    options: { font: PDFFont; size: number; y: number }
  ) => {
    const textWidth = options.font.widthOfTextAtSize(text, options.size);
    page.drawText(text, {
      x: width - margin - textWidth,
      y: options.y,
      font: options.font,
      size: options.size,
    });
  };
  let headerTextY = initialY - (headerHeight - textBlockHeight) / 2; // Posição Y inicial para alinhar
  drawRightAlignedText(config.nomeEmpresa || "Nome da Empresa", {
    font: boldFont,
    size: 12,
    y: headerTextY,
  });
  headerTextY -= 15;
  drawRightAlignedText(config.cnpj || "CNPJ não informado", {
    font: font,
    size: 9,
    y: headerTextY,
  });
  headerTextY -= 12;
  drawRightAlignedText(config.endereco || "Endereço não informado", {
    font: font,
    size: 9,
    y: headerTextY,
  });
  headerTextY -= 12;
  drawRightAlignedText(
    `Email: ${config.email || ""} | Tel: ${config.telefone || ""}`,
    { font: font, size: 9, y: headerTextY }
  );

  // Move o cursor 'y' para baixo do cabeçalho, com base na sua altura calculada
  y = initialY - headerHeight - 10;

  // Linha divisória
  page.drawLine({
    start: { x: margin, y: y },
    end: { x: width - margin, y: y },
    thickness: 1,
    color: rgb(0.9, 0.9, 0.9),
  });
  y -= 30;

  // ==========================================================
  //                FIM DAS CORREÇÕES DO CABEÇALHO
  // ==========================================================

  // O resto do código continua exatamente igual...
  page.drawText("Proposta de Serviços Jurídicos", {
    x: margin,
    y: y,
    font: boldFont,
    size: 18,
  });
  y -= 40;

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

  const drawSection = (title: string, content: string) => {
    page.drawText(title, { x: margin, y: y, font: boldFont, size: 14 });
    y -= 25;
    const paragraphs = content.split("\n");
    paragraphs.forEach((paragraph) => {
      const lines = wrapText(
        paragraph.trim(),
        page.getWidth() - 2 * margin,
        font,
        12
      );
      lines.forEach((line) => {
        page.drawText(line, {
          x: margin,
          y: y,
          font,
          size: 12,
          lineHeight: 15,
        });
        y -= 15;
      });
    });
    y -= 20;
  };

  drawSection("1. Objeto da Proposta", proposalData.objeto);
  drawSection("2. Escopo dos Serviços", proposalData.escopo);
  drawSection("3. Valores e Forma de Pagamento", proposalData.valores);

  // ==========================================================
  //             RODAPÉ COM ALINHAMENTO CORRIGIDO
  // ==========================================================
  const footerText = `${
    config.nomeEmpresa || "Sua Empresa"
  } - Todos os direitos reservados.`;
  const footerTextWidth = font.widthOfTextAtSize(footerText, 8);
  page.drawText(footerText, {
    x: (width - footerTextWidth) / 2, // Cálculo para centralizar
    y: margin / 2,
    font,
    size: 8,
    color: rgb(0.5, 0.5, 0.5),
  });
  // ==========================================================

  return pdfDoc.save();
}
