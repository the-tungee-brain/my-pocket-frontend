import { LongTermResearchPageContent } from "../DecisionHorizonPages";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function LongTermResearchPage({ params }: PageProps) {
  const { symbol } = await params;

  return <LongTermResearchPageContent symbol={symbol} />;
}
