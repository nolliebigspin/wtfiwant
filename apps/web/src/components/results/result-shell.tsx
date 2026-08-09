import type { ReactNode } from "react";
import { BrandLink } from "@/components/ui/brand-link";

export function ResultShell({ children }: { children: ReactNode }) {
  return (
    <div className="result-shell">
      <header className="result-header">
        <BrandLink />
        <span>YOUR REFLECTION</span>
      </header>
      {children}
    </div>
  );
}
