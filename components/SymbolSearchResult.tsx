"use client";

import { ArrowRight, Star } from "lucide-react";
import { useWatchlistToggle } from "@/app/hooks/useWatchlistToggle";
import type { TickerSymbolItem } from "@/app/hooks/useSymbolSearch";
import { AssetTypeBadge } from "@/components/AssetTypeBadge";
import { iconButtonClass } from "@/components/ui/IconButton";
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
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-foreground">
                {item.symbol}
              </span>
              {item.assetType ? (
                <AssetTypeBadge assetType={item.assetType} />
              ) : null}
            </div>
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
            iconButtonClass,
            "mr-2 h-8 w-8",
            watching && "text-accent-strong hover:enabled:text-accent-strong",
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
