"use client";

import { useEffect, useState } from "react";

export function ResumeLink() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => setId(localStorage.getItem("wtfiwant.sessionId")), []);
  if (!id) return null;
  return (
    <a className="resume-link" href={`/reflection/${id}`}>
      Continue your saved reflection <span>→</span>
    </a>
  );
}
