import { BrandLink } from "@/components/ui/brand-link";
import { horizontalHeaderClassName } from "@/lib/styles";

export function LandingNav() {
  const t = useTranslations("Landing");
  return (
    <nav className={horizontalHeaderClassName}>
      <BrandLink />
      <a
        className="text-xs font-extrabold tracking-[0.12em] text-muted uppercase no-underline transition-colors hover:text-ink"
        href="#what-this-is"
      >
        {t("nav")}
      </a>
    </nav>
  );
}

import { useTranslations } from "next-intl";
