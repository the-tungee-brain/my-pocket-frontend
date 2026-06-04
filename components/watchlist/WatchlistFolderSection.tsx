"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, Star } from "lucide-react";
import type { WatchlistFolder } from "@/app/types/watchlist";
import { useWatchlistContext } from "@/app/contexts/WatchlistContext";
import { formatUsd } from "@/lib/formatCurrency";
import { symbolHubPath } from "@/lib/symbolRoutes";
import { watchlistSwatchClass } from "@/lib/watchlistSwatches";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/IconButton";

type Props = {
  folder: WatchlistFolder;
};

function formatChange(value: number | null, pct: number | null): string {
  if (value == null && pct == null) return "—";
  const sign = (value ?? 0) >= 0 ? "+" : "";
  const pricePart =
    value != null ? `${sign}${formatUsd(value, { maximumFractionDigits: 2 })}` : "";
  const pctPart =
    pct != null
      ? ` (${sign}${pct.toFixed(2)}%)`
      : "";
  return `${pricePart}${pctPart}`.trim() || "—";
}

export function WatchlistFolderSection({ folder }: Props) {
  const { setFolderCollapsed, removeSymbolFromFolder, isAuthenticated } =
    useWatchlistContext();
  const collapsed = folder.isCollapsed;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-background/40">
      <button
        type="button"
        onClick={() => setFolderCollapsed(folder.id, !collapsed)}
        className={cn(
          "flex w-full items-center gap-3 bg-gradient-to-br px-4 py-3 text-left",
          watchlistSwatchClass(folder.swatchID),
        )}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 shrink-0 text-foreground/80" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-foreground/80" />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">{folder.name}</h3>
          <p className="text-xs text-foreground/70">
            {folder.symbols.length} symbol
            {folder.symbols.length === 1 ? "" : "s"}
            {folder.isPinned ? " · Pinned" : ""}
          </p>
        </div>
      </button>

      {!collapsed && (
        <ul className="divide-y divide-border/80">
          {folder.symbols.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-muted">
              No symbols in this folder yet.
            </li>
          ) : (
            folder.symbols
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((symbol) => {
                const changeTone =
                  (symbol.dayChange ?? 0) >= 0 ? "text-success" : "text-danger";
                return (
                  <li
                    key={symbol.id}
                    className="flex items-center gap-2 px-3 py-2.5 sm:px-4"
                  >
                    <Link
                      href={symbolHubPath(symbol.ticker, "overview")}
                      className="min-w-0 flex-1 rounded-lg px-1 py-0.5 transition hover:bg-muted-bg/50"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-mono text-sm font-semibold text-foreground">
                            {symbol.ticker}
                          </span>
                          <p className="truncate text-xs text-muted">
                            {symbol.companyName}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-medium tabular-nums text-foreground">
                            {symbol.price != null
                              ? formatUsd(symbol.price, { maximumFractionDigits: 2 })
                              : "—"}
                          </p>
                          <p className={cn("text-xs tabular-nums", changeTone)}>
                            {formatChange(symbol.dayChange, symbol.dayChangePercent)}
                          </p>
                        </div>
                      </div>
                    </Link>
                    {isAuthenticated && (
                      <IconButton
                        size="sm"
                        aria-label={`Remove ${symbol.ticker} from ${folder.name}`}
                        title="Remove from folder"
                        onClick={() =>
                          removeSymbolFromFolder(symbol.ticker, folder.id)
                        }
                      >
                        <Star className="h-3.5 w-3.5 fill-accent-strong text-accent-strong" />
                      </IconButton>
                    )}
                  </li>
                );
              })
          )}
        </ul>
      )}
    </section>
  );
}
