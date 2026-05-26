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
    <div className="flex items-start justify-between gap-3 rounded-xl border border-accent/30 bg-accent-muted/30 px-3 py-2.5">
      <p className="text-xs leading-relaxed text-muted">
        <Star
          className="mr-1 inline h-3.5 w-3.5 fill-accent-strong text-accent-strong"
          aria-hidden="true"
        />
        Star <span className="font-mono font-medium text-foreground">{upper}</span>{" "}
        to save it to your sidebar watchlist.
      </p>
      <IconButton
        size="sm"
        aria-label="Dismiss watchlist tip"
        onClick={handleDismiss}
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </IconButton>
    </div>
  );
}
