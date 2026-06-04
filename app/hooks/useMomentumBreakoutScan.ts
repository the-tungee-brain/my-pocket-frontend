"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchMomentumBreakoutScan } from "@/lib/momentumBreakoutScan";
import type { MomentumBreakoutScanResponse } from "@/app/types/momentumBreakoutScan";

type Options = {
  enabled?: boolean;
  tradableOnly?: boolean;
};

export function useMomentumBreakoutScan(
  accessToken: string | undefined,
  options: Options = {},
) {
  const { enabled = true, tradableOnly = false } = options;
  const [scan, setScan] = useState<MomentumBreakoutScanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!accessToken || !enabled) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMomentumBreakoutScan(accessToken, {
        limit: 20,
        tradableOnly,
      });
      setScan(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load today's breakout ideas.",
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, enabled, tradableOnly]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { scan, loading, error, reload };
}
