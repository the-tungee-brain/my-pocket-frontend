"use client";

import { usePositionsContext } from "../Providers";
import { Insights } from "@/components/Insights";
import { PortfolioOverview } from "@/components/PortfolioOverview";

export default function PortfolioPage() {
  const { error, allPositions, loading, symbols, positionMap } =
    usePositionsContext();

  return (
    <>
      {error && (
        <p className="mb-3 text-sm text-danger">{error}</p>
      )}

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
