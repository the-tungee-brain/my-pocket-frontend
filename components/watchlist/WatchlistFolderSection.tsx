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
import { Badge } from "@/components/ui/Badge";
import {
  moversRankedListLabelClass,
  moversRankedRowButtonClass,
  moversRankedRowHoverClass,
} from "@/lib/moversUi";

type Props = {
  folder: WatchlistFolder;
};

function formatChange(value: number | null, pct: number | null): string {
  if (value == null && pct == null) return "—";
  const sign = (value ?? 0) >= 0 ? "+" : "";
  const pricePart =
    value != null
      ? `${sign}${formatUsd(value, { maximumFractionDigits: 2 })}`
      : "";
  const pctPart = pct != null ? ` (${sign}${pct.toFixed(2)}%)` : "";
  return `${pricePart}${pctPart}`.trim() || "—";
}

export function WatchlistFolderSection({ folder }: Props) {
  const { setFolderCollapsed, removeSymbolFromFolder, isAuthenticated } =
    useWatchlistContext();
  const collapsed = folder.isCollapsed;

  return (
    <section className="app-panel">
      <button
        type="button"
        onClick={() => setFolderCollapsed(folder.id, !collapsed)}
        className={cn(
          "flex w-full items-center gap-3 border-b border-border/50 bg-gradient-to-br px-4 py-3.5 text-left transition hover:bg-muted-bg/40",
          watchlistSwatchClass(folder.swatchID),
          collapsed && "border-b-0",
        )}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 shrink-0 text-foreground/80" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-foreground/80" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-mono text-sm font-semibold text-foreground">
              {folder.name}
            </h3>
            {folder.isPinned ? <Badge variant="accent">Pinned</Badge> : null}
          </div>
          <p className="mt-0.5 text-xs text-foreground/70">
            {folder.symbols.length} symbol
            {folder.symbols.length === 1 ? "" : "s"}
          </p>
        </div>
      </button>

      {!collapsed && (
        <>
          <p className={moversRankedListLabelClass}>Symbols</p>
          <ul className="divide-y divide-border">
            {folder.symbols.length === 0 ? (
              <li className="px-4 py-8 text-center">
                <p className="text-sm font-medium text-foreground">
                  No symbols yet
                </p>
                <p className="mt-1 text-xs text-muted">
                  Add a symbol above or star one from Research.
                </p>
              </li>
            ) : (
              folder.symbols
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((symbol) => {
                  const changeTone =
                    (symbol.dayChange ?? 0) >= 0
                      ? "text-success"
                      : "text-danger";
                  return (
                    <li key={symbol.id} className="flex items-center gap-2">
                      <Link
                        href={symbolHubPath(symbol.ticker, "overview")}
                        className={cn(
                          moversRankedRowButtonClass,
                          moversRankedRowHoverClass,
                          "min-w-0 flex-1 items-center",
                        )}
                      >
                        <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                          <div className="min-w-0">
                            <span className="block font-mono text-sm font-semibold text-foreground">
                              {symbol.ticker}
                            </span>
                            <p className="truncate text-xs text-muted">
                              {symbol.companyName}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
                              {symbol.price != null
                                ? formatUsd(symbol.price, {
                                    maximumFractionDigits: 2,
                                  })
                                : "—"}
                            </p>
                            <p
                              className={cn("text-xs tabular-nums", changeTone)}
                            >
                              {formatChange(
                                symbol.dayChange,
                                symbol.dayChangePercent,
                              )}
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
                          className="mr-3"
                        >
                          <Star className="h-3.5 w-3.5 fill-accent-strong text-accent-strong" />
                        </IconButton>
                      )}
                    </li>
                  );
                })
            )}
          </ul>
        </>
      )}
    </section>
  );
}
