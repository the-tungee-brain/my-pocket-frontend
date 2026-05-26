import { SummarySection } from "../SummarySection";
import { ResearchOverviewTopSection } from "../ResearchOverviewTopSection";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function OverviewPage({ params }: PageProps) {
  const { symbol } = await params;

  return (
    <>
      <ResearchOverviewTopSection symbol={symbol} />
      <SummarySection symbol={symbol} />
    </>
  );
}
