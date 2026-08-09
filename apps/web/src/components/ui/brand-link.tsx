type BrandLinkProps = {
  className?: string;
};

export function BrandLink({ className = "wordmark" }: BrandLinkProps) {
  return (
    <a className={className} href="/">
      wtfiwant<span>.</span>
    </a>
  );
}
