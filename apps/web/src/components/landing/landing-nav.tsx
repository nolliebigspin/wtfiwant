import { BrandLink } from "@/components/ui/brand-link";
import { horizontalHeaderClassName } from "@/lib/styles";

export function LandingNav() {
  return (
    <nav className={horizontalHeaderClassName}>
      <BrandLink />
      <a
        className="text-xs font-extrabold tracking-[0.12em] text-muted uppercase no-underline transition-colors hover:text-ink"
        href="#what-this-is"
      >
        What this is
      </a>
    </nav>
  );
}
