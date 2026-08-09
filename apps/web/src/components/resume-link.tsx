"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

export function ResumeLink() {
  const t = useTranslations("Landing");
  const [id, setId] = useState<string | null>(null);
  useEffect(() => setId(localStorage.getItem("wtfiwant.sessionId")), []);
  if (!id) return null;
  return (
    <Link
      className="text-[0.8rem] font-extrabold no-underline hover:underline hover:underline-offset-4"
      href={`/reflection/${id}`}
    >
      {t("resume")} <span className="text-accent-ink">→</span>
    </Link>
  );
}
