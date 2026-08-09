import { BrandLink } from "@/components/ui/brand-link";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { horizontalHeaderClassName } from "@/lib/styles";

export function LandingNav() {
  const t = useTranslations("Landing");
  return (
    <nav className={horizontalHeaderClassName}>
      <BrandLink />
      <div className="flex items-center gap-4 sm:gap-6">
        <a
          className="text-xs font-extrabold tracking-[0.12em] text-muted uppercase no-underline transition-colors hover:text-ink"
          href="#what-this-is"
        >
          {t("nav")}
        </a>
        <LanguageSwitcher />
      </div>
    </nav>
  );
}

import { useTranslations } from "next-intl";
