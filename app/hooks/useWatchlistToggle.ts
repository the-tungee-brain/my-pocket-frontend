"use client";

import { useCallback } from "react";
import { useToast } from "@/app/contexts/ToastContext";
import { useWatchlist } from "./useWatchlist";
import { track } from "@/lib/analytics";

export function useWatchlistToggle(symbol: string, companyName?: string) {
  const { isWatchlisted, toggle } = useWatchlist();
  const { showToast } = useToast();
  const upper = symbol.trim().toUpperCase();
  const watching = isWatchlisted(upper);

  const handleToggle = useCallback(
    (event?: { stopPropagation?: () => void }) => {
      event?.stopPropagation?.();
      const added = toggle(upper, companyName);
      showToast(
        added
          ? `${upper} added to watchlist`
          : `${upper} removed from watchlist`,
      );
      track("watchlist_symbol_toggled", {
        symbol: upper,
        action: added ? "added" : "removed",
      });
      return added;
    },
    [toggle, upper, companyName, showToast],
  );

  return { watching, handleToggle, symbol: upper };
}
