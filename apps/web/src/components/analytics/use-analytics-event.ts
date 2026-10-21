"use client";
import type { AnalyticsEvent } from "@wtfiwant/shared";
import { useEffect } from "react";
import { trackAnalytics } from "@/lib/analytics";

export function useAnalyticsEvent(
  name: AnalyticsEvent["name"],
  page: AnalyticsEvent["page"],
  locale: AnalyticsEvent["locale"],
  step?: number,
  active = true,
) {
  useEffect(() => {
    if (!active) return;
    const record = () => trackAnalytics(name, page, locale, step);
    record();
    window.addEventListener("wtfiwant:analytics", record);
    return () => window.removeEventListener("wtfiwant:analytics", record);
  }, [name, page, locale, step, active]);
}
