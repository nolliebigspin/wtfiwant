import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function LegalFooter() {
  const t = useTranslations("LegalNavigation");
  return (
    <footer className="border-t border-ink/15 px-6 py-6 text-sm text-muted sm:px-10">
      <nav
        aria-label={t("label")}
        className="flex flex-wrap justify-center gap-x-6 gap-y-3"
      >
        <Link href="/terms">{t("terms")}</Link>
        <Link href="/refunds">{t("refunds")}</Link>
        <Link
          href="/withdraw"
          className="font-bold underline underline-offset-4"
        >
          {t("withdraw")}
        </Link>
      </nav>
    </footer>
  );
}
