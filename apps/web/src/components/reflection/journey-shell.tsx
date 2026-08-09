import type { ReactNode } from "react";
import { BrandLink } from "@/components/ui/brand-link";
import { compactHorizontalHeaderClassName } from "@/lib/styles";

export function JourneyShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className={compactHorizontalHeaderClassName}>
        <BrandLink />
      </header>
      {children}
    </div>
  );
}
