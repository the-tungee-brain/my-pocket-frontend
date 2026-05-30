"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAccountPlan } from "@/lib/apiClient";
import type { AccountPlan } from "@/app/types/account";
import {
  hasProFeature,
  resolveProFeatureAccess,
  type ProFeatureId,
} from "@/lib/planFeatures";

const cache = new Map<string, AccountPlan>();

export function clearAccountPlanCache(accessToken?: string) {
  if (accessToken) {
    cache.delete(accessToken);
    return;
  }
  cache.clear();
}

export function useAccountPlan(accessToken: string | undefined) {
  const [plan, setPlan] = useState<AccountPlan | null>(() =>
    accessToken ? (cache.get(accessToken) ?? null) : null,
  );
  const [loading, setLoading] = useState(Boolean(accessToken && !plan));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken) {
      setPlan(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const next = await fetchAccountPlan(accessToken);
      cache.set(accessToken, next);
      setPlan(next);
    } catch {
      setError("Couldn't load plan details.");
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!accessToken) return;

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [accessToken, refresh]);

  return {
    plan,
    isPaid: plan?.isPaid ?? false,
    loading,
    error,
    refresh,
  };
}

export function useProFeature(
  accessToken: string | undefined,
  feature: ProFeatureId,
) {
  const { plan, loading, error, refresh } = useAccountPlan(accessToken);
  const access = resolveProFeatureAccess(plan, loading, feature);

  return {
    ...access,
    error,
    refresh,
    hasProFeature: (id: ProFeatureId) => hasProFeature(plan, id),
  };
}
