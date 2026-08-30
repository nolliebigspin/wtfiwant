import type { Locale } from "@wtfiwant/shared";
import type { Metadata } from "next";
import { ResultsExperience } from "@/components/results/results-experience";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ResultPage({
  params,
}: {
  params: Promise<{ locale: string; sessionId: string }>;
}) {
  const { locale, sessionId } = await params;
  return <ResultsExperience sessionId={sessionId} locale={locale as Locale} />;
}
