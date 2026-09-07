import type { Analysis, Locale } from "@wtfiwant/shared";
import type { ReportPurchase } from "../repositories/types";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function items(values: string[]): string {
  return `<ul>${values.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul>`;
}

function evidence(
  ids: string[],
  de: boolean,
  answers: Record<string, unknown>,
): string {
  const values = ids
    .filter((id) => id in answers)
    .map(
      (id) =>
        `<li><strong>${escapeHtml(id)}</strong><br>${escapeHtml(formatEvidenceValue(answers[id]))}</li>`,
    )
    .join("");
  return `<div style="font-size:12px;color:#68635b"><strong>${de ? "Belege" : "Evidence"}:</strong><ul>${values}</ul></div>`;
}

function formatEvidenceValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(formatEvidenceValue).join(", ");
  if (value && typeof value === "object")
    return Object.entries(value)
      .map(([key, item]) => `${key}: ${formatEvidenceValue(item)}`)
      .join(" · ");
  return String(value ?? "");
}

function textEvidence(
  ids: string[],
  de: boolean,
  answers: Record<string, unknown>,
): string {
  const values = ids
    .filter((id) => id in answers)
    .map((id) => `${id}: ${formatEvidenceValue(answers[id])}`)
    .join(" | ");
  return `${de ? "Belege" : "Evidence"}: ${values}`;
}

export function buildEmailEvidence(
  analysis: Analysis,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const ids = new Set([
    ...analysis.coreDrivers.flatMap((item) => item.evidenceQuestionIds),
    ...analysis.tensions.flatMap((item) => item.evidenceQuestionIds),
    ...analysis.antiLife.evidenceQuestionIds,
    ...analysis.externalInfluences.flatMap((item) => item.evidenceQuestionIds),
    ...analysis.possibleDirections.flatMap((item) => item.evidenceQuestionIds),
    ...analysis.goals.flatMap((item) => item.evidenceQuestionIds),
    ...analysis.firstSteps.flatMap((item) => item.evidenceQuestionIds),
  ]);
  return Object.fromEntries(
    [...ids].flatMap((id) => (id in source ? [[id, source[id]]] : [])),
  );
}

