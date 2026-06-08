"use client";

import { useEffect, useState } from "react";
import type { LaunchReadinessResponse } from "@/app/types/momentumBreakoutLaunchReadiness";
import {
  fetchMomentumBreakoutLaunchReadiness,
  showLaunchReadinessPanel,
} from "@/lib/momentumBreakoutLaunchReadiness";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { cn } from "@/lib/utils";

type Props = {
  accessToken: string;
  className?: string;
};

export function MomentumBreakoutLaunchReadinessPanel({
  accessToken,
  className,
}: Props) {
  const [data, setData] = useState<LaunchReadinessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!showLaunchReadinessPanel() || !accessToken) return;
    let cancelled = false;
    setLoading(true);
    void fetchMomentumBreakoutLaunchReadiness(accessToken, {
      adminToken: process.env.NEXT_PUBLIC_MB_ADMIN_TOKEN,
    })
      .then((response) => {
        if (!cancelled) setData(response);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load diagnostics",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  if (!showLaunchReadinessPanel()) return null;

  return (
    <div
      className={cn(
        "bg-muted-bg/25 px-3 py-3 text-xs",
        className,
      )}
    >
      <p className="font-semibold text-foreground">
        Launch readiness (internal)
      </p>
      <p className="mt-1 text-[10px] text-muted">
        Operational diagnostics only — not investment advice or performance
        claims.
      </p>

      {loading && <p className="mt-2 text-muted">Checking…</p>}
      {error && (
        <div className="mt-2">
          <ErrorBanner message={error} />
        </div>
      )}

      {data && (
        <div className="mt-3 space-y-2">
          <p
            className={cn(
              "font-semibold",
              data.ready ? "text-success" : "text-danger",
            )}
          >
            {data.ready ? "Ready" : "Not ready"}
          </p>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-muted">
            <dt>Alert store</dt>
            <dd className="text-foreground">{data.alertStoreType}</dd>
            <dt>Paper store</dt>
            <dd className="text-foreground">{data.paperTradeStoreType}</dd>
            <dt>Scheduler</dt>
            <dd className="text-foreground">
              {data.schedulerEnabled ? "on" : "off"} ({data.refreshIntervalSec}
              s)
            </dd>
            <dt>Quote provider</dt>
            <dd className="text-foreground">
              {data.quoteProviderAvailable ? "yes" : "no"}
            </dd>
            <dt>Lifecycle updated</dt>
            <dd className="text-foreground">
              {data.latestLifecycleUpdateAt ?? "—"}
            </dd>
            <dt>Paper updated</dt>
            <dd className="text-foreground">
              {data.latestPaperTradeUpdateAt ?? "—"}
            </dd>
          </dl>
          {data.warnings.length > 0 && (
            <ul className="list-inside list-disc text-muted">
              {data.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
