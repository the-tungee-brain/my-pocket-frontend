"use client";

import { useEffect } from "react";
import { usePositionsContext } from "../Providers";
import { PortfolioOverview } from "@/components/PortfolioOverview";
import { Insights } from "@/components/Insights";

export default function PortfolioPage() {
  const {
    sessionAccessToken,
    error,
    allPositions,
    selectedView,
    setSelectedView,
  } = usePositionsContext();

  useEffect(() => {
    if (selectedView !== "portfolio") {
      setSelectedView("portfolio");
    }
  }, [selectedView, setSelectedView]);

  return (
    <>
      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      <PortfolioOverview />

      <Insights
        symbol={null}
        positions={allPositions}
        thinkingMessage="Analyzing this portfolio"
      />
    </>
  );
}
