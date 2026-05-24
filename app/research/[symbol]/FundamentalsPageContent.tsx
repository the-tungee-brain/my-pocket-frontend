"use client";

import { FileSpreadsheet, Landmark } from "lucide-react";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { FundamentalsSection } from "./FundamentalsSection";
import { SecCompanyBadge } from "./SecCompanyBadge";

type FundamentalsPageContentProps = {
  symbol: string;
};

export function FundamentalsPageContent({ symbol }: FundamentalsPageContentProps) {
  return (
    <div className="space-y-4">
      <ResearchSectionCard
        title="Fundamentals"
        description="AI overview and key metrics from SEC filings and market data"
        icon={FileSpreadsheet}
      >
        <FundamentalsSection symbol={symbol} />
      </ResearchSectionCard>

      <ResearchSectionCard
        title="SEC company profile"
        description="Official registrant details from EDGAR"
        icon={Landmark}
      >
        <SecCompanyBadge symbol={symbol} />
      </ResearchSectionCard>
    </div>
  );
}
