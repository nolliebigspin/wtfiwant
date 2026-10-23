import {
  getPrivacySections,
  LEGAL_DOCUMENT_UPDATED_AT,
} from "@wtfiwant/shared";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const de = locale === "de";
  const sections = getPrivacySections(de ? "de" : "en");

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif text-5xl">{de ? "Datenschutz" : "Privacy"}</h1>
      <p className="mt-4 text-sm text-muted">
        {de ? "Stand: " : "Last updated: "}
        {de
          ? LEGAL_DOCUMENT_UPDATED_AT.split("-").reverse().join(".")
          : LEGAL_DOCUMENT_UPDATED_AT}
      </p>
      {sections.map(([title, body]) => (
        <section className="mt-10" key={title}>
          <h2 className="mb-3 text-xl font-bold">{title}</h2>
          <p className="leading-relaxed text-muted">{body}</p>
        </section>
      ))}
    </main>
  );
}
