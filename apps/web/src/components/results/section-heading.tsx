import type { ReactNode } from "react";
import { eyebrowClassName, lightEyebrowClassName } from "@/lib/styles";

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
    <div
      className={`motion-reveal mb-12 max-w-3xl [&>p:last-child]:leading-relaxed ${
        light ? "[&>p:last-child]:text-white/55" : "[&>p:last-child]:text-muted"
      }`}
    >
      <p className={light ? lightEyebrowClassName : eyebrowClassName}>
        {eyebrow}
      </p>
      <h2
        className="m-0 text-[clamp(2.8rem,6vw,6.5rem)] leading-[0.9] tracking-[-0.075em]"
        id={titleId}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}
