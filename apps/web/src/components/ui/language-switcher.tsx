"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("LanguageSwitcher");
  const pathname = usePathname();
  const router = useRouter();

  return (
    <span className="relative inline-flex items-center">
      <select
        aria-label={t("label")}
        className="cursor-pointer appearance-none rounded-full border border-ink/20 bg-transparent py-2 pr-8 pl-3 text-[0.65rem] font-black tracking-[0.12em] text-ink uppercase outline-none transition-colors hover:border-ink focus:border-ink focus:ring-2 focus:ring-accent/25"
        value={locale}
        onChange={(event) =>
          router.replace(pathname, {
            locale: event.target.value as AppLocale,
          })
        }
      >
        <option value="en" lang="en">
          EN
        </option>
        <option value="de" lang="de">
          DE
        </option>
      </select>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute right-3 size-3"
        viewBox="0 0 12 12"
      >
        <path
          d="m3 4.5 3 3 3-3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    </span>
  );
}
