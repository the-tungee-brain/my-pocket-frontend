import { DayTradeResearchPageContent } from "../DecisionHorizonPages";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function DayTradeResearchPage({ params }: PageProps) {
  const { symbol } = await params;

  return <DayTradeResearchPageContent symbol={symbol} />;
}
