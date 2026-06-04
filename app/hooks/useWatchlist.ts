"use client";

import { useWatchlistContext } from "@/app/contexts/WatchlistContext";

export function useWatchlist() {
  const {
    symbols,
    requestAddSymbol,
    removeSymbolFromAll,
    toggleSymbol,
    isWatchlisted,
  } = useWatchlistContext();

  return {
    symbols,
    add: (symbol: string, companyName?: string) =>
      requestAddSymbol(symbol, companyName),
    remove: removeSymbolFromAll,
    toggle: (symbol: string, companyName?: string) =>
      toggleSymbol(symbol, companyName),
    isWatchlisted,
  };
}
