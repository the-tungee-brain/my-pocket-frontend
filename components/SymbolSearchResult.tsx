"use client";

import { ArrowRight, Star } from "lucide-react";
import { useWatchlistToggle } from "@/app/hooks/useWatchlistToggle";
import type { TickerSymbolItem } from "@/app/hooks/useSymbolSearch";
import { cn } from "@/lib/utils";

type Props = {
  item: TickerSymbolItem;
  index: number;
  activeIndex: number;
  onSelect: (item: TickerSymbolItem) => void;
  onHover: () => void;
};

export function SymbolSearchResult({
  item,
  index,
  activeIndex,
  onSelect,
  onHover,
}: Props) {
  const { watching, handleToggle, symbol } = useWatchlistToggle(item.symbol);
  const starLabel = watching
    ? `Remove ${symbol} from watchlist`
    : `Add ${symbol} to watchlist`;

  return (
    <li role="presentation">
      <div
        className={cn(
          "flex w-full items-center gap-1",
          index === activeIndex && "bg-muted-bg",
        )}
        onMouseEnter={onHover}
      >
        <button
          id={`research-symbol-option-${index}`}
          type="button"
          role="option"
          aria-selected={index === activeIndex}
          className="flex min-w-0 flex-1 items-center justify-between gap-3 px-3 py-3 text-left transition hover:bg-secondary/80"
          onClick={() => onSelect(item)}
        >
          <div className="min-w-0">
            <span className="font-mono font-semibold text-foreground">
              {item.symbol}
            </span>
            {item.title && (
              <p className="truncate text-xs text-muted">{item.title}</p>
            )}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted">
            Open
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </button>
        <button
          type="button"
          aria-pressed={watching}
          aria-label={starLabel}
          title={starLabel}
          className={cn(
            "mr-2 shrink-0 rounded-lg p-2 transition",
            watching
              ? "text-accent-strong hover:bg-accent-muted"
              : "text-muted hover:bg-muted-bg hover:text-foreground",
          )}
          onClick={(event) => handleToggle(event)}
        >
          <Star
            className={cn("h-4 w-4", watching && "fill-current")}
            aria-hidden="true"
          />
        </button>
      </div>
    </li>
  );
}
