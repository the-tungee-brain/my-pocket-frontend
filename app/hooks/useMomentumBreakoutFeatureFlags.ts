"use client";

import { useCallback, useEffect, useState } from "react";
import type { MomentumBreakoutFeatureFlags } from "@/app/types/momentumBreakoutFeatureFlags";
import { fetchMomentumBreakoutFeatureStatus } from "@/lib/momentumBreakoutFeatureFlags";

const DEFAULT_FLAGS: MomentumBreakoutFeatureFlags = {
  alertsEnabled: true,
  alertCreationEnabled: true,
  alertNotificationsEnabled: true,
  paperAnalyticsEnabled: true,
};

export function useMomentumBreakoutFeatureFlags(accessToken: string | undefined) {
  const [flags, setFlags] = useState<MomentumBreakoutFeatureFlags>(DEFAULT_FLAGS);
  const [loading, setLoading] = useState(Boolean(accessToken));
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetchMomentumBreakoutFeatureStatus(accessToken);
      setFlags(response.flags);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feature flags");
      setFlags(DEFAULT_FLAGS);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { flags, loading, error, reload };
}
