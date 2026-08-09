import type { ReactNode } from "react";
import { BrandLink } from "@/components/ui/brand-link";
import { horizontalHeaderClassName } from "@/lib/styles";

export function ResultShell({ children }: { children: ReactNode }) {
  return (
    <div>
      <header
        className={`${horizontalHeaderClassName} sticky top-0 z-20 min-h-16 bg-paper/90 backdrop-blur-xl`}
      >
        <BrandLink />
        <span className="text-[0.58rem] font-black tracking-[0.15em] text-muted">
          YOUR REFLECTION
        </span>
      </header>
      {children}
    </div>
  );
}
