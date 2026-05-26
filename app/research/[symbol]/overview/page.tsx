import { SummarySection } from "../SummarySection";
import { ResearchOverviewTopSection } from "../ResearchOverviewTopSection";
import { EtfHoldingsOverviewPreview } from "../EtfHoldingsPageContent";
import { EtfOverviewGate } from "../EtfOverviewGate";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function OverviewPage({ params }: PageProps) {
  const { symbol } = await params;

  return (
    <>
      <ResearchOverviewTopSection symbol={symbol} />
      <EtfOverviewGate symbol={symbol}>
        <EtfHoldingsOverviewPreview symbol={symbol} />
      </EtfOverviewGate>
      <SummarySection symbol={symbol} />
    </>
  );
}
