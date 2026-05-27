"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Check, Link2, Loader2, Unlink } from "lucide-react";
import { useToast } from "@/app/contexts/ToastContext";
import { useSchwabConnect } from "@/app/hooks/useSchwabConnect";
import { useSchwabDisconnect } from "@/app/hooks/useSchwabDisconnect";
import { useSchwabStatus } from "@/app/hooks/useSchwabStatus";
import { usePositionsContext } from "@/app/Providers";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import {
  SCHWAB_CONNECT_PROMPT,
  SCHWAB_READ_ONLY_LINE,
} from "@/lib/schwabTrustCopy";
import { cn } from "@/lib/utils";

export function SchwabConnectionSettings() {
  const { showToast } = useToast();
  const { clearPortfolioData } = usePositionsContext();
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

  const {
    disconnect,
    disconnecting,
    disconnectError,
    clearDisconnectError,
  } = useSchwabDisconnect();

  const handleConnect = () => {
    clearConnectError();
    void connect();
  };

  const handleDisconnect = async () => {
    clearDisconnectError();
    const ok = await disconnect();
    if (!ok) return;

    clearPortfolioData();
    await refetch();
    showToast("Schwab account disconnected.");
  };

  const linked = authorized === true;
  const busy = statusLoading || connecting || disconnecting;
  const schwabErrorNotifiedRef = useRef(false);

  useEffect(() => {
    if (schwabErrorNotifiedRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    if (!status || status === "success") return;

    schwabErrorNotifiedRef.current = true;

    const messages: Record<string, string> = {
      error: "Schwab connection was cancelled.",
      invalid: "Schwab returned an invalid authorization response.",
      error_state: "Schwab connection expired. Please try again.",
      error_token: "Could not finish Schwab connection. Please try again.",
    };

    showToast(messages[status] ?? "Could not connect Schwab. Please try again.");

    const url = new URL(window.location.href);
    url.searchParams.delete("status");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [showToast]);

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
            {busy ? (
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
                  : disconnecting
                    ? "Disconnecting Schwab…"
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

        {!statusLoading && linked && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disconnecting}
            onClick={() => void handleDisconnect()}
            className="shrink-0 sm:min-w-36"
          >
            {disconnecting ? (
              "Disconnecting…"
            ) : (
              <>
                <Unlink className="h-4 w-4" aria-hidden="true" />
                Disconnect
              </>
            )}
          </Button>
        )}

        {!statusLoading && !linked && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={connecting}
            onClick={handleConnect}
            className="shrink-0 sm:min-w-36"
          >
            {connecting ? (
              "Connecting…"
            ) : (
              <>
                <Link2 className="h-4 w-4" aria-hidden="true" />
                Connect Schwab
              </>
            )}
          </Button>
        )}
      </div>

      {(statusError || connectError || disconnectError) && (
        <ErrorBanner
          message={
            disconnectError ??
            connectError ??
            statusError ??
            "Could not update Schwab connection."
          }
          onRetry={() => {
            clearConnectError();
            clearDisconnectError();
            if (disconnectError) {
              void handleDisconnect();
              return;
            }
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
