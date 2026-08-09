import type { ReactNode } from "react";

export function FormError({ children }: { children: ReactNode }) {
  if (!children) return null;

  return (
    <p className="form-error" role="alert">
      {children}
    </p>
  );
}
