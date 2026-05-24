import { Info } from "lucide-react";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { ResearchStockChart } from "../ResearchStockChart";
import { SummarySection } from "../SummarySection";
import { PerformanceSnapshot } from "../PerformanceSnapshot";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function OverviewPage({ params }: PageProps) {
  const { symbol } = await params;

  return (
    <>
      <ResearchStockChart symbol={symbol} />

      <ResearchSectionCard
        title="Big picture"
        description="Plain-language overview and AI sentiment"
        icon={Info}
      >
        <SummarySection symbol={symbol} />
      </ResearchSectionCard>

      <PerformanceSnapshot symbol={symbol} />
    </>
  );
}
