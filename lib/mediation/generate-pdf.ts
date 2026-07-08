import { existsSync } from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

export type MediationPdfSection = {
  heading: string;
  body: string;
};

export type MediationPdfContent = {
  title: string;
  documentLabel: string;
  companyName: string;
  sections: MediationPdfSection[];
  agreementBody?: string;
  terms: string[];
  disclaimer: string;
  topDisclaimer: string;
  termsHeading: string;
  agreementHeading?: string;
  generatedAt?: Date;
};

const COLORS = {
  ink: "#1A1A18",
  muted: "#5C5C58",
  hairline: "#D8D4CC",
  accent: "#9A7B2F",
  disclaimer: "#5C5C58",
} as const;

const PAGE = {
  margin: 56,
  headerBottom: 132,
  // Reserved band above the bottom margin for footer line + company/page text.
  footerReserve: 40,
} as const;

function assetPath(...segments: string[]) {
  return path.join(process.cwd(), "assets", ...segments);
}

function fontPath(filename: string) {
  return assetPath("fonts", filename);
}

function logoPath() {
  return assetPath("logo.png");
}

function contentWidth(doc: PDFKit.PDFDocument) {
  return doc.page.width - PAGE.margin * 2;
}

function contentBottom(doc: PDFKit.PDFDocument) {
  return doc.page.height - PAGE.margin - PAGE.footerReserve;
}

function drawDocumentHeader(
  doc: PDFKit.PDFDocument,
  regularFont: string,
  boldFont: string,
  content: MediationPdfContent,
) {
  const top = PAGE.margin - 8;
  const logoSize = 44;
  const textLeft = PAGE.margin + logoSize + 14;
  const logoFile = logoPath();

  if (existsSync(logoFile)) {
    doc.image(logoFile, PAGE.margin, top, { width: logoSize, height: logoSize });
  }

  doc
    .font(boldFont)
    .fontSize(20)
    .fillColor(COLORS.ink)
    .text("PsyLex", textLeft, top + 2, { lineBreak: false });

  doc
    .font(regularFont)
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(content.companyName, PAGE.margin, top + 4, {
      width: contentWidth(doc),
      align: "right",
      lineBreak: false,
    });

  doc
    .font(regularFont)
    .fontSize(10)
    .fillColor(COLORS.muted)
    .text(content.documentLabel, textLeft, top + 28, { lineBreak: false });

  const ruleY = top + logoSize + 14;
  doc
    .moveTo(PAGE.margin, ruleY)
    .lineTo(doc.page.width - PAGE.margin, ruleY)
    .lineWidth(1)
    .strokeColor(COLORS.accent)
    .stroke();
}

function drawPageFooters(
  doc: PDFKit.PDFDocument,
  regularFont: string,
  companyName: string,
) {
  const pageRange = doc.bufferedPageRange();
  const pageCount = pageRange.count;
  const savedX = doc.x;
  const savedY = doc.y;

  for (let index = 0; index < pageCount; index += 1) {
    doc.switchToPage(pageRange.start + index);

    const margins = { ...doc.page.margins };
    doc.page.margins.top = 0;
    doc.page.margins.bottom = 0;
    doc.page.margins.left = 0;
    doc.page.margins.right = 0;

    const lineY = doc.page.height - PAGE.margin - 18;
    const textY = doc.page.height - PAGE.margin - 10;

    doc
      .moveTo(PAGE.margin, lineY)
      .lineTo(doc.page.width - PAGE.margin, lineY)
      .lineWidth(0.5)
      .strokeColor(COLORS.hairline)
      .stroke();

    doc.font(regularFont).fontSize(8).fillColor(COLORS.muted);

    // Important: do not pass `width`. PDFKit LineWrapper creates empty pages when
    // footer Y sits below the content bottom margin.
    doc.text(companyName, PAGE.margin, textY, { lineBreak: false });

    const pageLabel = `${index + 1} / ${pageCount}`;
    const pageLabelWidth = doc.widthOfString(pageLabel);
    doc.text(pageLabel, doc.page.width - PAGE.margin - pageLabelWidth, textY, {
      lineBreak: false,
    });

    doc.page.margins.top = margins.top;
    doc.page.margins.bottom = margins.bottom;
    doc.page.margins.left = margins.left;
    doc.page.margins.right = margins.right;
  }

  doc.switchToPage(pageRange.start + pageCount - 1);
  doc.x = savedX;
  doc.y = Math.min(savedY, contentBottom(doc));
}

function ensureMinSpace(doc: PDFKit.PDFDocument, minHeight: number) {
  if (doc.y + minHeight > contentBottom(doc)) {
    doc.addPage();
  }
}

function addSection(
  doc: PDFKit.PDFDocument,
  regularFont: string,
  boldFont: string,
  section: MediationPdfSection,
) {
  ensureMinSpace(doc, 72);

  const headingY = doc.y;
  doc.rect(PAGE.margin, headingY, 3, 14).fillColor(COLORS.accent).fill();

  doc
    .font(boldFont)
    .fontSize(12)
    .fillColor(COLORS.ink)
    .text(section.heading, PAGE.margin + 10, headingY, {
      width: contentWidth(doc) - 10,
    });

  doc.moveDown(0.35);
  doc
    .font(regularFont)
    .fontSize(10.5)
    .fillColor(COLORS.ink)
    .text(section.body, PAGE.margin, doc.y, {
      width: contentWidth(doc),
      align: "left",
      lineGap: 3,
    });

  doc.moveDown(0.55);
}

