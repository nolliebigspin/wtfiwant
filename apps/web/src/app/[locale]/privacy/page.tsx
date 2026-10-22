import { merchant } from "@wtfiwant/shared";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const de = locale === "de";
  const sections = de
    ? [
        [
          "Deine Reflexion",
          "Deine Antworten und dein Kompass werden auf unserem Server gespeichert, damit du die Reflexion fortsetzen und deinen Report abrufen kannst. Die kostenlose Reflexion und der Zwischenstand verwenden keine KI. Erst nach bestätigter Zahlung übermitteln wir deine Antworten und optionalen Vertiefungen an OpenAI zur Erstellung deiner Rückfragen und deines Berichts. Wir deaktivieren die Speicherung der Responses bei OpenAI (store:false); die Verarbeitung und Aufbewahrung beim Anbieter richten sich zusätzlich nach dessen API-Datenrichtlinien. Dein privater Link gewährt Zugriff auf deine Reflexion: Teile ihn nur bewusst. Über den Kompass kannst du die Reflexion löschen.",
        ],
        [
          "Kauf und Zustellung",
          "Stripe verarbeitet die Zahlung. Die beim Kauf angegebene E-Mail-Adresse verwenden wir zur Zustellung über Resend. Kauf- und Vertragsunterlagen können gesetzlichen Aufbewahrungspflichten unterliegen.",
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
          `Für Fragen zu Verarbeitung, Auskunft, Berichtigung oder Löschung erreichst du uns unter ${merchant.email}. Verantwortlich ist ${merchant.name}. Du kannst dich auch an eine Datenschutzaufsichtsbehörde wenden.`,
        ],
      ]
    : [
        [
          "Your reflection",
          "Your answers and Compass are stored on our server so you can resume and retrieve your report. The free reflection and checkpoint do not use AI. Only after verified payment do we send your answers and optional follow-ups to OpenAI to prepare questions and your report. We disable Responses storage at OpenAI (store:false); processing and retention at the provider are also subject to its API data policies. Your private link grants access to your reflection; share it deliberately. You can delete your reflection from your Compass.",
        ],
        [
          "Payment and delivery",
          "Stripe processes payment. The email address supplied at checkout is used to deliver your report through Resend. Purchase and contract records may be subject to statutory retention requirements.",
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
          `For access, correction, deletion or questions, contact ${merchant.email}. The controller is ${merchant.name}. You can also contact a data protection authority.`,
        ],
      ];
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif text-5xl">{de ? "Datenschutz" : "Privacy"}</h1>
      {sections.map(([title, body]) => (
        <section className="mt-10" key={title}>
          <h2 className="mb-3 text-xl font-bold">{title}</h2>
          <p className="leading-relaxed text-muted">{body}</p>
        </section>
      ))}
    </main>
  );
}
