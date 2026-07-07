import { generateMediationPdf } from "../lib/mediation/generate-pdf";
import { portalCopy } from "../lib/portal-i18n";

const copy = portalCopy.en;

function countPages(pdf: Buffer) {
  return pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g)?.length ?? 0;
}

async function countPagesFor(sections: { heading: string; body: string }[]) {
  const pdf = await generateMediationPdf({
    title: "Test",
    documentLabel: copy.mediationPdfDocumentTitle,
    companyName: copy.mediationPdfCompanyName,
    sections,
    terms: [],
    topDisclaimer: copy.mediationPdfTopDisclaimer,
    disclaimer: "Short disclaimer.",
    termsHeading: "Terms",
  });
  console.log(
    countPages(pdf),
    "pages for",
    sections.length,
    "sections, body len",
    sections[0]?.body.length ?? 0,
  );
}

const short = "One paragraph.";
const medium = Array.from({ length: 5 }, (_, i) => `Para ${i}: ${"word ".repeat(30)}`).join("\n\n");
const long = Array.from({ length: 20 }, (_, i) => `Para ${i}: ${"word ".repeat(30)}`).join("\n\n");

async function main() {
  await countPagesFor([{ heading: "A", body: short }]);
  await countPagesFor([{ heading: "A", body: medium }]);
  await countPagesFor([{ heading: "A", body: long }]);
  await countPagesFor([
    { heading: "A", body: long },
    { heading: "B", body: long },
  ]);
}

main().catch(console.error);
