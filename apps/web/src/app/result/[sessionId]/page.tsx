import { ResultsExperience } from "@/components/results/results-experience";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <ResultsExperience sessionId={sessionId} />;
}
