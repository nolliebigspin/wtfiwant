import type { ReactNode } from "react";
import { BrandLink } from "@/components/ui/brand-link";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { compactHorizontalHeaderClassName } from "@/lib/styles";
import { cn } from "@/lib/utils";

export function JourneyShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header
        className={cn(compactHorizontalHeaderClassName, "motion-header-enter")}
      >
        <BrandLink />
        <LanguageSwitcher />
      </header>
      {children}
    </div>
  );
}
