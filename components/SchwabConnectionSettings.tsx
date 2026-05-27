"use client";

import Link from "next/link";
import { Check, Link2, Loader2 } from "lucide-react";
import { useSchwabConnect } from "@/app/hooks/useSchwabConnect";
import { useSchwabStatus } from "@/app/hooks/useSchwabStatus";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import {
  SCHWAB_CONNECT_PROMPT,
  SCHWAB_READ_ONLY_LINE,
} from "@/lib/schwabTrustCopy";
import { cn } from "@/lib/utils";

export function SchwabConnectionSettings() {
  const {
    authorized,
    loading: statusLoading,
    error: statusError,
    refetch,
  } = useSchwabStatus();

  const {
    connect,
    connecting,
    connectError,
    clearConnectError,
  } = useSchwabConnect();

  const handleConnect = () => {
    clearConnectError();
    void connect();
  };

  const linked = authorized === true;

  return (
    <div className="rounded-2xl border border-border bg-secondary/60 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              linked
                ? "bg-accent-muted text-accent-strong"
                : "bg-muted-bg text-muted",
            )}
          >
            {statusLoading || connecting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : linked ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Link2 className="h-4 w-4" aria-hidden="true" />
            )}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Charles Schwab
            </p>
            <p className="mt-0.5 text-sm text-muted">
              {statusLoading
                ? "Checking connection…"
                : connecting
                  ? "Redirecting to Schwab’s secure login…"
                  : linked
                    ? "Account linked — positions and activity sync from Schwab."
                    : SCHWAB_CONNECT_PROMPT}
            </p>
            {!statusLoading && !linked && (
              <p className="mt-2 text-xs leading-relaxed text-muted">
                {SCHWAB_READ_ONLY_LINE}{" "}
                <Link
                  href="/security"
                  className="font-medium text-accent-strong hover:underline"
                >
                  Learn more
                </Link>
              </p>
            )}
          </div>
        </div>

        {!statusLoading && !linked && (
          <Button
            type="button"
            size="sm"
            disabled={connecting}
            onClick={handleConnect}
            className="shrink-0 sm:min-w-36"
          >
            {connecting ? "Connecting…" : "Connect Schwab"}
          </Button>
        )}
      </div>

      {(statusError || connectError) && (
        <ErrorBanner
          message={connectError ?? statusError ?? "Could not update Schwab connection."}
          onRetry={() => {
            clearConnectError();
            if (connectError) {
              void handleConnect();
              return;
            }
            refetch();
          }}
          className="mt-4"
        />
      )}
    </div>
  );
}
