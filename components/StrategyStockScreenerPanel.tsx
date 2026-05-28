"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import type {
  InvestmentStrategy,
  ScreenerResultSection,
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
  screenerTitle,
  sectorsForStrategy,
} from "@/lib/strategyScreener";
import { cn } from "@/lib/utils";

type Props = {
  strategy: InvestmentStrategy;
  preset?: {
    label: string;
    description: string;
  } | null;
  quotes: StrategyScreenerQuote[];
  sections?: ScreenerResultSection[];
  summary?: string | null;
  filters: StrategyScreenerFilters;
  onFiltersChange: (filters: StrategyScreenerFilters) => void;
  loading?: boolean;
  error?: string | null;
  stale?: boolean;
  hasRun?: boolean;
  page?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
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
  sections = [],
  summary,
  filters,
  onFiltersChange,
  loading = false,
  error = null,
  stale = false,
  hasRun = false,
  page = 1,
  totalPages = 1,
  totalCount = 0,
  onPageChange,
  onRun,
  onAddSymbol,
  selectedSymbols = [],
  className,
  compact = false,
}: Props) {
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");

  const selected = useMemo(
    () => new Set(selectedSymbols.map((symbol) => symbol.toUpperCase())),
    [selectedSymbols],
  );

  const sectorOptions = sectorsForStrategy(strategy);
  const chips = filterSummaryChips(filters);

  const visibleQuotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return quotes;
    return quotes.filter((quote) => {
      const haystack = `${quote.symbol} ${quote.companyName ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [quotes, search]);

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

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-foreground">
            {preset?.label ?? screenerTitle(strategy)}
          </h4>
          {!compact && (
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {summary ??
                preset?.description ??
                "Browse strategy-filtered ideas and add symbols you want to own."}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {strategy !== "etf-core" && (
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
          )}
          <Button size="xs" variant="outline" onClick={onRun} disabled={loading}>
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-muted-bg/80 px-2.5 py-0.5 text-[10px] font-medium text-muted"
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      {showFilters && strategy !== "etf-core" && (
        <div className="space-y-3 rounded-lg bg-muted-bg/25 p-3">
          <FieldGroup label="Minimum market cap">
            <div className="flex flex-wrap gap-2">
              {MARKET_CAP_PRESETS.map((presetOption) => (
                <ChoiceChip
                  key={presetOption.value}
                  label={presetOption.label}
                  selected={filters.minMarketCap === presetOption.value}
                  onClick={() =>
                    onFiltersChange({ ...filters, minMarketCap: presetOption.value })
                  }
                />
              ))}
            </div>
          </FieldGroup>

          {filters.maxPe != null && (
            <FieldGroup label={`Max P/E (${filters.maxPe.toFixed(0)})`}>
              <input
                type="range"
                min={10}
                max={80}
                step={5}
                value={filters.maxPe}
                onChange={(event) =>
                  onFiltersChange({
                    ...filters,
                    maxPe: Number(event.target.value),
                  })
                }
                className="w-full"
              />
            </FieldGroup>
          )}

          {(strategy === "dividend" || filters.requireDividend) && (
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
          )}

          <FieldGroup label="Sectors">
            <div className="flex flex-wrap gap-2">
              {sectorOptions.map((sector) => (
                <ChoiceChip
                  key={sector}
                  label={sector}
                  selected={filters.sectors?.includes(sector) ?? false}
                  onClick={() => toggleSector(sector)}
                />
              ))}
            </div>
          </FieldGroup>
        </div>
      )}

      {(loading || stale) && !error && hasRun && (
        <p className="text-xs text-muted">Updating results…</p>
      )}

      {loading && !hasRun && (
        <p className="text-xs text-muted">Loading candidates…</p>
      )}

      {error && !loading && (
        <p className="text-xs text-muted">
          Screener is unavailable right now. You can still search and add symbols
          manually.
        </p>
      )}

      {!loading && !error && hasRun && (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search this page…"
              className="w-full rounded-lg border border-border/80 bg-background py-2 pl-9 pr-3 text-xs text-foreground"
            />
          </div>

          <QuoteList
            quotes={visibleQuotes}
            selected={selected}
            onAddSymbol={onAddSymbol}
            compact={compact}
            emptyMessage="No matches on this page. Try different filters or another page."
          />

          {totalPages > 1 && onPageChange && (
            <Pagination
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              onPageChange={onPageChange}
              disabled={loading}
            />
          )}

          {sections.map((section) => (
            <div key={section.preset.id} className="space-y-2 pt-2">
              <div>
                <h5 className="text-xs font-semibold text-foreground">
                  {section.preset.label}
                </h5>
                <p className="text-[11px] text-muted">{section.preset.description}</p>
              </div>
              <QuoteList
                quotes={section.quotes}
                selected={selected}
                onAddSymbol={onAddSymbol}
                compact={compact}
                emptyMessage="No ETF matches right now."
              />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function QuoteList({
  quotes,
  selected,
  onAddSymbol,
  compact,
  emptyMessage,
}: {
  quotes: StrategyScreenerQuote[];
  selected: Set<string>;
  onAddSymbol: (symbol: string) => void;
  compact?: boolean;
  emptyMessage: string;
}) {
  if (quotes.length === 0) {
    return <p className="text-xs text-muted">{emptyMessage}</p>;
  }

  return (
    <ul className="divide-y divide-border/60">
      {quotes.map((quote) => {
        const added = selected.has(quote.symbol.toUpperCase());
        return (
          <li
            key={quote.symbol}
            className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-sm font-semibold text-foreground">
                  {quote.symbol}
                </span>
                {!compact && quote.companyName && (
                  <span className="truncate text-xs text-muted">
                    {quote.companyName}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-muted">
                {[
                  formatMarketCap(quote.marketCap),
                  quote.peRatio != null ? `P/E ${quote.peRatio.toFixed(1)}` : null,
                  quote.dividendYield != null
                    ? `Yield ${formatPercent(quote.dividendYield)}`
                    : null,
                  formatPrice(quote.price),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            {added ? (
              <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-accent-strong">
                <Check className="h-3.5 w-3.5" />
                Added
              </span>
            ) : (
              <Button
                size="xs"
                variant="outline"
                className="shrink-0"
                onClick={() => onAddSymbol(quote.symbol)}
              >
                <Plus className="h-3 w-3" />
                Add
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Pagination({
  page,
  totalPages,
  totalCount,
  onPageChange,
  disabled,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  const pages = useMemo(() => {
    const windowSize = 5;
    let start = Math.max(1, page - Math.floor(windowSize / 2));
    const end = Math.min(totalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [page, totalPages]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
      <p className="text-[11px] text-muted">
        Page {page} of {totalPages}
        {totalCount > 0 ? ` · ${totalCount.toLocaleString()} matches` : ""}
      </p>
      <div className="flex items-center gap-1">
        <Button
          size="xs"
          variant="outline"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
        {pages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            disabled={disabled}
            onClick={() => onPageChange(pageNumber)}
            className={cn(
              "min-w-7 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
              pageNumber === page
                ? "bg-accent-muted/50 text-accent-strong"
                : "text-muted hover:bg-muted-bg/60 hover:text-foreground",
            )}
          >
            {pageNumber}
          </button>
        ))}
        <Button
          size="xs"
          variant="outline"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
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
          : "border-border/80 text-muted hover:border-accent/20 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
