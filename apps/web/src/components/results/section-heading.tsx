import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  titleId?: string;
  light?: boolean;
  children?: ReactNode;
};

export function SectionHeading({
  eyebrow,
  title,
  titleId,
  light = false,
  children,
}: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <p className={`eyebrow ${light ? "light" : ""}`}>{eyebrow}</p>
      <h2 id={titleId}>{title}</h2>
      {children}
    </div>
  );
}
