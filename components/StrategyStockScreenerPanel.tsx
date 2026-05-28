"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type {
  InvestmentStrategy,
  StrategyScreenerFilters,
  StrategyScreenerQuote,
} from "@/app/types/strategy";
import { Button } from "@/components/ui/Button";
import {
  filterSummaryChips,
  formatMarketCap,
  formatPercent,
  formatPrice,
  MARKET_CAP_PRESETS,
  SCREENER_SECTOR_OPTIONS,
  screenerTitle,
} from "@/lib/strategyScreener";
import { cn } from "@/lib/utils";

type SortKey = "symbol" | "marketCap" | "peRatio" | "dividendYield" | "price";

type Props = {
  strategy: InvestmentStrategy;
  preset?: {
    label: string;
    description: string;
    postFilters: Record<string, unknown>;
    postFilterStatus?: string;
  } | null;
  quotes: StrategyScreenerQuote[];
  summary?: string | null;
  filters: StrategyScreenerFilters;
  onFiltersChange: (filters: StrategyScreenerFilters) => void;
  loading?: boolean;
  error?: string | null;
  stale?: boolean;
  hasRun?: boolean;
  onRun: () => void;
  onAddSymbol: (symbol: string) => void;
  selectedSymbols?: string[];
  className?: string;
  compact?: boolean;
};

