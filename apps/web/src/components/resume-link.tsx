"use client";

import { useEffect, useState } from "react";

export function ResumeLink() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => setId(localStorage.getItem("wtfiwant.sessionId")), []);
  if (!id) return null;
  return (
    <a
      className="text-[0.8rem] font-extrabold no-underline hover:underline hover:underline-offset-4"
      href={`/reflection/${id}`}
    >
      Continue your saved reflection <span className="text-accent-ink">→</span>
    </a>
  );
}
