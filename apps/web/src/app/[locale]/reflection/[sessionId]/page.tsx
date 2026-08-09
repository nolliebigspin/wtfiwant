import type { Locale } from "@wtfiwant/shared";
import { ReflectionJourney } from "@/components/reflection/reflection-journey";

export default async function ReflectionPage({
  params,
}: {
  params: Promise<{ locale: string; sessionId: string }>;
}) {
  const { locale, sessionId } = await params;
  return <ReflectionJourney sessionId={sessionId} locale={locale as Locale} />;
}
