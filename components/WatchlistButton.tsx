"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useWatchlistToggle } from "@/app/hooks/useWatchlistToggle";
import { cn } from "@/lib/utils";

type Props = {
  symbol: string;
  className?: string;
  size?: "xs" | "sm";
  iconOnly?: boolean;
};

export function WatchlistButton({
  symbol,
  className,
  size = "xs",
  iconOnly = false,
}: Props) {
  const { watching, handleToggle, symbol: upper } = useWatchlistToggle(symbol);
  const label = watching
    ? `Remove ${upper} from watchlist`
    : `Add ${upper} to watchlist`;

  return (
    <Button
      type="button"
      size={iconOnly ? "icon" : size}
      variant={iconOnly ? "icon" : watching ? "default" : "outline"}
      className={cn(
        !iconOnly &&
          watching &&
          "bg-accent-muted text-accent-strong hover:bg-accent-muted/80",
        iconOnly && watching && "text-accent-strong hover:enabled:text-accent-strong",
        className,
      )}
      aria-pressed={watching}
      aria-label={label}
      title={label}
      onClick={() => handleToggle()}
    >
      <Star
        className={cn("h-3.5 w-3.5", watching && "fill-current")}
        aria-hidden="true"
      />
      {!iconOnly && (watching ? "Watching" : "Add to watchlist")}
    </Button>
  );
}
