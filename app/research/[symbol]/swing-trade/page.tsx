import { SwingTradeResearchPageContent } from "../DecisionHorizonPages";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function SwingTradeResearchPage({ params }: PageProps) {
  const { symbol } = await params;

  return <SwingTradeResearchPageContent symbol={symbol} />;
}
