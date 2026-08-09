type BrandLinkProps = {
  className?: string;
};

export function BrandLink({
  className = "text-[1.15rem] font-black tracking-[-0.06em] no-underline",
}: BrandLinkProps) {
  return (
    <a className={className} href="/">
      wtfiwant<span className="text-accent-ink">.</span>
    </a>
  );
}
