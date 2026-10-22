import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { ActionPlanInput, Analysis, Locale } from "@wtfiwant/shared";
import PDFDocument from "pdfkit";
import { renderDesignedCompassPdf } from "./compass-pdf";
import { buildReportDocument, type ReportItem } from "./document";

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
  if (analysis.compass)
    return renderDesignedCompassPdf(
      { ...analysis, compass: analysis.compass },
      locale,
      evidence,
      plan,
    );
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
    const usable = pdf.page.height - 132;
    if (pdf.y > 67 && pdf.y + Math.min(height, usable) > pdf.page.height - 66)
      pdf.addPage();
  };
  const text = (value: string, size = 11, font = "body", color = "#30362d") => {
    pdf
      .font(font)
      .fontSize(size)
      .fillColor(color)
      .text(value, 56, pdf.y, { width, lineGap: 4, paragraphGap: 8 });
  };
  const heightOf = (value: string, size = 11, font = "body") =>
    pdf
      .font(font)
      .fontSize(size)
      .heightOfString(value, { width, lineGap: 4, paragraphGap: 8 });
  const evidenceText = (item: ReportItem) =>
    `${de ? "Grundlage" : "Evidence"}: ${item.evidence.map((value) => `[${value}]`).join(", ")}`;
  const itemHeight = (item: ReportItem) =>
    (item.title ? heightOf(item.title, 13, "bold") + 5 : 0) +
    item.paragraphs.reduce(
      (total, paragraph) => total + heightOf(paragraph) + 5,
      0,
    ) +
    (item.evidence.length ? heightOf(evidenceText(item), 8.5) : 0) +
    20;
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
  pdf.y = report.compass ? 108 : 155;
  text(
    de
      ? "Eine Richtung, die zu dir passt."
      : "A direction that feels like yours.",
    12,
    "body",
    "#556747",
  );
  pdf.moveDown();
  text(
    report.compass
      ? de
        ? "Was du wirklich willst."
        : "What you actually want."
      : report.title,
    report.compass ? 29 : 36,
    "display",
    "#263626",
  );
  pdf.moveDown(0.6);
  text(report.summary, report.compass ? 17 : 15, "display");
  if (report.compass) {
    pdf.moveDown(0.5);
    text(report.directionStatus ?? "", 9, "bold", "#65705e");
    pdf.moveDown(1);
    text(
      de
        ? "Deine wichtigste Veränderung jetzt"
        : "Your most important change now",
      11,
      "bold",
    );
    text(report.compass.priority, 12);
    pdf.moveDown(0.6);
    ensure(110);
    text(de ? "Dein 90-Tage-Ziel" : "Your 90-day goal", 11, "bold");
    text(report.compass.goal.outcome, 12);
    pdf.moveDown(0.6);
    ensure(110);
    text(de ? "Dein nächster Schritt" : "Your next step", 11, "bold");
    text(report.compass.firstAction.action, 11);
    text(report.compass.firstAction.when, 9, "body", "#65705e");
  }
  if (report.compass) {
    const note = `${de ? "Ein anpassbarer Vorschlag für deinen Alltag." : "An adaptable proposal for your everyday life."} ${report.disclaimer}`;
    if (pdf.y + heightOf(note, 8) + 20 < pdf.page.height - 66) {
      pdf.moveDown(0.5);
      text(note, 8, "body", "#65705e");
    }
  } else {
    pdf.moveDown(1);
    rule();
    ensure(130);
    text(
      de ? "Dein persönlicher Wegweiser" : "Your personal field guide",
      12,
      "bold",
    );
    text(
      de
        ? "Dein Plan ist ein anpassbarer Vorschlag. Prüfe ihn an deinen Möglichkeiten. Setze den ersten Schritt um und nutze die Auswertung, um deine Richtung zu bestätigen oder zu verändern."
        : "Your plan is an adaptable proposal. Check it against your circumstances. Take the first step, then use the review to confirm or change your direction.",
    );
    pdf.moveDown();
    text(report.disclaimer, 9, "body", "#65705e");
  }
  pdf.addPage();
  let sectionIndex = 0;
  for (const section of report.sections.filter((item) => item.items.length)) {
    const heading = `${String(sectionIndex + 1).padStart(2, "0")} / ${section.title}`;
    ensure(
      heightOf(heading, 23, "display") + itemHeight(section.items[0]) + 60,
    );
    if (sectionIndex > 0 && pdf.y > 67) {
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
    for (const [itemIndex, item] of section.items.entries()) {
      if (itemIndex > 0) ensure(itemHeight(item));
      if (item.title) {
        text(item.title, 13, "bold");
        pdf.moveDown(0.2);
      }
      for (const paragraph of item.paragraphs) {
        text(paragraph);
        pdf.moveDown(0.3);
      }
      if (item.evidence.length)
        text(evidenceText(item), 8.5, "body", "#65705e");
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
      ensure(heightOf(fields[index], 10, "bold") + heightOf(value) + 20);
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
    ensure(
      heightOf(`[${item.number}] ${item.label}`, 11, "bold") +
        heightOf(item.body, 10) +
        24,
    );
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
