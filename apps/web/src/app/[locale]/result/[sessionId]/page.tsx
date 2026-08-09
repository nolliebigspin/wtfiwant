import type { Locale } from "@wtfiwant/shared";
import { ResultsExperience } from "@/components/results/results-experience";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ locale: string; sessionId: string }>;
}) {
  const { locale, sessionId } = await params;
  return <ResultsExperience sessionId={sessionId} locale={locale as Locale} />;
}