export function renderFullCompassEmail(
  analysis: Analysis,
  locale: Locale,
  resultUrl: string,
  evidenceAnswers: Record<string, unknown> = {},
  purchase?: ReportPurchase,
): { subject: string; html: string; text: string } {
  const de = locale === "de";
  const section = (title: string, body: string) =>
    `<section><h2>${escapeHtml(title)}</h2>${body}</section>`;
  const confirmation = purchaseConfirmation(purchase);
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;line-height:1.55;color:#201d18;max-width:720px;margin:auto;padding:32px">
    <p style="font-size:12px;letter-spacing:.12em">${de ? "DEIN VOLLSTÄNDIGER KOMPASS" : "YOUR FULL COMPASS"}</p>
    <h1>${escapeHtml(analysis.summary)}</h1>
    ${section(de ? "Was wichtig zu sein scheint" : "What seems to matter", analysis.coreDrivers.map((driver) => `<h3>${escapeHtml(driver.name)}</h3><p>${escapeHtml(driver.explanation)}</p>${evidence(driver.evidenceQuestionIds, de, evidenceAnswers)}`).join(""))}
    ${section(de ? "Spannungen" : "Tensions", analysis.tensions.map((tension) => `<h3>${escapeHtml(tension.sideA)} ↔ ${escapeHtml(tension.sideB)}</h3><p>${escapeHtml(tension.explanation)}</p>${evidence(tension.evidenceQuestionIds, de, evidenceAnswers)}`).join(""))}
    ${section(de ? "Dein Anti-Leben" : "Your Anti-Life", `<p>${escapeHtml(analysis.antiLife.summary)}</p>${items(analysis.antiLife.themes)}${evidence(analysis.antiLife.evidenceQuestionIds, de, evidenceAnswers)}`)}
    ${section(de ? "Äußere Einflüsse" : "Outside influences", analysis.externalInfluences.map((item) => `<p>${escapeHtml(item.observation)}</p>${evidence(item.evidenceQuestionIds, de, evidenceAnswers)}`).join(""))}
    ${section(de ? "Richtungen zum Erkunden" : "Directions worth exploring", analysis.possibleDirections.map((direction) => `<h3>${escapeHtml(direction.title)}</h3><p>${escapeHtml(direction.explanation)}</p><p><strong>${de ? "Warum es passen könnte" : "Why it may fit"}:</strong> ${escapeHtml(direction.whyItFits)}</p>${evidence(direction.evidenceQuestionIds, de, evidenceAnswers)}`).join(""))}
    ${section(de ? "Unter deinen Zielen" : "Beneath your goals", analysis.goals.map((goal) => `<h3>${escapeHtml(goal.originalGoal)}</h3><p>${escapeHtml(goal.possibleUnderlyingNeed)}</p><p>${escapeHtml(goal.interpretation)}</p>${evidence(goal.evidenceQuestionIds, de, evidenceAnswers)}`).join(""))}
    ${section(de ? "Erste Schritte" : "First steps", analysis.firstSteps.map((step) => `<h3>${escapeHtml(step.direction)}</h3><p><strong>${de ? "Experiment" : "Experiment"}:</strong> ${escapeHtml(step.experiment)}</p><p><strong>${de ? "Jetzt" : "Now"}:</strong> ${escapeHtml(step.immediateAction)}</p>${evidence(step.evidenceQuestionIds, de, evidenceAnswers)}`).join(""))}
    <p><a href="${escapeHtml(resultUrl)}">${de ? "Privaten Kompass öffnen, Belege prüfen oder Reflexion löschen" : "Open your private Compass, inspect evidence, or delete this reflection"}</a></p>
    ${
      confirmation
        ? section(
            purchase?.agreement?.locale === "de"
              ? "Kaufbestätigung und digitale Bereitstellung"
              : "Purchase confirmation and digital delivery",
            confirmation
              .split("\n\n")
              .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
              .join(""),
          )
        : ""
    }
    <hr><p style="font-size:12px;color:#68635b">${de ? "Dies ist eine geführte Reflexion, keine Diagnose, Therapie oder Krisenhilfe." : "This is guided reflection, not diagnosis, therapy, or crisis support."}</p>
  </body></html>`;
  const text = [
    analysis.summary,
    ...(confirmation ? [confirmation] : []),
    ...analysis.coreDrivers.flatMap((driver) => [
      driver.name,
      driver.explanation,
      textEvidence(driver.evidenceQuestionIds, de, evidenceAnswers),
    ]),
    ...analysis.tensions.flatMap((tension) => [
      `${tension.sideA} / ${tension.sideB}`,
      tension.explanation,
      textEvidence(tension.evidenceQuestionIds, de, evidenceAnswers),
    ]),
    analysis.antiLife.summary,
    textEvidence(analysis.antiLife.evidenceQuestionIds, de, evidenceAnswers),
    ...analysis.externalInfluences.flatMap((influence) => [
      influence.observation,
      textEvidence(influence.evidenceQuestionIds, de, evidenceAnswers),
    ]),
    ...analysis.possibleDirections.flatMap((direction) => [
      direction.title,
      direction.explanation,
      direction.whyItFits,
      textEvidence(direction.evidenceQuestionIds, de, evidenceAnswers),
    ]),
    ...analysis.goals.flatMap((goal) => [
      goal.originalGoal,
      goal.possibleUnderlyingNeed,
      goal.interpretation,
      textEvidence(goal.evidenceQuestionIds, de, evidenceAnswers),
    ]),
    ...analysis.firstSteps.flatMap((step) => [
      step.direction,
      step.experiment,
      step.immediateAction,
      textEvidence(step.evidenceQuestionIds, de, evidenceAnswers),
    ]),
    de
      ? `Privaten Kompass öffnen, Belege prüfen oder Reflexion löschen: ${resultUrl}`
      : `Open your private Compass, inspect evidence, or delete this reflection: ${resultUrl}`,
  ].join("\n\n");
  return {
    subject: de ? "Dein vollständiger Kompass" : "Your Full Compass",
    html,
    text,
  };
}

function purchaseConfirmation(purchase?: ReportPurchase): string {
  if (!purchase?.agreement || !purchase.consentRecordedAt) return "";
  const { agreement } = purchase;
  const de = agreement.locale === "de";
  const total =
    purchase.amountTotal !== null && purchase.currency
      ? new Intl.NumberFormat(de ? "de-DE" : "en-US", {
          style: "currency",
          currency: purchase.currency,
        }).format(purchase.amountTotal / 100)
      : "";
  return [
    de
      ? "Kaufbestätigung: Vollständiger Kompass, einmaliger Premium-Kauf."
      : "Purchase confirmation: Full Compass, one-time premium purchase.",
    `${de ? "Bestellreferenz" : "Order reference"}: ${purchase.checkoutSessionId}`,
    `${de ? "Zahlung bestätigt (UTC)" : "Payment confirmed (UTC)"}: ${purchase.paidAt}`,
    `${de ? "Gesamtbetrag" : "Total paid"}: ${total}`,
    de
      ? "Du hast vor der Zahlung ausdrücklich folgende Erklärung bestätigt:"
      : "Before payment, you expressly confirmed the following statement:",
    agreement.statement,
    `${de ? "Textfassung" : "Text version"}: ${agreement.version}`,
    `${de ? "Zustimmung von Stripe abgerufen (UTC)" : "Consent retrieved from Stripe (UTC)"}: ${purchase.consentRecordedAt}`,
    de
      ? "Mit dieser E-Mail erhältst du den digitalen Inhalt und die Bestätigung deiner Zustimmung und Kenntnisnahme. Mit Beginn der Bereitstellung und Erhalt dieser Vertragsbestätigung erlischt dein Widerrufsrecht, soweit die gesetzlichen Voraussetzungen erfüllt sind. Andere zwingende gesetzliche Rechte, insbesondere bei Mängeln, bleiben unberührt."
      : "This email delivers the digital content and confirms your consent and acknowledgement. Once delivery has begun and you have received this contract confirmation, your withdrawal right expires where the statutory conditions are met. Other mandatory rights, including remedies for defects, remain unaffected.",
    agreement.terms,
    agreement.refundPolicy,
  ].join("\n\n");
}
