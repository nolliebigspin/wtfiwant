import { digitalPurchaseAgreementSchema } from "./commerce";
import type { Locale } from "./localization";

export const merchant = {
  name: "Alec Winter · awinter.dev",
  email: "contact@awinter.dev",
};

export type LegalDocumentKind = "terms" | "refunds";

type LegalContent = {
  title: string;
  intro: string;
  sections: { title: string; paragraphs: string[] }[];
};

const documents: Record<Locale, Record<LegalDocumentKind, LegalContent>> = {
  en: {
    terms: {
      title: "Terms of service",
      intro:
        "These terms explain what you receive when you use wtfiwant.app and purchase a Full Compass. The service is provided by Alec Winter, trading as awinter.dev. Contact: contact@awinter.dev.",
      sections: [
        {
          title: "1. What the service provides",
          paragraphs: [
            "wtfiwant.app is a guided personal reflection. You answer questions about your experiences, priorities, and possible directions. Completing the reflection and viewing its Compass Preview are free. A Full Compass purchase unlocks the complete report for one Reflection Session, including patterns, tensions, possible directions, and an action plan, with delivery by email.",
            "Your report is generated with automated assistance and can contain mistakes or interpretations you disagree with. Treat it as material for your own reflection. It is not a diagnosis, therapy, crisis service, or professional medical, legal, or financial advice, and it does not promise a particular life outcome. Statutory rights concerning the quality of the digital product remain unaffected.",
          ],
        },
        {
          title: "2. Your purchase and payment",
          paragraphs: [
            "Each purchase is a one-time payment for one Reflection Session. It is not a subscription and does not renew automatically. The applicable price, currency, and total payable are shown in Stripe Checkout before you confirm payment. A later change in price does not change an existing purchase.",
            "You place an order by confirming the payment in Stripe Checkout. We accept the order when payment is confirmed and the Full Compass is made available. Stripe processes payment details; the app does not receive or store your card number. Provide an email address you can access so we can deliver your report and help with purchase questions.",
          ],
        },
        {
          title: "3. Digital delivery and access",
          paragraphs: [
            "The Full Compass becomes available in your browser after Stripe confirms successful payment. Some payment methods take longer to confirm. We also send the report to the email address supplied at Checkout. An email delivery problem does not remove paid browser access; you can request another email from your report page or contact us.",
            "You need an internet connection, a current web browser, and access to your email. There is no account sign-in. Keep your private result link safe: anyone who has it may be able to access your reflection. Save the report email or a personal copy if you want to keep it independently of the service.",
          ],
        },
        {
          title: "4. Personal content and deletion",
          paragraphs: [
            "Only submit information you are entitled to share, and avoid unnecessary personal information about other people. Your report email contains personal reflection content and a private result link. Consider who can access your inbox before purchasing.",
            "You can delete your Reflection Session using the delete control in the app. This removes the locally stored reflection, report, and associated records and ends access through that session. It cannot recall emails or copies already delivered, or delete financial records retained by payment providers. Deleting a reflection does not create a right to a refund. Statutory rights remain unaffected.",
          ],
        },
        {
          title: "5. Appropriate use and safety",
          paragraphs: [
            "Use the service lawfully. Do not attempt to access someone else’s reflection, bypass payment or security controls, or disrupt the service. You retain your rights in the answers you submit and may save and use your report for personal purposes.",
            "The app may pause a reflection when answers indicate an immediate safety concern. It is not monitored as an emergency channel. If you are in immediate danger, contact local emergency services. If a safety pause prevents delivery after payment, contact us to resolve the purchase. Your statutory remedies for non-delivery remain unaffected.",
          ],
        },
        {
          title: "6. Refunds and consumer rights",
          paragraphs: [
            "The Full Compass is a premium digital feature. Purchases are final and we offer no voluntary refunds, including for a change of mind or subjective dissatisfaction. Before payment, you must expressly consent to early delivery and acknowledge the resulting loss of your statutory withdrawal right when the legal requirements are met. Our Refund Policy explains these requirements and your remaining statutory rights.",
            "Nothing in these terms limits mandatory consumer rights or excludes liability that cannot lawfully be excluded. The descriptions of the report’s purpose do not remove your rights if the digital product fails to meet the contract.",
          ],
        },
        {
          title: "7. Changes and contact",
          paragraphs: [
            "We may update these terms for future use and purchases. The version presented when you purchase applies to that purchase; later changes do not reduce rights you already have. For delivery problems, complaints, or other questions, email contact@awinter.dev.",
          ],
        },
      ],
    },
    refunds: {
      title: "Refunds & withdrawal",
      intro:
        "The Full Compass is a premium digital feature. All purchases are final. We do not offer voluntary refunds. This does not affect refunds or other remedies required by law.",
      sections: [
        {
          title: "1. Premium purchases are final",
          paragraphs: [
            "You pay once to unlock the complete report for your Reflection Session. There is no subscription to cancel. We do not offer a money-back guarantee or voluntary refunds for a change of mind, disagreement with the report’s interpretations, or not using the premium feature.",
            "This policy does not exclude mandatory consumer rights, including any applicable right of withdrawal and remedies for non-delivery, defects, or incorrect charges.",
          ],
        },
        {
          title: "2. Exercising statutory rights",
          paragraphs: [
            "Send your request to Alec Winter, awinter.dev, at contact@awinter.dev. To help us find the purchase, include the email address used at Checkout and, if available, the purchase date or Stripe receipt reference. Do not send card details or the contents of your reflection. Missing a receipt reference does not invalidate a clear withdrawal request.",
            "Where you have a statutory right of withdrawal, you can use the “Withdraw from contract” function on wtfiwant.app/withdraw, email us, or use this wording: ‘I withdraw from my purchase of the Full Compass on wtfiwant.app and request a refund. Purchase date: […]. Checkout email: […]. Name: […]. Date: […].’ You may use any other clear statement instead; no particular form is required.",
          ],
        },
        {
          title: "3. Consumer right of withdrawal",
          paragraphs: [
            "If you are a consumer with a statutory right of withdrawal, you may withdraw from the contract without giving a reason. For consumers in Germany and the EU, the usual period is 14 days from the conclusion of the contract, subject to the applicable rules on when the period starts and any extensions. Sending a clear withdrawal statement before the applicable deadline is sufficient.",
            "For immediate digital delivery, Checkout requires your express consent to begin performance before the withdrawal period ends and your acknowledgement that your withdrawal right expires when performance begins. The right expires only when the statutory conditions are met, including the start of delivery and provision of the contract confirmation recording your consent and acknowledgement on a durable medium. We include that confirmation in your report email. Merely paying or ticking a checkbox does not by itself extinguish the right.",
          ],
        },
        {
          title: "4. Refund method and timing",
          paragraphs: [
            "Where a statutory withdrawal is effective, we reimburse you without undue delay and no later than 14 days after receiving your withdrawal. Other legally required refunds follow the applicable statutory rules. We use the original payment method unless we expressly agree otherwise with you. We do not charge a refund processing fee. Your payment provider may take additional time to show the credit on your account.",
            "Refunds are handled by support through Stripe. The app does not offer an automatic refund button. A refund does not delete your reflection; use the app’s delete control if you also want the stored reflection removed. Emails and copies already delivered cannot be recalled.",
          ],
        },
        {
          title: "5. Missing reports, errors, and duplicate charges",
          paragraphs: [
            "If payment succeeds but your report is not accessible, contact us so we can investigate and restore access. Check your spam folder and try the report page’s resend option if only the email is missing. Contact us about duplicate or incorrect charges, or a safety pause that prevents delivery. We correct errors and provide refunds where required by law.",
            "If the digital product is defective, statutory remedies may include correction, a price reduction, termination of the contract, or other remedies where the legal requirements are met. The exclusion of voluntary refunds does not limit these rights.",
          ],
        },
      ],
    },
  },
  de: {
    terms: {
      title: "Nutzungsbedingungen",
      intro:
        "Diese Bedingungen erklären, was du bei der Nutzung von wtfiwant.app und beim Kauf eines vollständigen Kompasses erhältst. Anbieter ist Alec Winter, handelnd unter awinter.dev. Kontakt: contact@awinter.dev.",
      sections: [
        {
          title: "1. Was der Dienst bietet",
          paragraphs: [
            "wtfiwant.app ist eine angeleitete persönliche Reflexion. Du beantwortest Fragen zu deinen Erfahrungen, Prioritäten und möglichen Richtungen. Die Reflexion und die Kompass-Vorschau sind kostenlos. Mit einem Kauf erhältst du den vollständigen Bericht für eine Reflexionssitzung, einschließlich Mustern, Spannungen, möglichen Richtungen und einem Handlungsplan sowie der Zustellung per E-Mail.",
            "Dein Bericht wird mit automatisierter Unterstützung erstellt und kann Fehler oder Deutungen enthalten, denen du nicht zustimmst. Nutze ihn als Anregung für deine eigene Reflexion. Er ist keine Diagnose, Therapie, Krisenhilfe oder professionelle medizinische, rechtliche oder finanzielle Beratung und verspricht kein bestimmtes Lebensergebnis. Gesetzliche Rechte hinsichtlich der Qualität des digitalen Produkts bleiben unberührt.",
          ],
        },
        {
          title: "2. Kauf und Zahlung",
          paragraphs: [
            "Jeder Kauf ist eine einmalige Zahlung für eine Reflexionssitzung. Es gibt kein Abonnement und keine automatische Verlängerung. Preis, Währung und zu zahlender Gesamtbetrag werden vor deiner Zahlungsbestätigung in Stripe Checkout angezeigt. Spätere Preisänderungen ändern einen bestehenden Kauf nicht.",
            "Mit der Zahlungsbestätigung in Stripe Checkout gibst du eine Bestellung ab. Wir nehmen sie an, wenn die Zahlung bestätigt und der vollständige Kompass bereitgestellt wird. Stripe verarbeitet die Zahlungsdaten; die App erhält oder speichert deine Kartennummer nicht. Gib eine erreichbare E-Mail-Adresse an, damit wir den Bericht zustellen und Fragen zum Kauf klären können.",
          ],
        },
        {
          title: "3. Digitale Bereitstellung und Zugriff",
          paragraphs: [
            "Der vollständige Kompass wird im Browser verfügbar, sobald Stripe die erfolgreiche Zahlung bestätigt. Bei manchen Zahlungsmethoden dauert die Bestätigung länger. Zusätzlich senden wir den Bericht an die bei Checkout angegebene E-Mail-Adresse. Ein E-Mail-Zustellfehler hebt den bezahlten Browserzugriff nicht auf. Du kannst auf der Ergebnisseite einen erneuten Versand anfordern oder uns kontaktieren.",
            "Du benötigst eine Internetverbindung, einen aktuellen Webbrowser und Zugang zu deinem E-Mail-Postfach. Eine Kontoanmeldung gibt es nicht. Bewahre deinen privaten Ergebnislink sicher auf: Wer den Link kennt, kann möglicherweise auf deine Reflexion zugreifen. Sichere die Berichts-E-Mail oder eine persönliche Kopie, wenn du den Bericht unabhängig vom Dienst aufbewahren möchtest.",
          ],
        },
        {
          title: "4. Persönliche Inhalte und Löschung",
          paragraphs: [
            "Übermittle nur Informationen, die du teilen darfst, und vermeide unnötige personenbezogene Angaben über andere Menschen. Die Berichts-E-Mail enthält persönliche Reflexionsinhalte und einen privaten Ergebnislink. Berücksichtige vor dem Kauf, wer auf dein Postfach zugreifen kann.",
            "Du kannst deine Reflexionssitzung über die Löschfunktion der App entfernen. Dabei werden die in der Anwendung gespeicherte Reflexion, der Bericht und zugehörige Datensätze gelöscht; der Zugriff über diese Sitzung endet. Bereits zugestellte E-Mails oder Kopien sowie vom Zahlungsanbieter aufbewahrte Finanzunterlagen werden dadurch nicht gelöscht. Durch die Löschung entsteht kein Erstattungsanspruch. Gesetzliche Rechte bleiben unberührt.",
          ],
        },
        {
          title: "5. Zulässige Nutzung und Sicherheit",
          paragraphs: [
            "Nutze den Dienst rechtmäßig. Versuche nicht, auf fremde Reflexionen zuzugreifen, Zahlungs- oder Sicherheitskontrollen zu umgehen oder den Dienst zu stören. Deine Rechte an den eingegebenen Antworten bleiben bei dir. Du darfst deinen Bericht für persönliche Zwecke speichern und verwenden.",
            "Die App kann eine Reflexion pausieren, wenn Antworten auf eine unmittelbare Gefährdung hindeuten. Sie wird nicht als Notfallkanal überwacht. Wende dich bei unmittelbarer Gefahr an den örtlichen Notruf. Verhindert eine Sicherheitspause die Bereitstellung nach Zahlung, kontaktiere uns zur Klärung des Kaufs. Gesetzliche Rechte wegen fehlender Bereitstellung bleiben unberührt.",
          ],
        },
        {
          title: "6. Erstattungen und Verbraucherrechte",
          paragraphs: [
            "Der vollständige Kompass ist eine digitale Premium-Funktion. Käufe sind endgültig; wir bieten keine freiwilligen Erstattungen an, auch nicht bei Meinungsänderung oder subjektiver Unzufriedenheit. Vor der Zahlung musst du der vorzeitigen Bereitstellung ausdrücklich zustimmen und bestätigen, dass du den damit verbundenen Verlust deines Widerrufsrechts bei Vorliegen der gesetzlichen Voraussetzungen kennst. Unsere Erstattungsrichtlinie erklärt diese Voraussetzungen und deine verbleibenden gesetzlichen Rechte.",
            "Diese Bedingungen beschränken keine zwingenden Verbraucherrechte und schließen keine Haftung aus, die rechtlich nicht ausgeschlossen werden darf. Die Beschreibung des Berichtszwecks beseitigt keine Rechte, wenn das digitale Produkt nicht dem Vertrag entspricht.",
          ],
        },
        {
          title: "7. Änderungen und Kontakt",
          paragraphs: [
            "Wir können diese Bedingungen für die künftige Nutzung und künftige Käufe ändern. Für einen Kauf gilt die beim Kauf vorgelegte Fassung. Spätere Änderungen schränken bereits bestehende Rechte nicht ein. Bei Zustellproblemen, Beschwerden oder anderen Fragen schreibe an contact@awinter.dev.",
          ],
        },
      ],
    },
    refunds: {
      title: "Widerruf & Erstattungen",
      intro:
        "Der vollständige Kompass ist eine digitale Premium-Funktion. Alle Käufe sind endgültig. Wir bieten keine freiwilligen Erstattungen an. Gesetzlich vorgeschriebene Erstattungen und andere gesetzliche Ansprüche bleiben unberührt.",
      sections: [
        {
          title: "1. Premium-Käufe sind endgültig",
          paragraphs: [
            "Du zahlst einmalig für die Freischaltung des vollständigen Berichts deiner Reflexionssitzung. Es gibt kein Abonnement zu kündigen. Wir bieten keine Geld-zurück-Garantie und keine freiwillige Erstattung bei Meinungsänderung, abweichender Einschätzung der Berichtsdeutungen oder Nichtnutzung der Premium-Funktion.",
            "Diese Richtlinie schließt keine zwingenden Verbraucherrechte aus. Dazu gehören ein anwendbares gesetzliches Widerrufsrecht und Ansprüche wegen fehlender Bereitstellung, Mängeln oder fehlerhaften Abbuchungen.",
          ],
        },
        {
          title: "2. Gesetzliche Rechte ausüben",
          paragraphs: [
            "Richte deinen Antrag an Alec Winter, awinter.dev, unter contact@awinter.dev. Nenne zur Zuordnung möglichst die beim Checkout verwendete E-Mail-Adresse sowie das Kaufdatum oder die Stripe-Belegreferenz, falls vorhanden. Sende keine Kartendaten oder Reflexionsinhalte. Eine fehlende Belegreferenz macht eine eindeutige Widerrufserklärung nicht unwirksam.",
            "Wenn dir ein gesetzliches Widerrufsrecht zusteht, kannst du die Funktion „Vertrag widerrufen“ auf wtfiwant.app/withdraw nutzen, uns eine E-Mail senden oder zum Beispiel schreiben: ‚Hiermit widerrufe ich meinen Kauf des vollständigen Kompasses auf wtfiwant.app und bitte um Erstattung. Kaufdatum: […]. E-Mail-Adresse beim Checkout: […]. Name: […]. Datum: […].‘ Eine andere eindeutige Erklärung genügt ebenfalls; ein bestimmtes Formular ist nicht vorgeschrieben.",
          ],
        },
        {
          title: "3. Gesetzliches Widerrufsrecht",
          paragraphs: [
            "Steht dir als Verbraucher ein gesetzliches Widerrufsrecht zu, kannst du den Vertrag ohne Angabe von Gründen widerrufen. Für Verbraucher in Deutschland und der EU beträgt die Frist üblicherweise 14 Tage ab Vertragsschluss, vorbehaltlich der anwendbaren Vorschriften zum Fristbeginn und zu einer Verlängerung. Zur Fristwahrung genügt die rechtzeitige Absendung einer eindeutigen Widerrufserklärung.",
            "Für die sofortige digitale Bereitstellung verlangt Checkout deine ausdrückliche Zustimmung zum Beginn der Vertragserfüllung vor Ablauf der Widerrufsfrist und deine Bestätigung, dass du den Verlust deines Widerrufsrechts mit Beginn der Vertragserfüllung kennst. Das Recht erlischt nur bei Vorliegen der gesetzlichen Voraussetzungen, einschließlich des Beginns der Bereitstellung und einer Vertragsbestätigung auf einem dauerhaften Datenträger, die deine Zustimmung und Kenntnisnahme festhält. Diese Bestätigung ist in deiner Berichts-E-Mail enthalten. Allein die Zahlung oder das Ankreuzen eines Kästchens lässt das Recht nicht erlöschen.",
          ],
        },
        {
          title: "4. Zahlungsweg und Bearbeitung",
          paragraphs: [
            "Bei einem wirksamen gesetzlichen Widerruf erstatten wir unverzüglich und spätestens 14 Tage nach Eingang des Widerrufs. Für andere gesetzlich vorgeschriebene Erstattungen gelten die jeweiligen gesetzlichen Regeln. Wir verwenden das ursprüngliche Zahlungsmittel, sofern mit dir nicht ausdrücklich etwas anderes vereinbart wird. Wir berechnen keine Erstattungsgebühr. Bis die Gutschrift bei dir sichtbar ist, kann dein Zahlungsanbieter zusätzliche Zeit benötigen.",
            "Erstattungen bearbeitet der Support über Stripe. Die App bietet keine automatische Erstattungsfunktion. Eine Erstattung löscht deine Reflexion nicht. Verwende die Löschfunktion der App, wenn du auch die gespeicherte Reflexion entfernen möchtest. Bereits zugestellte E-Mails und Kopien können nicht zurückgerufen werden.",
          ],
        },
        {
          title: "5. Fehlende Berichte, Fehler und doppelte Abbuchungen",
          paragraphs: [
            "Ist die Zahlung erfolgreich, der Bericht aber nicht zugänglich, kontaktiere uns zur Prüfung und Wiederherstellung des Zugriffs. Fehlt nur die E-Mail, prüfe deinen Spamordner und nutze den erneuten Versand auf der Ergebnisseite. Kontaktiere uns auch bei doppelten oder fehlerhaften Abbuchungen sowie bei einer Sicherheitspause, die die Bereitstellung verhindert. Wir korrigieren Fehler und erstatten Beträge, soweit dies gesetzlich vorgeschrieben ist.",
            "Bei einem mangelhaften digitalen Produkt können die gesetzlichen Rechte unter den jeweiligen Voraussetzungen Nacherfüllung, Minderung, Vertragsbeendigung oder weitere Ansprüche umfassen. Der Ausschluss freiwilliger Erstattungen beschränkt diese Rechte nicht.",
          ],
        },
      ],
    },
  },
};

export function getLegalDocument(kind: LegalDocumentKind, locale: Locale) {
  return documents[locale][kind];
}

export const DIGITAL_PURCHASE_VERSION = "2026-09-07.1";

export function createDigitalPurchaseAgreement(locale: Locale) {
  const asText = (kind: LegalDocumentKind) => {
    const document = getLegalDocument(kind, locale);
    return [
      document.title,
      document.intro,
      ...document.sections.flatMap((section) => [
        section.title,
        ...section.paragraphs,
      ]),
    ].join("\n\n");
  };
  return digitalPurchaseAgreementSchema.parse({
    version: DIGITAL_PURCHASE_VERSION,
    locale,
    statement:
      locale === "de"
        ? "Ich stimme ausdrücklich zu, dass vor Ablauf der Widerrufsfrist mit der Bereitstellung des vollständigen Kompasses begonnen wird. Ich bestätige, dass ich weiß, dass ich durch diese Zustimmung mit Beginn der Vertragserfüllung mein Widerrufsrecht verliere."
        : "I expressly consent to delivery of the Full Compass beginning before the withdrawal period ends. I acknowledge that, by giving this consent, I lose my right of withdrawal when performance begins.",
    terms: asText("terms"),
    refundPolicy: asText("refunds"),
  });
}
