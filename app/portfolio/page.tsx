"use client";

import { usePositionsContext } from "../Providers";
import { useTabs } from "@/app/contexts/TabContext";
import { Insights } from "@/components/Insights";
import { PortfolioOverview } from "@/components/PortfolioOverview";
import { PortfolioOnboarding } from "@/components/PortfolioOnboarding";
import { NewsHintBanner } from "@/components/NewsHintBanner";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

export default function PortfolioPage() {
  const {
    error,
    allPositions,
    loading,
    symbols,
    positionMap,
    cashSecuredPutSummary,
    account,
  } = usePositionsContext();
  const { activeTab } = useTabs();

  const showNewsHint =
    activeTab === "assistant" && !loading && symbols.length > 0;

  return (
    <>
      {error && <ErrorBanner message={error} className="mb-3" />}

      <PortfolioOnboarding />

      {showNewsHint && <NewsHintBanner symbols={symbols} />}

      <PortfolioOverview
        loading={loading}
        allPositions={allPositions}
        symbols={symbols}
        positionMap={positionMap}
        cashSecuredPutSummary={cashSecuredPutSummary}
        cashBalance={account?.securitiesAccount.currentBalances.cashBalance}
      />

      <Insights
        symbol={null}
        positions={allPositions}
        thinkingMessage="Analyzing this portfolio"
      />
    </>
  );
}
