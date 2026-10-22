import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  type ActionPlanInput,
  type Analysis,
  type Compass,
  compassPath,
  type Locale,
} from "@wtfiwant/shared";
import PDFDocument from "pdfkit";
import { buildReportDocument } from "./document";

const fontUrl = new URL("./fonts/NotoSans-Regular.ttf", import.meta.url);
const fonts = {
  body: readFileSync(fontUrl),
  bold: readFileSync(new URL("./fonts/NotoSans-Bold.ttf", import.meta.url)),
  display: readFileSync(
    new URL("./fonts/NotoSerif-Regular.ttf", import.meta.url),
  ),
};
const palette = {
  ink: "#23392D",
  body: "#34433A",
  muted: "#647067",
  paper: "#FAF8F2",
  white: "#FFFFFF",
  sage: "#EAF0E5",
  lime: "#D5E7AC",
  line: "#D8DED3",
  sand: "#F2EADF",
};

/** Native PDF vectors: selectable text, usable in print, no invented scores. */
export async function renderDesignedCompassPdf(
  analysis: Analysis & { compass: Compass },
  locale: Locale,
  source: Record<string, unknown>,
  savedPlan?: ActionPlanInput | null,
): Promise<Buffer> {
  const report = buildReportDocument(analysis, locale, source);
  const c = analysis.compass;
  const de = locale === "de";
  const pdf = new PDFDocument({
    size: "A4",
    margin: 44,
    margins: { top: 76, bottom: 55, left: 44, right: 44 },
    bufferPages: true,
    autoFirstPage: false,
    font: fileURLToPath(fontUrl),
    info: {
      Title: report.title,
      Author: "wtfiwant.app",
      Subject: de
        ? "Deine Richtung, Entscheidungen und nächsten Schritte"
        : "Your direction, decisions and next steps",
    },
    lang: locale,
  });
  pdf
    .registerFont("body", fonts.body)
    .registerFont("bold", fonts.bold)
    .registerFont("display", fonts.display);
  const result = new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);
  });
  const left = 44,
    width = 507.28,
    bottom = 786.89;
  let section = "";
  const measure = (value: string, w = width, size = 10, font = "body") =>
    pdf
      .font(font)
      .fontSize(size)
      .heightOfString(value, { width: w, lineGap: 2.5 });
  const at = (
    value: string,
    x: number,
    y: number,
    w: number,
    size = 10,
    font = "body",
    color = palette.body,
  ) => {
    pdf
      .font(font)
      .fontSize(size)
      .fillColor(color)
      .text(value, x, y, { width: w, lineGap: 2.5 });
  };
  const line = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color = palette.line,
  ) =>
    pdf
      .save()
      .moveTo(x1, y1)
      .lineTo(x2, y2)
      .strokeColor(color)
      .lineWidth(0.8)
      .stroke()
      .restore();
  pdf.on("pageAdded", () => {
    pdf
      .save()
      .rect(0, 0, pdf.page.width, pdf.page.height)
      .fill(palette.paper)
      .restore();
    at("wtfiwant.", left, 24, 130, 11, "bold", palette.ink);
    at(section.toUpperCase(), 190, 26, 361, 7, "bold", palette.muted);
    line(left, 49, left + width, 49);
    pdf.y = 76;
  });
  const newPage = (name: string) => {
    section = name;
    pdf.addPage();
  };
  const ensure = (h: number) => {
    if (pdf.y + Math.min(h, 710) > bottom && pdf.y > 77) pdf.addPage();
  };
  const paragraph = (value: string, size = 10, color = palette.body) => {
    ensure(measure(value, width, size) + 10);
    at(value, left, pdf.y, width, size, "body", color);
    pdf.y += 10;
  };
  const title = (number: string, heading: string, description?: string) => {
    pdf.outline.addItem(heading);
    at(number, left, pdf.y, width, 8.5, "bold", palette.muted);
    pdf.y += 10;
    at(heading, left, pdf.y, width, 26, "display", palette.ink);
    pdf.y += 13;
    if (description) paragraph(description, 10, palette.muted);
    pdf.y += 7;
  };
  const refs = (ids: string[]) =>
    report.evidence
      .filter((item) => ids.includes(item.id))
      .map((item) => item.number);
  const sourceLine = (numbers: number[], x: number, y: number, w: number) => {
    if (numbers.length)
      at(
        `${de ? "Deine Antworten" : "Your answers"} ${numbers.map((n) => `[${n}]`).join(" ")}`,
        x,
        y,
        w,
        7.5,
        "body",
        palette.muted,
      );
  };
  const card = (
    heading: string,
    paragraphs: string[],
    options: {
      tone?: string;
      ids?: string[];
      label?: string;
      compact?: boolean;
    } = {},
  ) => {
    const inset = options.compact ? 8 : 12,
      w = width - inset * 2;
    const bodySize = options.compact ? 9.2 : 10;
    const headingSize = options.compact ? 10.5 : 12;
    const sourceNumbers = refs(options.ids ?? []);
    const labelH = options.label
      ? measure(options.label, w, 7.5, "bold") + 8
      : 0;
    const headingH = heading ? measure(heading, w, headingSize, "bold") + 7 : 0;
    const h =
      inset * 2 +
      labelH +
      headingH +
      paragraphs.reduce((sum, p) => sum + measure(p, w, bodySize) + 6, 0) +
      (sourceNumbers.length ? 14 : 0);
    ensure(h + (options.compact ? 6 : 12));
    if (h > 700) {
      // Long user text remains complete and flows across pages without a clipped box.
      if (heading) {
        at(heading, left, pdf.y, width, 12, "bold", palette.ink);
        pdf.y += 10;
      }
      paragraphs.forEach((p) => {
        paragraph(p);
      });
      sourceLine(sourceNumbers, left, pdf.y, width);
      pdf.y += 28;
      return;
    }
    const y = pdf.y;
    pdf
      .save()
      .roundedRect(left, y, width, h, 8)
      .fill(options.tone ?? palette.white)
      .restore();
    let cursor = y + inset;
    if (options.label) {
      at(
        options.label.toUpperCase(),
        left + inset,
        cursor,
        w,
        7.5,
        "bold",
        palette.muted,
      );
      cursor += labelH;
    }
    if (heading) {
      at(heading, left + inset, cursor, w, headingSize, "bold", palette.ink);
      cursor += headingH;
    }
    for (const p of paragraphs) {
      at(p, left + inset, cursor, w, bodySize);
      cursor += measure(p, w, bodySize) + 6;
    }
    sourceLine(sourceNumbers, left + inset, cursor, w);
    pdf.y = y + h + (options.compact ? 6 : 8);
  };
  const star = (x: number, y: number, radius: number) => {
    pdf.save().strokeColor(palette.ink).lineWidth(0.8);
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * i) / 4;
      const r = i % 2 ? radius * 0.55 : radius;
      pdf
        .moveTo(x, y)
        .lineTo(x + Math.sin(angle) * r, y - Math.cos(angle) * r)
        .stroke();
    }
    pdf
      .circle(x, y, radius * 0.26)
      .stroke()
      .restore();
  };

  // A compact orientation map links enduring direction to a concrete action.
  newPage(de ? "Dein Kompass" : "Your Compass");
  star(525, 102, 24);
  at(
    de
      ? "DEINE RICHTUNG. DEIN NÄCHSTER SCHRITT."
      : "YOUR DIRECTION. YOUR NEXT STEP.",
    left,
    82,
    420,
    8.5,
    "bold",
    palette.muted,
  );
  at(report.headline, left, 114, 447, 30, "display", palette.ink);
  pdf.y += 20;
  const quoteSize =
    measure(c.northStar, width - 40, 21, "display") > 270 ? 16.5 : 21;
  const quoteH = measure(c.northStar, width - 40, quoteSize, "display") + 42;
  ensure(quoteH + 40);
  let y = pdf.y;
  pdf
    .save()
    .roundedRect(left, y, width, quoteH, 10)
    .fill(palette.sage)
    .restore();
  at(
    c.northStar,
    left + 20,
    y + 20,
    width - 40,
    quoteSize,
    "display",
    palette.ink,
  );
  pdf.y = y + quoteH + 12;
  paragraph(report.directionStatus ?? "", 8, palette.muted);
  const path = compassPath(c, locale).map((item, index) => ({
    ...item,
    label: `0${index + 1} / ${item.label}`,
  }));
  const gap = 18,
    column = (width - gap * 2) / 3;
  const pathH =
    Math.max(...path.map((item) => measure(item.body, column - 24, 9.3))) + 68;
  if (pathH > 390) {
    path.forEach((item) => {
      card(item.label, [item.body]);
    });
  } else {
    ensure(pathH + 45);
    y = pdf.y + 9;
    for (let index = 0; index < path.length; index++) {
      const x = left + index * (column + gap);
      if (index < 2) {
        line(x + column, y + 15, x + column + gap, y + 15, palette.muted);
        pdf
          .save()
          .moveTo(x + column + gap - 5, y + 12)
          .lineTo(x + column + gap, y + 15)
          .lineTo(x + column + gap - 5, y + 18)
          .strokeColor(palette.muted)
          .stroke()
          .restore();
      }
      pdf
        .save()
        .roundedRect(x, y, column, pathH, 7)
        .fill(index === 2 ? palette.lime : palette.white)
        .restore();
      at(
        path[index].label,
        x + 12,
        y + 12,
        column - 24,
        7.2,
        "bold",
        palette.ink,
      );
      at(path[index].body, x + 12, y + 39, column - 24, 9.3);
    }
    pdf.y = y + pathH + 18;
  }
  paragraph(
    de
      ? "Deine Richtung ist in deinen Worten festgehalten. Ziel und Plan sind Vorschläge zum Ausprobieren; du kannst Umfang und Zeitpunkt an deinen Alltag anpassen."
      : "Your direction is preserved in your words. The goal and plan are proposals to try; adapt their scope and timing to your life.",
    8.5,
    palette.muted,
  );

  card(
    de ? "So beginnst du" : "How to begin",
    [
      `${de ? "Passender Zeitpunkt" : "Suggested timing"}: ${c.firstAction.when}`,
      `${de ? "Der Schritt ist getan, wenn" : "This step is done when"}: ${c.firstAction.doneWhen}`,
    ],
    { ids: c.firstAction.evidenceQuestionIds ?? [], compact: true },
  );

  const quotes = report.evidence
    .flatMap((item) => {
      const value = source[item.id];
      const text =
        typeof value === "string" && item.id !== "noise.private_desire"
          ? value
          : value &&
              typeof value === "object" &&
              "answer" in value &&
              typeof value.answer === "string"
            ? value.answer
            : null;
      return text && item.id !== "direction:review" ? [{ ...item, text }] : [];
    })
    .slice(0, 1);
  for (const quote of quotes) {
    const excerpt =
      quote.text.length > 230
        ? `${quote.text.slice(0, 230).replace(/\s+\S*$/, "")}…`
        : quote.text;
    if (pdf.y + measure(excerpt, width - 24, 12, "bold") + 60 > bottom)
      continue;
    card(de ? `„${excerpt}“` : `“${excerpt}”`, [], {
      tone: palette.sand,
      label: `${de ? "Aus deiner Antwort" : "From your answer"} [${quote.number}]`,
    });
  }

  newPage(de ? "Warum diese Richtung" : "Why this direction");
  title(
    de ? "01 / VERSTEHEN" : "01 / UNDERSTAND",
    de ? "Was deine Antworten verbindet" : "What connects your answers",
  );
  card(de ? "Der rote Faden" : "The connecting thread", [c.whyThisFits], {
    tone: palette.sage,
    ids: c.evidenceQuestionIds,
  });
  const actualAreas = c.lifeAreas.filter((area) => area.basis === "answered");
  for (const area of actualAreas)
    card(area.area, [area.observation], { ids: area.evidenceQuestionIds });

  newPage(de ? "Ziel und Leitplanken" : "Goal and guardrails");
  title(
    de ? "02 / AUSRICHTEN" : "02 / ALIGN",
    de ? "Woran du Fortschritt erkennst" : "How to recognise progress",
    de
      ? "Ein Ziel für die nächsten 90 Tage. Fortschritt darf auch eine geklärte Entscheidung sein."
      : "A goal for the next 90 days. Progress can also mean reaching a clearer decision.",
  );
  card(
    de ? "Dein 90-Tage-Ziel" : "Your 90-day goal",
    [c.goal.outcome, c.goal.why],
    {
      tone: palette.sage,
      ids: c.goal.evidenceQuestionIds ?? c.evidenceQuestionIds,
    },
  );
  card(
    de ? "Daran kannst du es erkennen" : "What to look for",
    c.goal.progress.map((p) => `\u25a1  ${p}`),
  );
  card(
    de ? "Dein Einfluss und seine Grenzen" : "Your influence and its limits",
    [c.goal.withinYourControl],
  );
  if (c.protectedConditions.length)
    card(
      de ? "Deine Leitplanken" : "Your guardrails",
      c.protectedConditions.map((item) => item.condition),
      {
        tone: palette.sand,
        ids: c.protectedConditions.flatMap((item) => item.evidenceQuestionIds),
      },
    );

  newPage(de ? "Dein Vier-Wochen-Fahrplan" : "Your four-week roadmap");
  title(
    de ? "03 / AUSPROBIEREN" : "03 / TRY",
    de
      ? "Von der Richtung in den Alltag"
      : "Bring your direction into everyday life",
    de
      ? "Vier Etappen, kein Leistungstest. Passe sie an deine Zeit und die tatsächlichen Möglichkeiten an."
      : "Four stages, not a performance test. Adapt them to your time and actual circumstances.",
  );
  for (const week of c.weeks) {
    const x = left + 44,
      w = width - 44;
    const h =
      measure(week.focus, w - 24, 11, "bold") +
      measure(week.action, w - 24, 9.7) +
      measure(
        `${de ? "Erledigt, wenn" : "Done when"}: ${week.doneWhen}`,
        w - 24,
        8.5,
      ) +
      43;
    ensure(h + 12);
    y = pdf.y;
    if (h > 690) {
      card(`${de ? "Woche" : "Week"} ${week.week} / ${week.focus}`, [
        week.action,
        `${de ? "Erledigt, wenn" : "Done when"}: ${week.doneWhen}`,
      ]);
      continue;
    }
    line(left + 15, y + 31, left + 15, y + h, palette.line);
    pdf
      .save()
      .circle(left + 15, y + 15, 14)
      .fill(palette.ink)
      .restore();
    at(String(week.week), left + 11, y + 7, 12, 10, "bold", palette.white);
    pdf.save().roundedRect(x, y, w, h, 8).fill(palette.white).restore();
    let cursor = y + 12;
    at(
      week.focus.replace(/[.!]$/, ""),
      x + 12,
      cursor,
      w - 24,
      11,
      "bold",
      palette.ink,
    );
    cursor += measure(week.focus.replace(/[.!]$/, ""), w - 24, 11, "bold") + 8;
    at(week.action, x + 12, cursor, w - 24, 9.7);
    cursor += measure(week.action, w - 24, 9.7) + 10;
    at(
      `${de ? "Erledigt, wenn" : "Done when"}: ${week.doneWhen}`,
      x + 12,
      cursor,
      w - 24,
      8.5,
      "body",
      palette.muted,
    );
    pdf.y = y + h + 10;
  }

  newPage(de ? "Hürden und Entscheidungen" : "Obstacles and decisions");
  title(
    de ? "04 / ENTSCHEIDEN" : "04 / DECIDE",
    de ? "Wenn der Alltag dazwischenkommt" : "When life gets in the way",
  );
  for (const obstacle of c.obstacles)
    card(obstacle.obstacle, [obstacle.response], {
      ids: obstacle.evidenceQuestionIds ?? [],
    });
  const ruleWidth =
    (width - 12 * (c.decisionRules.length - 1)) / c.decisionRules.length;
  const ruleHeight = Math.max(
    ...c.decisionRules.map(
      (rule) =>
        measure(rule.situation, ruleWidth - 24, 10, "bold") +
        measure(rule.rule, ruleWidth - 24, 9.2) +
        52,
    ),
  );
  if (ruleHeight > 600) {
    for (const rule of c.decisionRules)
      card(rule.situation, [rule.rule], {
        tone: palette.sage,
        ids: rule.evidenceQuestionIds ?? [],
      });
  } else {
    ensure(ruleHeight + 35);
    at(
      de ? "DEIN ENTSCHEIDUNGSFILTER" : "YOUR DECISION FILTER",
      left,
      pdf.y,
      width,
      8,
      "bold",
      palette.muted,
    );
    y = pdf.y + 12;
    c.decisionRules.forEach((rule, index) => {
      const x = left + index * (ruleWidth + 12);
      pdf
        .save()
        .roundedRect(x, y, ruleWidth, ruleHeight, 8)
        .fill(palette.sage)
        .restore();
      at(
        rule.situation,
        x + 12,
        y + 12,
        ruleWidth - 24,
        10,
        "bold",
        palette.ink,
      );
      const cursor =
        y + 20 + measure(rule.situation, ruleWidth - 24, 10, "bold");
      at(rule.rule, x + 12, cursor, ruleWidth - 24, 9.2);
      sourceLine(
        refs(rule.evidenceQuestionIds ?? []),
        x + 12,
        cursor + measure(rule.rule, ruleWidth - 24, 9.2) + 8,
        ruleWidth - 24,
      );
    });
    pdf.y = y + ruleHeight + 12;
  }

  newPage(de ? "Dein Rückblick" : "Your review");
  title(
    de ? "05 / KURS PRÜFEN" : "05 / REVIEW",
    de ? "Was du aus dem Versuch mitnimmst" : "What you learn from trying",
  );
  paragraph(c.review.when, 10, palette.muted);
  for (const question of c.review.questions) {
    const h = measure(question, width - 28, 11, "bold") + 43;
    ensure(h);
    y = pdf.y;
    pdf
      .save()
      .rect(left + 1, y + 3, 8, 8)
      .lineWidth(0.8)
      .strokeColor(palette.muted)
      .stroke()
      .restore();
    at(question, left + 24, y, width - 24, 11, "bold", palette.ink);
    line(left + 24, y + h - 16, left + width, y + h - 16);
    pdf.y = y + h;
  }
  const choices = [
    {
      heading: de ? "Fortsetzen" : "Continue",
      text: c.review.continueIf,
      color: palette.sage,
    },
    {
      heading: de ? "Anpassen" : "Adjust",
      text: c.review.adjustIf,
      color: palette.sand,
    },
    {
      heading: de ? "Versuch pausieren" : "Pause the trial",
      text: c.review.stopIf,
      color: palette.white,
    },
  ];
  const choiceW = (width - 24) / 3;
  const choiceH =
    Math.max(...choices.map((item) => measure(item.text, choiceW - 24, 9.2))) +
    64;
  if (choiceH > 490)
    choices.forEach((choice) => {
      card(choice.heading, [choice.text], { tone: choice.color });
    });
  else {
    ensure(choiceH + 34);
    y = pdf.y + 22;
    line(left + width / 2, y - 16, left + width / 2, y - 6);
    line(left + choiceW / 2, y - 6, left + width - choiceW / 2, y - 6);
    choices.forEach((choice, index) => {
      const x = left + index * (choiceW + 12);
      line(x + choiceW / 2, y - 6, x + choiceW / 2, y);
      pdf
        .save()
        .roundedRect(x, y, choiceW, choiceH, 7)
        .fill(choice.color)
        .restore();
      at(
        choice.heading,
        x + 12,
        y + 12,
        choiceW - 24,
        10.3,
        "bold",
        palette.ink,
      );
      at(choice.text, x + 12, y + 40, choiceW - 24, 9.2);
    });
    pdf.y = y + choiceH + 16;
  }

  newPage(
    de ? "Alternativen und offene Fragen" : "Alternatives and open questions",
  );
  title(
    de ? "06 / WEITERDENKEN" : "06 / EXPLORE",
    de ? "Dein Kurs darf sich verändern" : "Your course can change",
  );
  card(
    de ? "Wenn der erste Weg nicht passt" : "If the first path does not fit",
    [c.alternative.direction, c.alternative.whenToConsider],
    { tone: palette.sage },
  );
  for (const question of c.openQuestions)
    card(question.question, [question.howToExplore]);
  ensure(210);
  at(
    de ? "Deine Entscheidung nach dem Versuch" : "Your decision after trying",
    left,
    pdf.y,
    width,
    13,
    "bold",
    palette.ink,
  );
  pdf.y += 14;
  for (const prompt of de
    ? [
        "Das möchte ich beibehalten",
        "Das möchte ich verändern",
        "Mein nächster Schritt",
      ]
    : ["What I want to keep", "What I want to change", "My next step"]) {
    ensure(58);
    at(prompt, left, pdf.y, width, 10, "body", palette.muted);
    pdf.y += 24;
    line(left, pdf.y, left + width, pdf.y);
    pdf.y += 22;
  }
  paragraph(report.disclaimer, 8, palette.muted);
  if (savedPlan) {
    newPage(de ? "Dein eigener Aktionsplan" : "Your own action plan");
    title(
      "+",
      de ? "Deine gespeicherten Anpassungen" : "Your saved adjustments",
    );
    const fields = de
      ? [
          "Richtung",
          "Experiment",
          "Nächster Schritt",
          "Hindernis",
          "Wenn",
          "Dann",
        ]
      : ["Direction", "Experiment", "Next step", "Obstacle", "If", "Then"];
    [
      savedPlan.direction,
      savedPlan.experiment,
      savedPlan.immediateAction,
      savedPlan.obstacle,
      savedPlan.ifCondition,
      savedPlan.thenAction,
    ].forEach((value, index) => {
      card(fields[index], [value]);
    });
  }
  newPage(de ? "Anhang / Deine Antworten" : "Appendix / Your answers");
  title(
    de ? "ZUM NACHLESEN" : "FOR REFERENCE",
    report.evidenceTitle,
    de
      ? "Die Verweise führen zu deinen gespeicherten Antworten. Deine eigenen Worte bleiben unverändert; Aussagen und Vorschläge im Hauptteil kannst du daran prüfen."
      : "References point to your saved answers. Your own words remain unchanged; use them to check the observations and proposals in the report.",
  );
  for (const item of report.evidence) {
    card(`[${item.number}] ${item.label}`, [item.body], { compact: true });
  }
  const count = pdf.bufferedPageRange().count;
  for (let index = 0; index < count; index++) {
    pdf.switchToPage(index);
    pdf.page.margins.bottom = 15;
    line(left, 808, left + width, 808);
    at(
      de ? "WTFIWANT / NUR FÜR DICH" : "WTFIWANT / JUST FOR YOU",
      left,
      817,
      380,
      7,
      "bold",
      palette.muted,
    );
    at(
      `${String(index + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`,
      510,
      817,
      42,
      7,
      "body",
      palette.muted,
    );
  }
  pdf.end();
  return result;
}
