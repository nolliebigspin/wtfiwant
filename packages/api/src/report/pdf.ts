import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { ActionPlanInput, Analysis, Locale } from "@wtfiwant/shared";
import PDFDocument from "pdfkit";
import { buildReportDocument } from "./document";

const fonts = {
  body: readFileSync(new URL("./fonts/NotoSans-Regular.ttf", import.meta.url)),
  bold: readFileSync(new URL("./fonts/NotoSans-Bold.ttf", import.meta.url)),
  display: readFileSync(
    new URL("./fonts/NotoSerif-Regular.ttf", import.meta.url),
  ),
};

/** Generated in memory. No private session URL or identifier is embedded. */
export async function renderCompassPdf(
  analysis: Analysis,
  locale: Locale,
  evidence: Record<string, unknown>,
  plan?: ActionPlanInput | null,
): Promise<Buffer> {
  const report = buildReportDocument(analysis, locale, evidence);
  const de = locale === "de";
  const pdf = new PDFDocument({
    size: "A4",
    margins: { top: 66, bottom: 66, left: 56, right: 56 },
    bufferPages: true,
    font: fileURLToPath(
      new URL("./fonts/NotoSans-Regular.ttf", import.meta.url),
    ),
    info: { Title: report.title, Author: "wtfiwant.app" },
    lang: locale,
  });
  pdf
    .registerFont("body", fonts.body)
    .registerFont("bold", fonts.bold)
    .registerFont("display", fonts.display);
  const output = new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);
  });
  const width = pdf.page.width - 112;
  const ensure = (height: number) => {
    if (pdf.y + height > pdf.page.height - 66) pdf.addPage();
  };
  const text = (value: string, size = 11, font = "body", color = "#30362d") => {
    pdf
      .font(font)
      .fontSize(size)
      .fillColor(color)
      .text(value, 56, pdf.y, { width, lineGap: 4, paragraphGap: 8 });
  };
  const rule = () => {
    pdf
      .moveTo(56, pdf.y)
      .lineTo(56 + width, pdf.y)
      .strokeColor("#d3d8c9")
      .lineWidth(0.7)
      .stroke();
    pdf.y += 22;
  };
  text("WTFIWANT / COMPASS", 10, "bold", "#556747");
  pdf.y = 155;
  text(
    de
      ? "Eine Richtung, die zu dir passt."
      : "A direction that feels like yours.",
    12,
    "body",
    "#556747",
  );
  pdf.moveDown();
  text(report.title, 36, "display", "#263626");
  pdf.moveDown(0.6);
  text(report.summary, 15);
  pdf.moveDown(1.5);
  rule();
  text(
    de ? "Dein persönlicher Wegweiser" : "Your personal field guide",
    12,
    "bold",
  );
  text(
    de
      ? "Lies ihn in Ruhe. Prüfe, was sich stimmig anfühlt. Nutze die ersten Schritte als kleine Experimente, nicht als feste Vorgaben."
      : "Read at your own pace. Notice what feels right. Use the first steps as small experiments, rather than fixed instructions.",
  );
  pdf.moveDown();
  text(report.disclaimer, 9, "body", "#65705e");
  pdf.addPage();
  let sectionIndex = 0;
  for (const section of report.sections.filter((item) => item.items.length)) {
    if (section === report.sections[6] && pdf.y > 120) pdf.addPage();
    ensure(240);
    if (sectionIndex > 0) {
      pdf.y += 20;
      rule();
    }
    text(
      `${String(++sectionIndex).padStart(2, "0")} / ${section.title}`,
      23,
      "display",
      "#263626",
    );
    pdf.moveDown(0.5);
    for (const item of section.items) {
      ensure(110);
      if (item.title) {
        text(item.title, 13, "bold");
        pdf.moveDown(0.2);
      }
      for (const paragraph of item.paragraphs) {
        text(paragraph);
        pdf.moveDown(0.3);
      }
      if (item.evidence.length)
        text(
          `${de ? "Grundlage" : "Evidence"}: ${item.evidence.map((value) => `[${value}]`).join(", ")}`,
          8.5,
          "body",
          "#65705e",
        );
      pdf.moveDown(1);
    }
  }
  if (plan) {
    ensure(180);
    rule();
    text(
      de ? "Dein gespeicherter Aktionsplan" : "Your saved action plan",
      23,
      "display",
      "#263626",
    );
    pdf.moveDown(0.5);
    const fields = de
      ? ["Richtung", "Experiment", "Jetzt", "Hindernis", "Wenn", "Dann"]
      : ["Direction", "Experiment", "Now", "Obstacle", "If", "Then"];
    [
      plan.direction,
      plan.experiment,
      plan.immediateAction,
      plan.obstacle,
      plan.ifCondition,
      plan.thenAction,
    ].forEach((value, index) => {
      ensure(80);
      text(fields[index], 10, "bold");
      text(value);
      pdf.moveDown(0.5);
    });
  }
  pdf.addPage();
  text(report.evidenceTitle, 26, "display", "#263626");
  pdf.moveDown(0.5);
  text(
    de
      ? "Die Nummern im Report verweisen auf diese ursprünglichen Antworten. Deine eigenen Worte bleiben unverändert."
      : "The numbers in the report refer to these original answers. Your own words remain unchanged.",
    10,
    "body",
    "#65705e",
  );
  pdf.moveDown(1);
  for (const item of report.evidence) {
    ensure(100);
    text(`[${item.number}] ${item.label}`, 11, "bold");
    pdf.moveDown(0.3);
    text(item.body, 10);
    pdf.moveDown(1);
  }
  const range = pdf.bufferedPageRange();
  for (let index = 0; index < range.count; index++) {
    pdf.switchToPage(index);
    // Footer lies inside a temporarily extended bottom margin to avoid new pages.
    pdf.page.margins.bottom = 20;
    pdf
      .font("body")
      .fontSize(8)
      .fillColor("#65705e")
      .text(
        `wtfiwant.app  /  ${de ? "Nur für dich" : "Just for you"}`,
        56,
        pdf.page.height - 40,
        { lineBreak: false },
      );
    pdf.text(
      `${index + 1} / ${range.count}`,
      pdf.page.width - 100,
      pdf.page.height - 40,
      { width: 44, align: "right", lineBreak: false },
    );
  }
  pdf.end();
  return output;
}
