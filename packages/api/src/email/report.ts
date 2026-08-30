import type { Analysis, Locale } from "@wtfiwant/shared";

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

export function renderFullCompassEmail(
  analysis: Analysis,
  locale: Locale,
  resultUrl: string,
): { subject: string; html: string; text: string } {
  const de = locale === "de";
  const section = (title: string, body: string) =>
    `<section><h2>${escapeHtml(title)}</h2>${body}</section>`;
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;line-height:1.55;color:#201d18;max-width:720px;margin:auto;padding:32px">
    <p style="font-size:12px;letter-spacing:.12em">${de ? "DEIN VOLLSTÄNDIGER KOMPASS" : "YOUR FULL COMPASS"}</p>
    <h1>${escapeHtml(analysis.summary)}</h1>
    ${section(de ? "Was wichtig zu sein scheint" : "What seems to matter", analysis.coreDrivers.map((driver) => `<h3>${escapeHtml(driver.name)}</h3><p>${escapeHtml(driver.explanation)}</p>`).join(""))}
    ${section(de ? "Spannungen" : "Tensions", analysis.tensions.map((tension) => `<h3>${escapeHtml(tension.sideA)} ↔ ${escapeHtml(tension.sideB)}</h3><p>${escapeHtml(tension.explanation)}</p>`).join(""))}
    ${section(de ? "Dein Anti-Leben" : "Your Anti-Life", `<p>${escapeHtml(analysis.antiLife.summary)}</p>${items(analysis.antiLife.themes)}`)}
    ${section(de ? "Äußere Einflüsse" : "Outside influences", items(analysis.externalInfluences.map((item) => item.observation)))}
    ${section(de ? "Richtungen zum Erkunden" : "Directions worth exploring", analysis.possibleDirections.map((direction) => `<h3>${escapeHtml(direction.title)}</h3><p>${escapeHtml(direction.explanation)}</p><p><strong>${de ? "Warum es passen könnte" : "Why it may fit"}:</strong> ${escapeHtml(direction.whyItFits)}</p>`).join(""))}
    ${section(de ? "Unter deinen Zielen" : "Beneath your goals", analysis.goals.map((goal) => `<h3>${escapeHtml(goal.originalGoal)}</h3><p>${escapeHtml(goal.possibleUnderlyingNeed)}</p><p>${escapeHtml(goal.interpretation)}</p>`).join(""))}
    ${section(de ? "Erste Schritte" : "First steps", analysis.firstSteps.map((step) => `<h3>${escapeHtml(step.direction)}</h3><p><strong>${de ? "Experiment" : "Experiment"}:</strong> ${escapeHtml(step.experiment)}</p><p><strong>${de ? "Jetzt" : "Now"}:</strong> ${escapeHtml(step.immediateAction)}</p>`).join(""))}
    <p><a href="${escapeHtml(resultUrl)}">${de ? "Kompass im Browser öffnen" : "Open your Compass in the browser"}</a></p>
    <hr><p style="font-size:12px;color:#68635b">${de ? "Dies ist eine geführte Reflexion, keine Diagnose, Therapie oder Krisenhilfe." : "This is guided reflection, not diagnosis, therapy, or crisis support."}</p>
  </body></html>`;
  const text = [
    analysis.summary,
    ...analysis.coreDrivers.flatMap((driver) => [
      driver.name,
      driver.explanation,
    ]),
    ...analysis.tensions.flatMap((tension) => [
      `${tension.sideA} / ${tension.sideB}`,
      tension.explanation,
    ]),
    analysis.antiLife.summary,
    ...analysis.possibleDirections.flatMap((direction) => [
      direction.title,
      direction.explanation,
      direction.whyItFits,
    ]),
    ...analysis.firstSteps.flatMap((step) => [
      step.direction,
      step.experiment,
      step.immediateAction,
    ]),
    resultUrl,
  ].join("\n\n");
  return {
    subject: de ? "Dein vollständiger Kompass" : "Your Full Compass",
    html,
    text,
  };
}
