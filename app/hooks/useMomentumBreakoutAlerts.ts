"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  cancelMomentumBreakoutAlert,
  fetchMomentumBreakoutActiveAlerts,
  fetchMomentumBreakoutAlertHistory,
  refreshMomentumBreakoutAlerts,
} from "@/lib/momentumBreakoutAlerts";
import type { MomentumBreakoutAlertDto } from "@/app/types/momentumBreakoutAlerts";

const ACTIVE_POLL_MS = 60_000;

type Options = {
  enabled?: boolean;
  includeHistory?: boolean;
  historyLimit?: number;
};

export function useMomentumBreakoutAlerts(
  accessToken: string | undefined,
  options: Options = {},
) {
  const { enabled = true, includeHistory = true, historyLimit = 100 } = options;
  const [activeAlerts, setActiveAlerts] = useState<MomentumBreakoutAlertDto[]>([]);
  const [historyAlerts, setHistoryAlerts] = useState<MomentumBreakoutAlertDto[]>([]);
  const [disclaimer, setDisclaimer] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [refreshWarnings, setRefreshWarnings] = useState<string[]>([]);
  const [cancellingAlertId, setCancellingAlertId] = useState<string | null>(null);

  const loadActiveRef = useRef<() => Promise<void>>(async () => {});

  const loadActive = useCallback(async () => {
    if (!accessToken || !enabled) return;
    const data = await fetchMomentumBreakoutActiveAlerts(accessToken);
    setActiveAlerts(data.alerts);
    setDisclaimer(data.disclaimer);
    setLastUpdated(Date.now());
  }, [accessToken, enabled]);

  loadActiveRef.current = loadActive;

  const loadHistory = useCallback(async () => {
    if (!accessToken || !enabled) return;
    const data = await fetchMomentumBreakoutAlertHistory(
      accessToken,
      historyLimit,
    );
    setHistoryAlerts(data.alerts);
    setDisclaimer((current) => current || data.disclaimer);
  }, [accessToken, enabled, historyLimit]);

  const loadAll = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!accessToken || !enabled) return;
      if (!opts?.silent) setLoading(true);
      setError(null);
      try {
        if (includeHistory) {
          await Promise.all([loadActive(), loadHistory()]);
        } else {
          await loadActive();
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load Momentum Breakout alerts.",
        );
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [accessToken, enabled, includeHistory, loadActive, loadHistory],
  );

  const cancelAlert = useCallback(
    async (alertId: string) => {
      if (!accessToken || !enabled || !alertId) return;
      setCancellingAlertId(alertId);
      setError(null);
      try {
        await cancelMomentumBreakoutAlert(accessToken, alertId);
        if (includeHistory) {
          await Promise.all([loadActive(), loadHistory()]);
        } else {
          await loadActive();
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not cancel this alert.",
        );
      } finally {
        setCancellingAlertId(null);
      }
    },
    [accessToken, enabled, includeHistory, loadActive, loadHistory],
  );

  const manualRefresh = useCallback(async () => {
    if (!accessToken || !enabled) return;
    setRefreshing(true);
    setError(null);
    setRefreshWarnings([]);
    try {
      const result = await refreshMomentumBreakoutAlerts(accessToken);
      setActiveAlerts(result.alerts);
      setDisclaimer(result.disclaimer);
      setRefreshWarnings(result.warnings);
      setLastUpdated(Date.now());
      if (includeHistory) {
        await loadHistory();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not refresh alerts.",
      );
    } finally {
      setRefreshing(false);
    }
  }, [accessToken, enabled, includeHistory, loadHistory]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!accessToken || !enabled) return;
    const id = window.setInterval(() => {
      void loadActiveRef.current().catch(() => {
        // Polling errors are non-fatal; next tick retries.
      });
    }, ACTIVE_POLL_MS);
    return () => window.clearInterval(id);
  }, [accessToken, enabled]);

  return {
    activeAlerts,
    historyAlerts,
    disclaimer,
    loading,
    refreshing,
    error,
    lastUpdated,
    refreshWarnings,
    reload: loadAll,
    manualRefresh,
    cancelAlert,
    cancellingAlertId,
  };
}
