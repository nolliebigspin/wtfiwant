import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { BrandLink } from "@/components/ui/brand-link";
import { compactHorizontalHeaderClassName } from "@/lib/styles";

export function ResultShell({ children }: { children: ReactNode }) {
  const t = useTranslations("Results");
  return (
    <div>
      <header
        className={`${compactHorizontalHeaderClassName} sticky top-0 z-20 bg-paper/90 backdrop-blur-xl`}
      >
        <BrandLink />
        <span className="text-[0.58rem] font-black tracking-[0.15em] text-muted">
          {t("header")}
        </span>
      </header>
      {children}
    </div>
  );
}
