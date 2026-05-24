import { Info } from "lucide-react";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { ResearchStockChart } from "../ResearchStockChart";
import { SymbolIntelligenceSection } from "../SymbolIntelligenceSection";
import { SymbolResearchAlertsSection } from "../SymbolResearchAlertsSection";
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

      <SymbolResearchAlertsSection symbol={symbol} />

      <SymbolIntelligenceSection symbol={symbol} />

      <ResearchSectionCard
        title="Big picture"
        description="In-depth overview, thesis, strengths, risks, and valuation"
        icon={Info}
      >
        <SummarySection symbol={symbol} />
      </ResearchSectionCard>

      <PerformanceSnapshot symbol={symbol} />
    </>
  );
}
