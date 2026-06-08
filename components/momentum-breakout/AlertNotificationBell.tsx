"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bell, Loader2 } from "lucide-react";
import { useMomentumBreakoutFeatureFlags } from "@/app/hooks/useMomentumBreakoutFeatureFlags";
import { useMomentumBreakoutNotifications } from "@/app/hooks/useMomentumBreakoutNotifications";
import { IconButton } from "@/components/ui/IconButton";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import {
  formatRelativeTime,
  notificationSeverityClass,
} from "@/lib/momentumBreakoutAlertUi";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function AlertNotificationBell({ className }: Props) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const { flags } = useMomentumBreakoutFeatureFlags(accessToken);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, loading, error, reload, markRead } =
    useMomentumBreakoutNotifications(accessToken, {
      enabled:
        !!accessToken && flags.alertsEnabled && flags.alertNotificationsEnabled,
    });

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  if (
    !accessToken ||
    !flags.alertsEnabled ||
    !flags.alertNotificationsEnabled
  ) {
    return null;
  }

  return (
    <div ref={panelRef} className={cn("relative", className)}>
      <IconButton
        size="sm"
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread trade plan notifications`
            : "Trade plan notifications"
        }
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center bg-danger px-1 text-[9px] font-bold text-background">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </IconButton>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden border border-border bg-background shadow-lg"
          role="dialog"
          aria-label="Momentum Breakout notifications"
        >
          <div className="border-b border-border/60 px-3 py-2.5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-wide text-foreground">
              Trade plan notifications
            </p>
            <p className="mt-0.5 text-[10px] text-muted">
              Educational monitoring only — no orders placed.
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 && (
              <div className="flex items-center justify-center gap-2 px-3 py-8 text-xs text-muted">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Loading…
              </div>
            )}

            {error && (
              <div className="p-3">
                <ErrorBanner message={error} onRetry={() => void reload()} />
              </div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <p className="px-3 py-8 text-center text-xs text-muted">
                No notifications yet.
              </p>
            )}

            <ul className="divide-y divide-border/50">
              {notifications.slice(0, 20).map((row) => (
                <li key={row.notificationId}>
                  <button
                    type="button"
                    className={cn(
                      "w-full px-3 py-2.5 text-left transition-colors hover:bg-muted-bg/60",
                      !row.read && "bg-accent-muted/15",
                    )}
                    onClick={() => {
                      void markRead(row.notificationId).catch(() => {
                        // mark-read failure is surfaced on next reload
                      });
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={cn(
                          "shrink-0 border px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                          notificationSeverityClass(row.severity),
                        )}
                      >
                        {row.eventType}
                      </span>
                      <span className="text-[10px] text-muted">
                        {formatRelativeTime(row.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-foreground">
                      {row.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted">
                      {row.body}
                    </p>
                    {!row.read && (
                      <span className="mt-1 inline-block text-[10px] font-semibold text-accent-strong">
                        Mark read
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-border/60 px-3 py-2">
            <Link
              href="/momentum-breakout"
              className="text-[11px] font-semibold text-accent-strong hover:underline"
              onClick={() => setOpen(false)}
            >
              View all alerts
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
