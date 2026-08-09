"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("LanguageSwitcher");
  const pathname = usePathname();
  const router = useRouter();
  const nextLocale: AppLocale = locale === "en" ? "de" : "en";

  return (
    <button
      type="button"
      className="rounded-full border border-ink/20 px-3 py-1.5 text-[0.65rem] font-black tracking-[0.12em] no-underline transition-colors hover:border-ink"
      lang={nextLocale}
      onClick={() => router.replace(pathname, { locale: nextLocale })}
    >
      {nextLocale.toUpperCase()}
      <span className="sr-only">
        {" "}
        – {t("switchTo", { locale: t(nextLocale) })}
      </span>
    </button>
  );
}
