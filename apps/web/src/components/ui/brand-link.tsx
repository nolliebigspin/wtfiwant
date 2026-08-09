type BrandLinkProps = {
  className?: string;
};

const brandLinkClassName =
  "text-[1.15rem] font-black tracking-[-0.06em] no-underline";

export function BrandLink({ className }: BrandLinkProps) {
  return (
    <Link className={cn(brandLinkClassName, className)} href="/">
      wtfiwant<span className="motion-brand-dot text-accent-ink">.</span>
    </Link>
  );
}

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
