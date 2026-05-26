"use client";

import { useState } from "react";
import { LineChart, ScrollText } from "lucide-react";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { PageSplit } from "@/components/PageShell";
import type { SecPeriod } from "@/lib/secUtils";
import { SecPeriodToggle } from "./SecPeriodToggle";
import { SecRatiosSection } from "./SecRatiosSection";
import { SecFinancialsTrendSection } from "./SecFinancialsTrendSection";
import { SecFilingsSection } from "./SecFilingsSection";

type FinancialsPageContentProps = {
  symbol: string;
};

export function FinancialsPageContent({ symbol }: FinancialsPageContentProps) {
  const [period, setPeriod] = useState<SecPeriod>("annual");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="text-xs text-muted">
          Filed financial history from SEC XBRL
        </p>
        <SecPeriodToggle period={period} onChange={setPeriod} />
      </div>

      <PageSplit
        main={
          <ResearchSectionCard
            title="Financial trends"
            description="Revenue, earnings, and cash flow from filed statements"
            icon={LineChart}
          >
            <SecFinancialsTrendSection symbol={symbol} period={period} />
          </ResearchSectionCard>
        }
        aside={
          <>
            <ResearchSectionCard
              title="Profitability & returns"
              description="Margins, ROE, free cash flow, and year-over-year growth"
              icon={LineChart}
            >
              <SecRatiosSection symbol={symbol} period={period} />
            </ResearchSectionCard>

            <ResearchSectionCard
              title="SEC filings"
              description="Recent 10-K, 10-Q, and other submitted documents"
              icon={ScrollText}
            >
              <SecFilingsSection symbol={symbol} />
            </ResearchSectionCard>
          </>
        }
      />
    </div>
  );
}
