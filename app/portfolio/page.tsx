"use client";

import { usePositionsContext } from "../Providers";
import { Insights } from "@/components/Insights";

export default function PortfolioPage() {
  const { error, allPositions } = usePositionsContext();

  return (
    <>
      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      <Insights
        symbol={null}
        positions={allPositions}
        thinkingMessage="Analyzing this portfolio"
      />
    </>
  );
}
