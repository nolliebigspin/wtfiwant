"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { Select, type SelectOption } from "./select";

export function LanguageSwitcher() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("LanguageSwitcher");
  const pathname = usePathname();
  const router = useRouter();
  const options: readonly SelectOption[] = [
    { value: "en", label: t("en"), icon: "🇬🇧", lang: "en" },
    { value: "de", label: t("de"), icon: "🇩🇪", lang: "de" },
  ];

  return (
    <Select
      ariaLabel={t("label")}
      menuAlign="end"
      onValueChange={(nextLocale) =>
        router.replace(pathname, { locale: nextLocale as AppLocale })
      }
      options={options}
      value={locale}
      variant="compact"
    />
  );
}
