type BrandLinkProps = {
  className?: string;
};

export function BrandLink({
  className = "text-[1.15rem] font-black tracking-[-0.06em] no-underline",
}: BrandLinkProps) {
  return (
    <Link className={className} href="/">
      wtfiwant<span className="motion-brand-dot text-accent-ink">.</span>
    </Link>
  );
}

import { Link } from "@/i18n/navigation";
