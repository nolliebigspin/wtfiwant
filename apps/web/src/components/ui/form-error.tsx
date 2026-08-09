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
    <p className="form-error" role={announce ? "alert" : undefined}>
      {children}
    </p>
  );
}
