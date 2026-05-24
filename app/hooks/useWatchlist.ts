"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addToWatchlist,
  getWatchlist,
  isWatchlisted as checkWatchlisted,
  removeFromWatchlist,
  toggleWatchlist,
  WATCHLIST_UPDATED_EVENT,
} from "@/lib/watchlist";

export function useWatchlist() {
  const [symbols, setSymbols] = useState<string[]>([]);

  const refresh = useCallback(() => {
    setSymbols(getWatchlist());
  }, []);

  useEffect(() => {
    refresh();

    const handleUpdate = () => refresh();
    window.addEventListener(WATCHLIST_UPDATED_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(WATCHLIST_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [refresh]);

  const add = useCallback((symbol: string) => {
    setSymbols(addToWatchlist(symbol));
  }, []);

  const remove = useCallback((symbol: string) => {
    setSymbols(removeFromWatchlist(symbol));
  }, []);

  const toggle = useCallback((symbol: string) => {
    const result = toggleWatchlist(symbol);
    setSymbols(result.symbols);
    return result.added;
  }, []);

  const isWatchlisted = useCallback(
    (symbol: string) => symbols.includes(symbol.trim().toUpperCase()),
    [symbols],
  );

  return {
    symbols,
    add,
    remove,
    toggle,
    isWatchlisted,
    isWatchlistedSync: checkWatchlisted,
  };
}
