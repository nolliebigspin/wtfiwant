import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { BrandLink } from "@/components/ui/brand-link";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { compactHorizontalHeaderClassName } from "@/lib/styles";

export function ResultShell({ children }: { children: ReactNode }) {
  const t = useTranslations("Results");
  return (
    <div>
      <header
        className={`${compactHorizontalHeaderClassName} sticky top-0 z-20 bg-paper/90 backdrop-blur-xl`}
      >
        <BrandLink />
        <div className="flex items-center gap-4 sm:gap-6">
          <span className="text-[0.58rem] font-black tracking-[0.15em] text-muted">
            {t("header")}
          </span>
          <LanguageSwitcher />
        </div>
      </header>
      {children}
    </div>
  );
}
