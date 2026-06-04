"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchMomentumBreakoutNotifications,
  markMomentumBreakoutNotificationRead,
} from "@/lib/momentumBreakoutAlerts";
import type { MomentumBreakoutNotificationDto } from "@/app/types/momentumBreakoutAlerts";

type Options = {
  enabled?: boolean;
  pollMs?: number;
};

export function useMomentumBreakoutNotifications(
  accessToken: string | undefined,
  options: Options = {},
) {
  const { enabled = true, pollMs = 60_000 } = options;
  const [notifications, setNotifications] = useState<
    MomentumBreakoutNotificationDto[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!accessToken || !enabled) return;
      if (!opts?.silent) setLoading(true);
      setError(null);
      try {
        const data = await fetchMomentumBreakoutNotifications(accessToken, {
          limit: 50,
        });
        setNotifications(data.notifications);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load notifications.",
        );
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [accessToken, enabled],
  );

  const markRead = useCallback(
    async (notificationId: string) => {
      if (!accessToken) return;
      const updated = await markMomentumBreakoutNotificationRead(
        accessToken,
        notificationId,
      );
      setNotifications((rows) =>
        rows.map((row) =>
          row.notificationId === notificationId
            ? updated.notification
            : row,
        ),
      );
    },
    [accessToken],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!accessToken || !enabled || pollMs <= 0) return;
    const id = window.setInterval(() => {
      void load({ silent: true });
    }, pollMs);
    return () => window.clearInterval(id);
  }, [accessToken, enabled, load, pollMs]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    reload: load,
    markRead,
  };
}
