"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { usePositionsContext } from "@/app/Providers";
import { AccountPositionList } from "@/components/AccountPositionList";
import { Insights } from "@/components/Insights";

export default function SymbolPage() {
  const { symbol } = useParams<{ symbol: string }>();

  const { error, positionMap, setSelectedView, setSelectedSymbol } =
    usePositionsContext();

  useEffect(() => {
    setSelectedView("symbol");
    setSelectedSymbol(symbol ?? null);
  }, [symbol, setSelectedView, setSelectedSymbol]);

  const positionsForSelectedSymbol =
    symbol && positionMap[symbol] ? positionMap[symbol] : null;

  return (
    <>
      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      <AccountPositionList
        positionsForSelectedSymbol={positionsForSelectedSymbol}
        selectedSymbol={symbol}
      />

      <Insights
        symbol={symbol}
        positions={positionsForSelectedSymbol}
        thinkingMessage={
          symbol ? `Analyzing your ${symbol} positions` : "Analyzing"
        }
      />
    </>
  );
}
