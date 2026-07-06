import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { generateMediationPdf } from "../lib/mediation/generate-pdf";
import { portalCopy } from "../lib/portal-i18n";

async function main() {
  const uk = portalCopy.uk;

  const pdf = await generateMediationPdf({
    title: "Проєкт медіаційної угоди",
    body: [
      "Сторони дійшли згоди щодо наступного варіанту вирішення спору.",
      "Сторона А отримує компенсацію в розмірі 15 000 грн протягом 30 днів.",
      "Сторона Б зберігає право користування спільним майном згідно з домовленістю.",
      "Текст містить кирилицю: їж і ґава — перевірка кодування UTF-8.",
    ].join("\n\n"),
    terms: [
      "Виплата здійснюється банківським переказом",
      "Передача майна оформлюється актом приймання-передачі",
      "Сторони відмовляються від подальших вимог по цьому спору",
    ],
    disclaimer: uk.mediationUplDisclaimer,
    termsHeading: "Умови",
  });

  const outDir = path.join(process.cwd(), "tmp");
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "mediation-cyrillic-test.pdf");
  writeFileSync(outPath, pdf);

  console.log(`Wrote ${outPath} (${pdf.length} bytes)`);
  console.log("Open the PDF and verify Ukrainian / Cyrillic text renders correctly.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
