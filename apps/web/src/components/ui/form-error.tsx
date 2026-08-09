import type { ReactNode } from "react";

export function FormError({
  children,
  announce = true,
}: {
  children: ReactNode;
  announce?: boolean;
}) {
  if (!children) return null;

  return (
    <p
      className="mt-4 text-sm font-bold text-[#a22d19]"
      role={announce ? "alert" : undefined}
    >
      {children}
    </p>
  );
}
