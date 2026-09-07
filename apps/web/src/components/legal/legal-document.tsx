import type { Locale } from "@wtfiwant/shared";
import { BrandLink } from "@/components/ui/brand-link";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Link } from "@/i18n/navigation";
import { eyebrowClassName, horizontalHeaderClassName } from "@/lib/styles";
import {
  getLegalDocument,
  type LegalDocumentKind,
  merchant,
} from "./legal-content";

export function LegalDocument({
  kind,
  locale,
}: {
  kind: LegalDocumentKind;
  locale: Locale;
}) {
  const document = getLegalDocument(kind, locale);
  const german = locale === "de";

  return (
    <main className="min-h-screen pb-20">
      <header className={horizontalHeaderClassName}>
        <BrandLink />
        <LanguageSwitcher />
      </header>
      <article className="mx-auto max-w-[52rem] px-6 py-16 sm:px-10">
        <p className={eyebrowClassName}>wtfiwant.app</p>
        <h1 className="m-0 text-[clamp(2.5rem,6vw,4.5rem)] leading-tight tracking-[-0.05em]">
          {document.title}
        </h1>
        <p className="mt-4 text-sm text-muted">
          {german
            ? "Stand: 7. September 2026"
            : "Last updated: September 7, 2026"}
        </p>
        <p className="my-8 text-lg leading-relaxed">{document.intro}</p>
        <nav
          aria-label={german ? "Rechtliche Informationen" : "Legal information"}
          className="mb-12 flex flex-wrap gap-5 text-sm"
        >
          <Link
            href="/terms"
            aria-current={kind === "terms" ? "page" : undefined}
          >
            {german ? "Nutzungsbedingungen" : "Terms of service"}
          </Link>
          <Link
            href="/refunds"
            aria-current={kind === "refunds" ? "page" : undefined}
          >
            {german ? "Widerruf & Erstattungen" : "Refunds & withdrawal"}
          </Link>
        </nav>
        {kind === "refunds" && (
          <p className="mb-10">
            <Link
              href="/withdraw"
              className="font-bold underline underline-offset-4"
            >
              {german ? "Vertrag widerrufen" : "Withdraw from contract"}
            </Link>
          </p>
        )}
        <div className="space-y-10">
          {document.sections.map((section) => (
            <section
              key={section.title}
              className="border-t border-ink/15 pt-6"
            >
              <h2 className="m-0 text-xl font-bold">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-4 leading-relaxed text-muted">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
        <aside className="mt-12 rounded-2xl border border-ink/15 p-6">
          <h2 className="m-0 text-xl font-bold">
            {german ? "Kontakt" : "Contact"}
          </h2>
          <p className="mt-3 mb-1">{merchant.name}</p>
          <a className="break-all" href={`mailto:${merchant.email}`}>
            {merchant.email}
          </a>
        </aside>
      </article>
    </main>
  );
}
