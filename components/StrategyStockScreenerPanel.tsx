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
import { Button, compactTextButtonClass } from "@/components/ui/Button";
import {
  ALL_SCREENER_SECTORS,
  PAGE_SIZE_OPTIONS,
  DEFAULT_PAGE_SIZE,
  defaultScreenerFiltersForStrategy,
  expectedRowsForPage,
  filterSummaryChips,
  formatMarketCap,
  formatPercent,
  formatPrice,
  formatSectorLabel,
  isDefaultScreenerFilters,
  MARKET_CAP_PRESETS,
  recommendedSectorsForStrategy,
  screenerTitle,
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
  initialLoading?: boolean;
  isFetching?: boolean;
  error?: string | null;
  stale?: boolean;
  hasRun?: boolean;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onRun: () => void;
  onAddSymbol: (symbol: string) => void;
  selectedSymbols?: string[];
  className?: string;
  compact?: boolean;
};

type QuoteTableRowData =
  | { kind: "quote"; quote: StrategyScreenerQuote }
  | { kind: "spacer" }
  | { kind: "skeleton" };

export function StrategyStockScreenerPanel({
  strategy,
  preset,
  quotes,
  sections = [],
  summary,
  filters,
  onFiltersChange,
  loading = false,
  initialLoading = false,
  isFetching = false,
  error = null,
  stale = false,
  hasRun = false,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  totalPages = 1,
  totalCount = 0,
  onPageChange,
  onPageSizeChange,
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

  const recommendedSectors = useMemo(
    () => new Set(recommendedSectorsForStrategy(strategy)),
    [strategy],
  );
  const chips = filterSummaryChips(filters);
  const filtersAtDefault = isDefaultScreenerFilters(strategy, filters);

  const visibleQuotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return quotes;
    return quotes.filter((quote) => {
      const haystack = `${quote.symbol} ${quote.companyName ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [quotes, search]);

  const showResults = hasRun && !error;
  const tableBusy = isFetching || (loading && hasRun);

  const tableRows = useMemo((): QuoteTableRowData[] => {
    const isLocalSearch = search.trim().length > 0;
    const targetRowCount = isLocalSearch
      ? visibleQuotes.length
      : expectedRowsForPage(page, pageSize, totalCount);

    if (tableBusy && visibleQuotes.length === 0) {
      return Array.from({ length: targetRowCount || pageSize }, () => ({
        kind: "skeleton" as const,
      }));
    }

    const rows: QuoteTableRowData[] = visibleQuotes.map((quote) => ({
      kind: "quote",
      quote,
    }));

    if (!isLocalSearch) {
      while (rows.length < targetRowCount) {
        rows.push({ kind: "spacer" });
      }
      return rows.slice(0, targetRowCount);
    }

    return rows;
  }, [
    visibleQuotes,
    pageSize,
    page,
    totalCount,
    search,
    tableBusy,
  ]);

  function resetFilters() {
    onFiltersChange(defaultScreenerFiltersForStrategy(strategy));
  }

  function selectRecommendedSectors() {
    onFiltersChange({
      ...filters,
      sectors: [...recommendedSectorsForStrategy(strategy)],
    });
  }

  function selectAllSectors() {
    onFiltersChange({
      ...filters,
      sectors: [...ALL_SCREENER_SECTORS],
    });
  }

  function clearSectors() {
    onFiltersChange({
      ...filters,
      sectors: [],
    });
  }

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
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Adjust filters
            </p>
            <button
              type="button"
              onClick={resetFilters}
              disabled={filtersAtDefault}
              className={cn(
                compactTextButtonClass,
                filtersAtDefault && "cursor-not-allowed opacity-50",
              )}
            >
              Reset to defaults
            </button>
          </div>

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
              <AccentRangeInput
                min={10}
                max={80}
                step={5}
                value={filters.maxPe}
                onChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    maxPe: value,
                  })
                }
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

          <FieldGroup
            label="Sectors"
            hint="Recommended sectors are pre-selected. Select any combination, or reset to defaults."
          >
            <div className="flex flex-wrap gap-2">
              <FilterActionChip label="Recommended" onClick={selectRecommendedSectors} />
              <FilterActionChip label="All" onClick={selectAllSectors} />
              <FilterActionChip label="None" onClick={clearSectors} />
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_SCREENER_SECTORS.map((sector) => (
                <ChoiceChip
                  key={sector}
                  label={formatSectorLabel(sector)}
                  selected={filters.sectors?.includes(sector) ?? false}
                  recommended={recommendedSectors.has(sector)}
                  onClick={() => toggleSector(sector)}
                />
              ))}
            </div>
          </FieldGroup>
        </div>
      )}

      {stale && !tableBusy && !error && hasRun && (
        <p className="text-xs text-muted">
          Filters changed — refresh to update.
        </p>
      )}

      {initialLoading && !hasRun && (
        <p className="text-xs text-muted">Loading candidates…</p>
      )}

      {error && !loading && (
        <p className="text-xs text-muted">
          Screener is unavailable right now. You can still search and add symbols
          manually.
        </p>
      )}

      {showResults && (
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

          <div
            className={cn(
              "overflow-x-auto transition-opacity duration-150",
              tableBusy && "pointer-events-none opacity-50",
            )}
          >
            <QuoteTable
              rows={tableRows}
              selected={selected}
              onAddSymbol={onAddSymbol}
              compact={compact}
            />
          </div>

          {visibleQuotes.length === 0 && !tableBusy && (
            <p className="text-xs text-muted">
              No matches on this page. Try different filters or another page.
            </p>
          )}

          {(onPageSizeChange || (totalPages > 1 && onPageChange)) && (
            <Pagination
              page={page}
              pageSize={pageSize}
              totalPages={totalPages}
              totalCount={totalCount}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              disabled={tableBusy}
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
              <QuoteTable
                rows={section.quotes.map((quote) => ({
                  kind: "quote" as const,
                  quote,
                }))}
                selected={selected}
                onAddSymbol={onAddSymbol}
                compact={compact}
              />
              {section.quotes.length === 0 && (
                <p className="text-xs text-muted">No ETF matches right now.</p>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function QuoteTable({
  rows,
  selected,
  onAddSymbol,
  compact,
}: {
  rows: QuoteTableRowData[];
  selected: Set<string>;
  onAddSymbol: (symbol: string) => void;
  compact?: boolean;
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <table className="w-full min-w-[520px] table-fixed text-sm">
      <thead>
        <tr className="border-b border-border/60 text-left text-[10px] font-semibold uppercase tracking-wide text-muted">
          <th className="w-[88px] pb-2 pr-3">Symbol</th>
          {!compact && <th className="pb-2 pr-3">Company</th>}
          <th className="w-[88px] pb-2 pr-3">Market cap</th>
          <th className="w-[64px] pb-2 pr-3">P/E</th>
          <th className="w-[72px] pb-2 pr-3">Yield</th>
          <th className="w-[72px] pb-2 pr-3">Price</th>
          <th className="w-[72px] pb-2 text-right">Action</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <QuoteTableRow
            key={
              row.kind === "quote"
                ? row.quote.symbol
                : `${row.kind}-${index}`
            }
            row={row}
            selected={selected}
            onAddSymbol={onAddSymbol}
            compact={compact}
          />
        ))}
      </tbody>
    </table>
  );
}

function QuoteTableRow({
  row,
  selected,
  onAddSymbol,
  compact,
}: {
  row: QuoteTableRowData;
  selected: Set<string>;
  onAddSymbol: (symbol: string) => void;
  compact?: boolean;
}) {
  if (row.kind === "spacer") {
    return (
      <tr className="h-11 border-b border-border/40" aria-hidden="true">
        <td colSpan={compact ? 6 : 7} className="py-2">
          {"\u00a0"}
        </td>
      </tr>
    );
  }

  if (row.kind === "skeleton") {
    return (
      <tr className="h-11 border-b border-border/40">
        <td colSpan={compact ? 6 : 7} className="py-2">
          <div className="h-4 w-full max-w-md animate-pulse rounded bg-muted-bg/80" />
        </td>
      </tr>
    );
  }

  const quote = row.quote;
  const added = selected.has(quote.symbol.toUpperCase());

  return (
    <tr className="h-11 border-b border-border/40">
      <td className="py-2 pr-3 font-semibold text-foreground">{quote.symbol}</td>
      {!compact && (
        <td className="truncate py-2 pr-3 text-xs text-muted">
          {quote.companyName ?? "—"}
        </td>
      )}
      <td className="py-2 pr-3 text-xs text-muted">
        {formatMarketCap(quote.marketCap)}
      </td>
      <td className="py-2 pr-3 text-xs text-muted">
        {quote.peRatio != null ? quote.peRatio.toFixed(1) : "—"}
      </td>
      <td className="py-2 pr-3 text-xs text-muted">
        {quote.dividendYield != null ? formatPercent(quote.dividendYield) : "—"}
      </td>
      <td className="py-2 pr-3 text-xs text-muted">{formatPrice(quote.price)}</td>
      <td className="py-2 text-right">
        {added ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent-strong">
            <Check className="h-3.5 w-3.5" />
            Added
          </span>
        ) : (
          <Button
            size="xs"
            variant="outline"
            className="ml-auto"
            onClick={() => onAddSymbol(quote.symbol)}
          >
            <Plus className="h-3 w-3" />
            Add
          </Button>
        )}
      </td>
    </tr>
  );
}

function Pagination({
  page,
  pageSize,
  totalPages,
  totalCount,
  onPageChange,
  onPageSizeChange,
  disabled,
}: {
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  disabled?: boolean;
}) {
  const pages = useMemo(() => {
    if (totalPages <= 1) return [1];
    const windowSize = 5;
    let start = Math.max(1, page - Math.floor(windowSize / 2));
    const end = Math.min(totalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [page, totalPages]);

  return (
    <div className="flex flex-col gap-3 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted">Rows</span>
            <div className="flex items-center gap-1">
              {PAGE_SIZE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={disabled}
                  onClick={() => onPageSizeChange(option)}
                  className={cn(
                    "min-w-7 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                    option === pageSize
                      ? "bg-accent-muted/50 text-accent-strong"
                      : "text-muted hover:bg-muted-bg/60 hover:text-foreground",
                    disabled && "cursor-not-allowed opacity-60",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}
        <p className="text-[11px] text-muted">
          Page {page} of {totalPages}
          {totalCount > 0 ? ` · ${totalCount.toLocaleString()} matches` : ""}
        </p>
      </div>
      {totalPages > 1 && onPageChange && (
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
                disabled && "cursor-not-allowed opacity-60",
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
      )}
    </div>
  );
}

function AccentRangeInput({
  min,
  max,
  step,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const fillPercent = ((value - min) / (max - min)) * 100;

  return (
    <div className="relative w-full min-w-0 py-1">
      <div className="range-accent-track" aria-hidden="true" />
      <div
        className="range-accent-fill"
        style={{ width: `${fillPercent}%` }}
        aria-hidden="true"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="range-accent relative z-10"
      />
    </div>
  );
}

function FieldGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
          {label}
        </p>
        {hint && <p className="mt-0.5 text-[10px] leading-relaxed text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function FilterActionChip({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-dashed border-border/80 px-2.5 py-1 text-[10px] font-medium text-muted transition-colors hover:border-accent/30 hover:text-foreground"
    >
      {label}
    </button>
  );
}

function ChoiceChip({
  label,
  selected,
  recommended = false,
  onClick,
}: {
  label: string;
  selected: boolean;
  recommended?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={recommended ? "Recommended for this strategy" : undefined}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors",
        selected
          ? "border-accent/40 bg-accent-muted/40 text-accent-strong"
          : recommended
            ? "border-accent/20 bg-accent-muted/10 text-foreground hover:border-accent/30"
            : "border-border/80 text-muted hover:border-accent/20 hover:text-foreground",
      )}
    >
      {label}
      {recommended && !selected && (
        <span className="ml-1 text-[9px] text-muted">· rec</span>
      )}
    </button>
  );
}
