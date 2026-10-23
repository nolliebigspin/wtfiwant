import { merchant } from "./legal-content";
import type { Locale } from "./localization";

export function getPrivacySections(locale: Locale): [string, string][] {
  return locale === "de"
    ? [
        [
          "Deine Reflexion",
          "Deine Antworten und dein Kompass werden auf unserem Server gespeichert, damit du die Reflexion fortsetzen und deinen Report abrufen kannst. Die kostenlose Reflexion und der Zwischenstand verwenden keine KI. Erst nach bestätigter Zahlung übermitteln wir deine Antworten und optionalen Vertiefungen an OpenAI zur Erstellung deiner Rückfragen und deines Berichts. Wir deaktivieren die Speicherung der Responses bei OpenAI (store:false); die Verarbeitung und Aufbewahrung beim Anbieter richten sich zusätzlich nach dessen API-Datenrichtlinien. Dein privater Link gewährt Zugriff auf deine Reflexion: Teile ihn nur bewusst. Über den Kompass kannst du die Reflexion löschen.",
        ],
        [
          "Kauf und Zustellung",
          "Stripe verarbeitet die Zahlung und erhält die für Checkout erforderlichen Zahlungs- und Kontaktdaten sowie eine technische Bestellzuordnung, aber keine Reflexionsantworten. Unsere Anwendung erhält unter anderem Kaufreferenz, Zahlungsstatus, Betrag, Währung, deine E-Mail-Adresse und die bestätigte Erklärung zur digitalen Bereitstellung. Resend erhält für den Versand deine E-Mail-Adresse, den Bericht einschließlich zitierter Antworten, den privaten Ergebnislink, den PDF-Anhang und die Vertragsbestätigung. Bei einem Widerruf speichern wir deine Erklärung mit Name, E-Mail-Adresse, Vertragszuordnung und Eingangszeitpunkt; die Bestätigung geht an dich und unseren Support. Kauf-, Vertrags-, Zustimmungs- und Zahlungsnachweise werden getrennt von den Reflexionsinhalten gespeichert und beim Löschen einer Reflexion nicht entfernt. Sie können gesetzlichen Aufbewahrungspflichten unterliegen. Noch keinem Kauf zugeordnete Stripe-Ereignisse enthalten nur technische Zahlungsreferenzen, Art und Betrag des Ereignisses; sie werden nach sieben Tagen bei der nächsten automatischen Bereinigung entfernt.",
        ],
        [
          "Zwecke und Rechtsgrundlagen",
          "Die Speicherung deiner Antworten, die von dir angeforderte Reflexion und die Abwicklung eines Kaufs einschließlich KI-Erstellung, Zustellung und Support dienen der Vertragserfüllung beziehungsweise der Durchführung vorvertraglicher Maßnahmen auf deine Anfrage (Art. 6 Abs. 1 Buchst. b DSGVO). Soweit gesetzliche Pflichten die Verarbeitung von Kauf-, Vertrags- oder Widerrufsdaten verlangen, gilt Art. 6 Abs. 1 Buchst. c DSGVO. Technischer Betrieb und Schutz vor Missbrauch dienen unserem berechtigten Interesse an einem sicheren Dienst (Art. 6 Abs. 1 Buchst. f DSGVO). Für optionale Analytics verwenden wir deine widerrufliche Einwilligung (Art. 6 Abs. 1 Buchst. a DSGVO und § 25 Abs. 1 TDDDG).",
        ],
        [
          "Lokaler Speicher und sensible Angaben",
          "Um deine Reflexion im selben Browser fortsetzen zu können, speichern wir die private Sitzungskennung unter wtfiwant.sessionId im lokalen Browserspeicher. Sie bleibt dort bis zur Löschung der Reflexion oder bis du den Browserspeicher leerst. Sie ist keine Analytics-Kennung. Erforderliche Speicherung für den ausdrücklich gewünschten Dienst richtet sich nach § 25 Abs. 2 Nr. 2 TDDDG. Gib keine Passwörter, Zahlungsdaten, identifizierenden Angaben über andere Menschen oder unnötigen Gesundheits-, Religions- oder sonstigen besonders sensiblen Angaben in Freitextfeldern ein. Formuliere deine Antworten bei Bedarf allgemein. Die bezahlten Vertiefungsfragen sind überspringbar; die Informationen sind nicht für eine Diagnose bestimmt.",
        ],
        [
          "Speicherung bei Dienstleistern",
          "store:false ist keine Zusage, dass OpenAI überhaupt keine Daten aufbewahrt. Nach den API-Datenrichtlinien können insbesondere Sicherheits- und Missbrauchsprotokolle zeitweise aufbewahrt werden. Auch Resend verarbeitet die versendeten Inhalte und Zustellinformationen. Dienstleister und ihre Unterauftragnehmer können Daten außerhalb des Europäischen Wirtschaftsraums verarbeiten, insbesondere in den USA. Die Löschfunktion der App ruft keine bereits versendeten E-Mails, PDF-Kopien oder beim Anbieter aufbewahrten Protokolle zurück. Fragen zur Verarbeitung bei unseren Dienstleistern und zu den für deinen Fall eingesetzten Übermittlungsgarantien kannst du an contact@awinter.dev richten.",
        ],
        [
          "Aufbewahrung deiner Reflexion",
          "Deine gespeicherten Antworten und dein Bericht bleiben für das Fortsetzen und Abrufen der Reflexion verfügbar, bis du die Reflexion löschst oder eine Löschung bei uns anforderst. Eine automatische zeitbasierte Löschung von Reflexionssitzungen ist derzeit nicht eingerichtet. Das Leeren des lokalen Browserspeichers entfernt nur die Kennung in deinem Browser; es löscht die auf dem Server gespeicherte Reflexion nicht. Bewahre deinen privaten Link auf, wenn wir eine Auskunft oder Löschanfrage zuordnen sollen. Für gesetzlich erforderliche Kaufunterlagen und für Anbieterprotokolle können gesonderte Aufbewahrungsfristen gelten.",
        ],
        [
          "Optionale Analytics mit Umami",
          "Mit dem selbst gehosteten Umami auf analytics.awinter.dev messen wir erst mit deiner Erlaubnis Seitenkategorien, Sprache, erreichte und gespeicherte Fragen als Positionsnummern, technische Fehlerereignisse, Zwischenstand, optionale Vertiefung, Berichtserstellung, Checkout, bestätigte Käufe und PDF-Anforderungen. UTM-Quelle, Medium, Kampagne und Anzeige werden ausschließlich als kurze Kampagnen-Codes gespeichert. Antworten, Ergebnisinhalte, E-Mail-Adressen, private Sitzungs-IDs, vollständige URLs, IP-Adressen und Werbe-Klick-IDs werden nicht in der Analytics-Datenbank gespeichert. Hosting- und Zugriffsprotokolle sind davon unabhängig.",
        ],
        [
          "Besuche und Aufbewahrung",
          "Nach Einwilligung erhält der aktuelle Browser-Tab eine zufällige Analytics-Besuchskennung im Sitzungsspeicher. Nach 30 Minuten Inaktivität beginnt ein neuer Besuch. Es gibt keine geräteübergreifende Wiedererkennung. Die Einwilligungsentscheidung wird lokal bis zu 180 Tage gespeichert. In unserer Anwendung werden Ereignisse zur zuverlässigen Übertragung bei der nächsten Bereinigung nach sieben Tagen und die Zuordnung eines Checkouts nach 30 Tagen entfernt. Bereits übertragene Statistiken bleiben in unserer Umami-Instanz bis zur administrativen Löschung gespeichert. Die Auswertung zeigt nur einwilligende Besuche und keine eindeutigen Personen. Standort, Browsertyp und Geräteart werden nicht gemessen.",
        ],
        [
          "Ablehnen und Widerrufen",
          "Du kannst die Reflexion auch ohne Analytics nutzen. Unter Datenschutz-Einstellungen kannst du jederzeit ablehnen. Dadurch stoppt die Messung. Noch wartende Ereignisse und die Checkout-Zuordnung des aktuellen Besuchs werden entfernt. Bereits an Umami übertragene Statistiken und laufende Übertragungen werden dadurch nicht rückwirkend gelöscht. Frühere Besuche sind nach Ablauf der Kennung nicht mehr zuordenbar. Do Not Track und Global Privacy Control werden berücksichtigt. Es werden keine Daten an Meta oder andere Werbenetzwerke übermittelt.",
        ],
        [
          "Kontakt und Rechte",
          `Verantwortlich ist ${merchant.name}; Kontakt: ${merchant.email}. Soweit die gesetzlichen Voraussetzungen vorliegen, hast du Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung und Datenübertragbarkeit. Du kannst einer auf berechtigte Interessen gestützten Verarbeitung aus Gründen deiner besonderen Situation widersprechen. Eine Einwilligung kannst du jederzeit mit Wirkung für die Zukunft widerrufen; die Rechtmäßigkeit der Verarbeitung bis zum Widerruf bleibt unberührt. Du hast ein Beschwerderecht bei einer Datenschutzaufsichtsbehörde, insbesondere an deinem gewöhnlichen Aufenthaltsort, Arbeitsplatz oder am Ort des vermuteten Verstoßes. Bitte sende keine vollständigen Antworten oder Kartendaten zur Identifizierung per E-Mail.`,
        ],
      ]
    : [
        [
          "Your reflection",
          "Your answers and Compass are stored on our server so you can resume and retrieve your report. The free reflection and checkpoint do not use AI. Only after verified payment do we send your answers and optional follow-ups to OpenAI to prepare questions and your report. We disable Responses storage at OpenAI (store:false); processing and retention at the provider are also subject to its API data policies. Your private link grants access to your reflection; share it deliberately. You can delete your reflection from your Compass.",
        ],
        [
          "Payment and delivery",
          "Stripe processes payment and receives the payment and contact details needed for Checkout and a technical order reference, but no reflection answers. Our application receives purchase reference, payment status, amount, currency, your email address and the confirmed digital-delivery statement. For delivery, Resend receives your email address, the report including cited answers, the private result link, PDF attachment and contract confirmation. For a withdrawal, we store your declaration, name, email address, contract reference and receipt time; a confirmation goes to you and our support team. Purchase, contract, consent and payment-adjustment evidence is stored separately from reflection content and is not removed by deleting a reflection. It may be subject to statutory retention requirements. Stripe events not yet matched to a purchase contain only technical payment references, event type and amounts; they are removed at the next automatic cleanup after seven days.",
        ],
        [
          "Purposes and legal bases",
          "Storing answers, providing the reflection you request and handling a purchase, including AI generation, delivery and support, serve performance of a contract or pre-contractual steps at your request (Article 6(1)(b) GDPR). Processing required by law for purchase, contract or withdrawal records relies on Article 6(1)(c) GDPR. Technical operation and abuse prevention serve our legitimate interest in a secure service (Article 6(1)(f) GDPR). Optional analytics relies on your withdrawable consent (Article 6(1)(a) GDPR and section 25(1) TDDDG).",
        ],
        [
          "Local storage and sensitive information",
          "To resume your reflection in the same browser, we store the private session identifier as wtfiwant.sessionId in local storage. It remains until you delete the reflection or clear browser storage. It is not an analytics identifier. Storage strictly necessary for the service you explicitly request relies on section 25(2)(2) TDDDG. Do not enter passwords, payment details, identifying information about other people or unnecessary health, religious or other particularly sensitive information in free-text fields. Answer in general terms where needed. Paid follow-up questions can be skipped; the information is not intended for diagnosis.",
        ],
        [
          "Storage by service providers",
          "store:false does not promise that OpenAI retains no data at all. Its API data policies allow temporary retention, including security and abuse-monitoring logs. Resend also processes sent content and delivery information. Providers and their subprocessors may process data outside the European Economic Area, particularly in the USA. The app's delete action cannot recall sent emails, PDF copies or logs retained by providers. For questions about provider processing and the transfer safeguards applicable to your case, contact contact@awinter.dev.",
        ],
        [
          "Retention of your reflection",
          "Saved answers and your report remain available for resuming and retrieval until you delete the reflection or request deletion from us. Automatic time-based deletion of reflection sessions is not currently configured. Clearing browser storage removes the identifier in your browser; it does not delete the reflection on the server. Keep your private link if we need to identify the reflection for an access or deletion request. Legally required purchase records and provider logs may have separate retention periods.",
        ],
        [
          "Optional analytics with Umami",
          "Using self-hosted Umami at analytics.awinter.dev, we measure only with your permission page categories, language, question positions viewed and saved, technical error events, checkpoint, optional refinement, report generation, checkout, confirmed purchases and PDF requests. UTM source, medium, campaign and content are stored only as short campaign codes. Analytics does not store answers, report content, email addresses, private reflection IDs, full URLs, IP addresses or advertising click IDs. Hosting and access logs are separate.",
        ],
        [
          "Visits and retention",
          "After consent, the current browser tab receives a random analytics visit ID in session storage. A new visit starts after 30 minutes of inactivity. We do not recognise people across devices. Your choice is stored locally for up to 180 days. Our application removes event delivery data at the next cleanup after seven days and checkout attribution after 30 days. Delivered statistics remain in our Umami instance until administratively deleted. Reports cover consenting visits, not unique people. Location, browser type and device type are not measured.",
        ],
        [
          "Declining and withdrawing",
          "You can use the reflection without analytics. Decline anytime through Privacy preferences. Measurement stops. Queued events and checkout attribution for the current visit are removed. This does not retroactively erase statistics already delivered to Umami or recall in-flight requests. Earlier visits cannot be linked back after their identifiers expire. Do Not Track and Global Privacy Control are respected. No information is sent to Meta or other advertising networks.",
        ],
        [
          "Contact and rights",
          `The controller is ${merchant.name}; contact: ${merchant.email}. Subject to the applicable legal conditions, you have rights of access, correction, deletion, restriction and data portability. You can object to processing based on legitimate interests on grounds relating to your particular situation. You can withdraw consent for the future at any time; processing before withdrawal remains lawful. You may complain to a data protection authority, particularly in the country of your habitual residence, work or the alleged infringement. Do not email full reflection answers or card details to identify yourself.`,
        ],
      ];
}
