import path from "node:path";
import PDFDocument from "pdfkit";

export type MediationPdfSection = {
  heading: string;
  body: string;
};

export type MediationPdfContent = {
  title: string;
  sections: MediationPdfSection[];
  agreementBody?: string;
  terms: string[];
  disclaimer: string;
  termsHeading: string;
  agreementHeading?: string;
};

function fontPath(filename: string) {
  return path.join(process.cwd(), "assets", "fonts", filename);
}

function addSection(
  doc: PDFKit.PDFDocument,
  regularFont: string,
  boldFont: string,
  section: MediationPdfSection,
) {
  doc.moveDown(0.75);
  doc.font(boldFont).fontSize(13).fillColor("#000000").text(section.heading);
  doc.moveDown(0.4);
  doc.font(regularFont).fontSize(11).text(section.body, {
    align: "left",
    lineGap: 4,
  });
}

function renderPdf(content: MediationPdfContent): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const regularFont = fontPath("NotoSans-Regular.ttf");
    const boldFont = fontPath("NotoSans-Bold.ttf");

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 56, bottom: 56, left: 56, right: 56 },
      info: {
        Title: content.title,
        Producer: "PsyLex",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.font(regularFont);

    doc.font(boldFont).fontSize(18).text(content.title, { align: "left" });

    for (const section of content.sections) {
      addSection(doc, regularFont, boldFont, section);
    }

    if (content.agreementBody) {
      doc.moveDown(0.75);
      doc
        .font(boldFont)
        .fontSize(13)
        .text(content.agreementHeading ?? content.termsHeading);
      doc.moveDown(0.4);
      doc.font(regularFont).fontSize(11).text(content.agreementBody, {
        align: "left",
        lineGap: 4,
      });
    }

    if (content.terms.length > 0) {
      doc.moveDown(0.75);
      doc.font(boldFont).fontSize(13).text(content.termsHeading);
      doc.moveDown(0.4);
      doc.font(regularFont).fontSize(11);
      for (const term of content.terms) {
        doc.text(`• ${term}`, { indent: 12, lineGap: 3 });
      }
    }

    doc.moveDown(1.5);
    doc
      .font(regularFont)
      .fontSize(9)
      .fillColor("#444444")
      .text(content.disclaimer, { align: "left", lineGap: 3 });

    doc.end();
  });
}

export async function generateMediationPdf(content: MediationPdfContent): Promise<Buffer> {
  return renderPdf(content);
}
