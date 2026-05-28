"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAccountPlan } from "@/lib/apiClient";
import type { AccountPlan } from "@/app/types/account";

const cache = new Map<string, AccountPlan>();

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

  return {
    plan,
    isPaid: plan?.isPaid ?? false,
    loading,
    error,
    refresh,
  };
}
