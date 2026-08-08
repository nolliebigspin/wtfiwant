import { ReflectionJourney } from "@/components/reflection/reflection-journey";

export default async function ReflectionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <ReflectionJourney sessionId={sessionId} />;
}
