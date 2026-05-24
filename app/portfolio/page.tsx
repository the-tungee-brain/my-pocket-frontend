"use client";

import { usePositionsContext } from "../Providers";
import { Insights } from "@/components/Insights";
import { PortfolioOverview } from "@/components/PortfolioOverview";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

export default function PortfolioPage() {
  const { error, allPositions, loading, symbols, positionMap } =
    usePositionsContext();

  return (
    <>
      {error && <ErrorBanner message={error} className="mb-3" />}

      <PortfolioOverview
        loading={loading}
        allPositions={allPositions}
        symbols={symbols}
        positionMap={positionMap}
      />

      <Insights
        symbol={null}
        positions={allPositions}
        thinkingMessage="Analyzing this portfolio"
      />
    </>
  );
}
