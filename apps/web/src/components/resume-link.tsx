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
      className="motion-feedback inline-flex items-center gap-1 text-[0.8rem] font-extrabold no-underline transition-[color,transform] duration-150 hover:translate-x-0.5 hover:text-accent-ink hover:underline hover:underline-offset-4"
      href={`/reflection/${id}`}
    >
      {t("resume")} <span className="text-accent-ink">→</span>
    </Link>
  );
}
