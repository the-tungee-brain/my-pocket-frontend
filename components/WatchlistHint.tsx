"use client";

import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import { useWatchlist } from "@/app/hooks/useWatchlist";
import { IconButton } from "@/components/ui/IconButton";
import {
  dismissWatchlistHint,
  isWatchlistHintDismissed,
} from "@/lib/onboardingStorage";

type Props = {
  symbol: string;
};

export function WatchlistHint({ symbol }: Props) {
  const { isWatchlisted } = useWatchlist();
  const [dismissed, setDismissed] = useState(true);
  const upper = symbol.toUpperCase();

  useEffect(() => {
    setDismissed(isWatchlistHintDismissed());
  }, []);

  if (dismissed || isWatchlisted(upper)) {
    return null;
  }

  const handleDismiss = () => {
    dismissWatchlistHint();
    setDismissed(true);
  };

  return (
    <div
      role="note"
      className="inline-flex max-w-full min-w-0 items-center gap-2 rounded-xl border border-accent/30 bg-accent-muted/30 py-2 pl-2.5 pr-1.5"
    >
      <Star
        className="h-3.5 w-3.5 shrink-0 fill-accent-strong text-accent-strong"
        aria-hidden="true"
      />
      <p className="m-0 min-w-0 flex-1 text-xs leading-snug text-muted">
        Star{" "}
        <span className="font-mono font-medium text-foreground">{upper}</span> to
        save it to your sidebar watchlist.
      </p>
      <IconButton
        size="sm"
        className="shrink-0"
        aria-label="Dismiss watchlist tip"
        onClick={handleDismiss}
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </IconButton>
    </div>
  );
}
