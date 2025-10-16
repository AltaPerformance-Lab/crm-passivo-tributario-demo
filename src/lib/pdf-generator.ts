import { PDFDocument, rgb, StandardFonts, PDFFont } from "pdf-lib";

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

// ATUALIZADO PARA RECEBER A IMAGEM
interface PdfData {
  client: SimpleClient;
  config: SimpleConfig;
  proposalData: ProposalData;
  logoImageBuffer?: ArrayBuffer; // Buffer da imagem é opcional
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
      lines.push(line);
      line = "";
      continue;
    }
    const testLine = line + word + " ";
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (testWidth > width && line.length > 0) {
      lines.push(line);
      line = word + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line);
  return lines;
}

export async function generateProposalPdf(data: PdfData): Promise<Uint8Array> {
  const { client, config, proposalData, logoImageBuffer } = data; // Pegando o logoImageBuffer

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  const contentWidth = width - 2 * margin;
  let y = height - margin;

  // ==========================================================
  //                CABEÇALHO COM LÓGICA DA LOGO
  // ==========================================================
  if (logoImageBuffer) {
    // Tenta incorporar a imagem. Assume que é PNG, que é o mais comum para logos.
    // Se precisar de JPG, troque embedPng por embedJpg.
    try {
      const logoImage = await pdfDoc.embedPng(logoImageBuffer);
      const desiredWidth = 100; // Largura desejada para a logo
      const scale = desiredWidth / logoImage.width;
      const logoDims = {
        width: desiredWidth,
        height: logoImage.height * scale,
      };

      page.drawImage(logoImage, {
        x: margin,
        y: y - logoDims.height + 10, // Ajuste fino da posição vertical
        width: logoDims.width,
        height: logoDims.height,
      });
    } catch (e) {
      console.error(
        "Não foi possível incorporar a imagem. Usando texto alternativo.",
        e
      );
      page.drawText("Logótipo da Empresa", {
        x: margin,
        y: y,
        font: font,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
      });
    }
  } else {
    // Se não houver imagem, desenha o texto alternativo
    page.drawText("Logótipo da Empresa", {
      x: margin,
      y: y,
      font: font,
      size: 10,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  // Coluna da Direita (Dados da Empresa)
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
  let headerY = y;
  drawRightAlignedText(config.nomeEmpresa || "Nome da Empresa", {
    font: boldFont,
    size: 12,
    y: headerY,
  });
  headerY -= 15;
  drawRightAlignedText(config.cnpj || "CNPJ não informado", {
    font: font,
    size: 9,
    y: headerY,
  });
  headerY -= 12;
  drawRightAlignedText(config.endereco || "Endereço não informado", {
    font: font,
    size: 9,
    y: headerY,
  });
  headerY -= 12;
  drawRightAlignedText(
    `Email: ${config.email || ""} | Tel: ${config.telefone || ""}`,
    { font: font, size: 9, y: headerY }
  );
  y -= 70;

  // Linha divisória
  page.drawLine({
    start: { x: margin, y: y },
    end: { x: width - margin, y: y },
    thickness: 1,
    color: rgb(0.9, 0.9, 0.9),
  });
  y -= 30;

  // ==========================================================
  // O restante do código continua exatamente igual...
  // ==========================================================
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
      const lines = wrapText(paragraph.trim(), contentWidth, font, 12);
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
