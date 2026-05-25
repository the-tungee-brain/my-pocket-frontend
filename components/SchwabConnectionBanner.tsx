"use client";

import { Link2Off, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useSchwabConnect } from "@/app/hooks/useSchwabConnect";
import { cn } from "@/lib/utils";

type Props = {
  message?: string | null;
  authorizationUrl?: string | null;
  onReconnect?: () => void;
  className?: string;
};

export function SchwabConnectionBanner({
  message,
  authorizationUrl,
  onReconnect,
  className,
}: Props) {
  const { connect, connecting } = useSchwabConnect();

  const handleReconnect = () => {
    if (authorizationUrl) {
      window.location.assign(authorizationUrl);
      return;
    }
    if (onReconnect) {
      onReconnect();
      return;
    }
    void connect();
  };

  return (
    <div
      className={cn(
        "mb-3 flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      role="status"
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <Link2Off
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-800 dark:text-amber-200"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            Schwab connection needs attention
          </p>
          <p className="text-xs text-muted">
            {message ??
              "Reconnect Schwab to refresh positions, options, and order history."}
          </p>
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="shrink-0"
        disabled={connecting}
        onClick={handleReconnect}
      >
        <RefreshCw
          className={cn("h-3.5 w-3.5", connecting && "animate-spin")}
          aria-hidden
        />
        {connecting ? "Connecting…" : "Reconnect Schwab"}
      </Button>
    </div>
  );
}
