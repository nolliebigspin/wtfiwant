import type { Analysis, Locale } from "@wtfiwant/shared";
import { buildReportDocument } from "../report/document";
import type { ReportPurchase } from "../repositories/types";

export { buildEmailEvidence } from "./evidence";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderFullCompassEmail(
  analysis: Analysis,
  locale: Locale,
  resultUrl: string,
  evidenceAnswers: Record<string, unknown> = {},
  purchase?: ReportPurchase,
): { subject: string; html: string; text: string } {
  const de = locale === "de";
  const doc = buildReportDocument(analysis, locale, evidenceAnswers);
  const confirmation = purchaseConfirmation(purchase);
  const escaped = escapeHtml;
  const paragraph = (value: string) =>
    `<p style="margin:12px 0;white-space:pre-wrap">${escaped(value)}</p>`;
  const references = (values: number[]) =>
    values.length
      ? `${de ? "Grundlage" : "Evidence"}: ${values.map((value) => `[${value}]`).join(", ")}`
      : "";
  const pdfUrl = `${resultUrl.replace(
    /\/(en|de)\/result\/([^/?#]+).*$/,
    "/api/sessions/$2/report.pdf",
  )}?locale=${locale}`;
  const html = `<!doctype html><html lang="${locale}"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f4f1e9;font-family:Arial,sans-serif;color:#24271f;line-height:1.65">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:24px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:auto;background:#fffdf8"><tr><td style="padding:36px 28px">
<p style="font-size:12px;font-weight:bold;letter-spacing:2px;margin:0 0 32px">WTFIWANT / COMPASS</p>
<p style="font-size:12px;text-transform:uppercase;color:#667056">${de ? "Eine Richtung, die zu dir passt" : "A direction that feels like yours"}</p>
<h1 style="font-family:Georgia,serif;font-size:36px;line-height:1.15;font-weight:normal">${escaped(doc.title)}</h1>
<p style="font-size:18px;line-height:1.65">${escaped(doc.summary)}</p>
${doc.compass ? `<p style="font-size:12px;color:#667056">${escaped(doc.directionStatus ?? "")}</p><h2>${de ? "Deine wichtigste Veränderung jetzt" : "Your most important change now"}</h2>${paragraph(doc.compass.priority)}<h2>${de ? "Dein 90-Tage-Ziel" : "Your 90-day goal"}</h2>${paragraph(doc.compass.goal.outcome)}<h2>${de ? "Dein nächster Schritt" : "Your next step"}</h2>${paragraph(doc.compass.firstAction.action)}${paragraph(doc.compass.firstAction.when)}` : ""}
<p style="margin:28px 0"><a href="${escaped(pdfUrl)}" style="display:inline-block;background:#263626;color:#fff;padding:12px 20px;text-decoration:none;border-radius:4px">${de ? "Kompass als PDF speichern" : "Save your Compass as PDF"}</a></p>
${doc.sections
  .filter((section) => section.items.length)
  .map(
    (section, index) =>
      `<section style="margin-top:36px;border-top:1px solid #d8dccd;padding-top:20px"><p style="font-size:11px;color:#667056;letter-spacing:2px">0${index + 1}</p><h2 style="font-family:Georgia,serif;font-size:26px;line-height:1.25;font-weight:normal">${escaped(section.title)}</h2>${section.items.map((item) => `<div style="margin:24px 0">${item.title ? `<h3 style="font-size:17px;line-height:1.4;margin-bottom:8px">${escaped(item.title)}</h3>` : ""}${item.paragraphs.map(paragraph).join("")}<p style="font-size:12px;color:#667056">${escaped(references(item.evidence))}</p></div>`).join("")}</section>`,
  )
  .join("")}
<section style="margin-top:36px;border-top:1px solid #d8dccd;padding-top:20px"><h2 style="font-family:Georgia,serif;font-size:26px;font-weight:normal">${escaped(doc.evidenceTitle)}</h2><p style="font-size:13px;color:#667056">${de ? "Die Nummern im Report verweisen auf deine ursprünglichen Antworten. Deine eigenen Worte bleiben unverändert." : "The numbers in your report refer to your original answers. Your own words remain unchanged."}</p>${doc.evidence.map((item) => `<div style="border-left:3px solid #b9c792;padding-left:16px;margin:24px 0"><h3 style="font-size:14px;line-height:1.5">[${item.number}] ${escaped(item.label)}</h3><p style="font-size:14px;white-space:pre-wrap">${escaped(item.body)}</p></div>`).join("")}</section>
<p style="margin:32px 0"><a href="${escaped(resultUrl)}" style="color:#263626">${de ? "Privaten Kompass öffnen, Belege prüfen oder Reflexion löschen" : "Open your private Compass, inspect evidence, or delete this reflection"}</a></p>
<p style="font-size:12px;color:#667056">${escaped(doc.disclaimer)}</p>
${confirmation ? `<section style="margin-top:32px;border-top:1px solid #d8dccd;font-size:12px;color:#667056"><h2 style="font-size:16px">${purchase?.agreement?.locale === "de" ? "Kaufbestätigung und digitale Bereitstellung" : "Purchase confirmation and digital delivery"}</h2>${confirmation.split("\n\n").map(paragraph).join("")}</section>` : ""}
</td></tr></table></td></tr></table></body></html>`;
  const text = [
    doc.title,
    doc.summary,
    ...(doc.compass
      ? [
          doc.directionStatus,
          doc.compass.priority,
          doc.compass.goal.outcome,
          doc.compass.firstAction.action,
          doc.compass.firstAction.when,
        ]
      : []),
    ...doc.sections.flatMap((section) => [
      section.title,
      ...section.items.flatMap((item) => [
        item.title ?? "",
        ...item.paragraphs,
        references(item.evidence),
      ]),
    ]),
    doc.evidenceTitle,
    ...doc.evidence.map(
      (item) => `[${item.number}] ${item.label}\n${item.body}`,
    ),
    de
      ? `Kompass als PDF speichern: ${pdfUrl}`
      : `Save your Compass as PDF: ${pdfUrl}`,
    de
      ? `Privaten Kompass öffnen, Belege prüfen oder Reflexion löschen: ${resultUrl}`
      : `Open your private Compass, inspect evidence, or delete this reflection: ${resultUrl}`,
    doc.disclaimer,
    confirmation,
  ]
    .filter(Boolean)
    .join("\n\n");
  return { subject: doc.title, html, text };
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
