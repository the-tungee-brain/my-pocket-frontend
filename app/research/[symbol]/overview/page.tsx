import { Info } from "lucide-react";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { SummarySection } from "../SummarySection";
import { PerformanceSnapshot } from "../PerformanceSnapshot";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function OverviewPage({ params }: PageProps) {
  const { symbol } = await params;

  return (
    <>
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