export function StrategyStockScreenerPanel({
  strategy,
  preset,
  quotes,
  summary,
  filters,
  onFiltersChange,
  loading = false,
  error = null,
  stale = false,
  hasRun = false,
  onRun,
  onAddSymbol,
  selectedSymbols = [],
  className,
  compact = false,
}: Props) {
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("marketCap");
  const [sortAsc, setSortAsc] = useState(false);

  const selected = useMemo(
    () => new Set(selectedSymbols.map((symbol) => symbol.toUpperCase())),
    [selectedSymbols],
  );

  const chips = filterSummaryChips(filters);

  const visibleQuotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? quotes.filter((quote) => {
          const haystack = `${quote.symbol} ${quote.companyName ?? ""}`.toLowerCase();
          return haystack.includes(query);
        })
      : quotes;

    return [...filtered].sort((a, b) => {
      const direction = sortAsc ? 1 : -1;
      const left = a[sortKey] ?? (sortKey === "symbol" ? a.symbol : -Infinity);
      const right = b[sortKey] ?? (sortKey === "symbol" ? b.symbol : -Infinity);
      if (typeof left === "string" && typeof right === "string") {
        return left.localeCompare(right) * direction;
      }
      return ((Number(left) || 0) - (Number(right) || 0)) * direction;
    });
  }, [quotes, search, sortAsc, sortKey]);

  function toggleSector(sector: string) {
    const current = new Set(filters.sectors ?? []);
    if (current.has(sector)) {
      current.delete(sector);
    } else {
      current.add(sector);
    }
    onFiltersChange({
      ...filters,
      sectors: [...current],
    });
  }

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortAsc((value) => !value);
      return;
    }
    setSortKey(nextKey);
    setSortAsc(nextKey === "symbol");
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-background/40 p-3",
        className,
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-accent-strong" />
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-strong">
              {preset?.label ?? screenerTitle(strategy)}
            </p>
          </div>
          {!compact && (
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {summary ?? preset?.description ??
                "Run a Yahoo Finance screen using strategy filters, then add names you want to track."}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="xs"
            variant="outline"
            onClick={() => setShowFilters((value) => !value)}
          >
            Filters
            {showFilters ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
          <Button size="xs" onClick={onRun} disabled={loading}>
            {loading ? (
              "Screening…"
            ) : (
              <>
                <RefreshCw className="h-3 w-3" />
                Run
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-border bg-muted-bg/60 px-2 py-0.5 text-[10px] font-medium text-muted"
          >
            {chip}
          </span>
        ))}
      </div>

      {preset?.postFilters && Object.keys(preset.postFilters).length > 0 && (
        <details className="mb-3 rounded-lg border border-border/70 bg-muted-bg/20 px-3 py-2">
          <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-wide text-muted">
            Additional checks (options, IV, fundamentals)
          </summary>
          <ul className="mt-2 space-y-1 text-[10px] leading-relaxed text-muted">
            {Object.entries(preset.postFilters).map(([group, rules]) => (
              <li key={group}>
                <span className="font-medium text-foreground">{group.replaceAll("_", " ")}</span>
                {": "}
                {Object.entries(rules as Record<string, unknown>)
                  .map(([key, value]) => `${key.replaceAll("_", " ")}=${String(value)}`)
                  .join(", ")}
              </li>
            ))}
          </ul>
          {preset.postFilterStatus === "metadata_only" && (
            <p className="mt-2 text-[10px] text-muted">
              Yahoo screener runs first; these checks will refine results once options and
              fundamentals enrichment is wired in.
            </p>
          )}
        </details>
      )}

      {showFilters && (
        <div className="mb-3 space-y-3 rounded-lg border border-border bg-muted-bg/30 p-3">
          <FieldGroup label="Minimum market cap">
            <div className="flex flex-wrap gap-2">
              {MARKET_CAP_PRESETS.map((preset) => (
                <ChoiceChip
                  key={preset.value}
                  label={preset.label}
                  selected={filters.minMarketCap === preset.value}
                  onClick={() =>
                    onFiltersChange({ ...filters, minMarketCap: preset.value })
                  }
                />
              ))}
            </div>
          </FieldGroup>

          <FieldGroup label={`Max P/E (${filters.maxPe?.toFixed(0) ?? "off"})`}>
            <input
              type="range"
              min={10}
              max={80}
              step={5}
              value={filters.maxPe ?? 50}
              onChange={(event) =>
                onFiltersChange({
                  ...filters,
                  maxPe: Number(event.target.value),
                })
              }
              className="w-full"
            />
          </FieldGroup>

          <FieldGroup label="Dividend requirement">
            <div className="flex flex-wrap gap-2">
              <ChoiceChip
                label="Dividend payers"
                selected={filters.requireDividend}
                onClick={() =>
                  onFiltersChange({ ...filters, requireDividend: true })
                }
              />
              <ChoiceChip
                label="Any"
                selected={!filters.requireDividend}
                onClick={() =>
                  onFiltersChange({ ...filters, requireDividend: false })
                }
              />
            </div>
          </FieldGroup>

          {strategy !== "etf-core" && (
            <FieldGroup label="Sectors">
              <div className="flex flex-wrap gap-2">
                {SCREENER_SECTOR_OPTIONS.map((sector) => (
                  <ChoiceChip
                    key={sector}
                    label={sector}
                    selected={filters.sectors?.includes(sector) ?? false}
                    onClick={() => toggleSector(sector)}
                  />
                ))}
              </div>
            </FieldGroup>
          )}
        </div>
      )}

      {stale && !loading && (
        <p className="mb-3 text-xs text-muted">
          Filters changed — run the screen again to refresh results.
        </p>
      )}

      {loading && (
        <p className="text-xs text-muted">Querying Yahoo Finance screener…</p>
      )}

      {error && !loading && (
        <p className="text-xs text-muted">
          Screener is unavailable right now. You can still search and add symbols
          manually.
        </p>
      )}

      {!loading && !error && hasRun && (
        <>
          <div className="mb-3 flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-muted" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search results…"
                className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-xs text-foreground"
              />
            </div>
            <span className="shrink-0 text-[10px] text-muted">
              {visibleQuotes.length} shown
            </span>
          </div>

          {visibleQuotes.length === 0 ? (
            <p className="text-xs text-muted">
              No matches for the current filters. Try loosening market cap, P/E, or
              sector constraints.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-muted-bg/50 text-[10px] uppercase tracking-wide text-muted">
                  <tr>
                    <SortHeader
                      label="Symbol"
                      active={sortKey === "symbol"}
                      asc={sortAsc}
                      onClick={() => toggleSort("symbol")}
                    />
                    {!compact && <th className="px-3 py-2 font-medium">Name</th>}
                    <SortHeader
                      label="Cap"
                      active={sortKey === "marketCap"}
                      asc={sortAsc}
                      onClick={() => toggleSort("marketCap")}
                    />
                    <SortHeader
                      label="P/E"
                      active={sortKey === "peRatio"}
                      asc={sortAsc}
                      onClick={() => toggleSort("peRatio")}
                    />
                    <SortHeader
                      label="Yield"
                      active={sortKey === "dividendYield"}
                      asc={sortAsc}
                      onClick={() => toggleSort("dividendYield")}
                    />
                    <SortHeader
                      label="Price"
                      active={sortKey === "price"}
                      asc={sortAsc}
                      onClick={() => toggleSort("price")}
                    />
                    <th className="px-3 py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {visibleQuotes.map((quote) => {
                    const added = selected.has(quote.symbol.toUpperCase());
                    return (
                      <tr
                        key={quote.symbol}
                        className="border-t border-border/70 hover:bg-muted-bg/20"
                      >
                        <td className="px-3 py-2 font-semibold text-foreground">
                          {quote.symbol}
                        </td>
                        {!compact && (
                          <td className="max-w-[160px] truncate px-3 py-2 text-muted">
                            {quote.companyName ?? "—"}
                          </td>
                        )}
                        <td className="px-3 py-2 text-muted">
                          {formatMarketCap(quote.marketCap)}
                        </td>
                        <td className="px-3 py-2 text-muted">
                          {quote.peRatio != null ? quote.peRatio.toFixed(1) : "—"}
                        </td>
                        <td className="px-3 py-2 text-muted">
                          {formatPercent(quote.dividendYield)}
                        </td>
                        <td className="px-3 py-2 text-muted">
                          {formatPrice(quote.price)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {added ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-muted/40 px-2 py-1 text-[10px] font-medium text-accent-strong">
                              <Check className="h-3 w-3" />
                              Added
                            </span>
                          ) : (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => onAddSymbol(quote.symbol)}
                            >
                              <Plus className="h-3 w-3" />
                              Add
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      {children}
    </div>
  );
}

function ChoiceChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors",
        selected
          ? "border-accent/40 bg-accent-muted/40 text-accent-strong"
          : "border-border text-muted hover:border-accent/20 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function SortHeader({
  label,
  active,
  asc,
  onClick,
}: {
  label: string;
  active: boolean;
  asc: boolean;
  onClick: () => void;
}) {
  return (
    <th className="px-3 py-2 font-medium">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1",
          active ? "text-accent-strong" : "text-muted",
        )}
      >
        {label}
        {active && (asc ? " ↑" : " ↓")}
      </button>
    </th>
  );
}