function addTitleBlock(
  doc: PDFKit.PDFDocument,
  boldFont: string,
  regularFont: string,
  title: string,
  generatedAt?: Date,
) {
  ensureMinSpace(doc, 48);

  doc.font(boldFont).fontSize(17).fillColor(COLORS.ink).text(title, {
    align: "left",
    width: contentWidth(doc),
  });

  if (generatedAt) {
    doc.moveDown(0.2);
    doc
      .font(regularFont)
      .fontSize(9)
      .fillColor(COLORS.muted)
      .text(generatedAt.toISOString().slice(0, 10), {
        align: "left",
        width: contentWidth(doc),
      });
  }

  doc.moveDown(0.55);
}

function addTextBlock(
  doc: PDFKit.PDFDocument,
  regularFont: string,
  boldFont: string,
  heading: string,
  body: string,
) {
  ensureMinSpace(doc, 48);
  doc.font(boldFont).fontSize(12).fillColor(COLORS.ink).text(heading);
  doc.moveDown(0.3);
  doc.font(regularFont).fontSize(10.5).fillColor(COLORS.ink).text(body, {
    align: "left",
    lineGap: 3,
    width: contentWidth(doc),
  });
  doc.moveDown(0.55);
}

function addTopDisclaimer(
  doc: PDFKit.PDFDocument,
  regularFont: string,
  disclaimer: string,
) {
  ensureMinSpace(doc, 48);

  const boxTop = doc.y;
  const boxPadding = 10;
  const textWidth = contentWidth(doc) - boxPadding * 2;

  doc
    .font(regularFont)
    .fontSize(8.5)
    .fillColor(COLORS.disclaimer)
    .text(disclaimer, PAGE.margin + boxPadding, boxTop + boxPadding, {
      align: "left",
      lineGap: 2,
      width: textWidth,
    });

  const boxHeight = doc.y - boxTop + boxPadding;
  doc
    .roundedRect(PAGE.margin, boxTop, contentWidth(doc), boxHeight, 6)
    .lineWidth(0.75)
    .strokeColor(COLORS.accent)
    .stroke();

  doc.y = boxTop + boxHeight + 12;
}

function addDisclaimer(
  doc: PDFKit.PDFDocument,
  regularFont: string,
  disclaimer: string,
) {
  ensureMinSpace(doc, 40);

  const boxTop = doc.y;
  const boxPadding = 10;
  const textWidth = contentWidth(doc) - boxPadding * 2;

  doc
    .font(regularFont)
    .fontSize(8.5)
    .fillColor(COLORS.disclaimer)
    .text(disclaimer, PAGE.margin + boxPadding, boxTop + boxPadding, {
      align: "left",
      lineGap: 2,
      width: textWidth,
    });

  const boxHeight = doc.y - boxTop + boxPadding;
  doc
    .roundedRect(PAGE.margin, boxTop, contentWidth(doc), boxHeight, 6)
    .lineWidth(0.5)
    .strokeColor(COLORS.hairline)
    .stroke();

  doc.y = boxTop + boxHeight + 8;
}

function renderPdf(content: MediationPdfContent): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const regularFont = fontPath("NotoSans-Regular.ttf");
    const boldFont = fontPath("NotoSans-Bold.ttf");

    const doc = new PDFDocument({
      size: "A4",
      margins: {
        top: PAGE.margin,
        // Keep automatic text pagination above the reserved footer band.
        bottom: PAGE.margin + PAGE.footerReserve,
        left: PAGE.margin,
        right: PAGE.margin,
      },
      bufferPages: true,
      info: {
        Title: content.title,
        Author: content.companyName,
        Producer: "PsyLex",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.on("pageAdded", () => {
      doc.font(regularFont);
      drawDocumentHeader(doc, regularFont, boldFont, content);
      doc.y = PAGE.headerBottom;
    });

    doc.font(regularFont);
    drawDocumentHeader(doc, regularFont, boldFont, content);
    doc.y = PAGE.headerBottom;

    addTopDisclaimer(doc, regularFont, content.topDisclaimer);
    addTitleBlock(doc, boldFont, regularFont, content.title, content.generatedAt);

    for (const section of content.sections) {
      addSection(doc, regularFont, boldFont, section);
    }

    if (content.agreementBody) {
      addTextBlock(
        doc,
        regularFont,
        boldFont,
        content.agreementHeading ?? content.termsHeading,
        content.agreementBody,
      );
    }

    if (content.terms.length > 0) {
      ensureMinSpace(doc, 40);
      doc.font(boldFont).fontSize(12).fillColor(COLORS.ink).text(content.termsHeading);
      doc.moveDown(0.3);
      doc.font(regularFont).fontSize(10.5).fillColor(COLORS.ink);
      for (const term of content.terms) {
        ensureMinSpace(doc, 16);
        doc.text(`• ${term}`, {
          indent: 12,
          lineGap: 2,
          width: contentWidth(doc),
        });
      }
      doc.moveDown(0.55);
    }

    addDisclaimer(doc, regularFont, content.disclaimer);
    drawPageFooters(doc, regularFont, content.companyName);

    doc.end();
  });
}

export async function generateMediationPdf(content: MediationPdfContent): Promise<Buffer> {
  return renderPdf(content);
}
