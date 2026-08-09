import type { ReactNode } from "react";
import { BrandLink } from "@/components/ui/brand-link";

export function JourneyShell({ children }: { children: ReactNode }) {
  return (
    <div className="journey-shell">
      <header className="journey-header">
        <BrandLink />
      </header>
      {children}
    </div>
  );
}
