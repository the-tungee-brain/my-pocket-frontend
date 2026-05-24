"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getRecentSymbols,
  clearRecentSymbols as clearRecentSymbolsStorage,
  RECENT_SYMBOLS_UPDATED_EVENT,
} from "@/lib/recentSymbols";

export function useRecentSymbols() {
  const [symbols, setSymbols] = useState<string[]>([]);

  const refresh = useCallback(() => {
    setSymbols(getRecentSymbols());
  }, []);

  const clear = useCallback(() => {
    setSymbols(clearRecentSymbolsStorage());
  }, []);

  useEffect(() => {
    refresh();

    const handleUpdate = () => refresh();
    window.addEventListener(RECENT_SYMBOLS_UPDATED_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(RECENT_SYMBOLS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [refresh]);

  return { symbols, refresh, clear };
}
