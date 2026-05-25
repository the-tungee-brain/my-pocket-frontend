"use client";

import type { KeyboardEvent } from "react";
import { Search, SearchX } from "lucide-react";
import { useSymbolSearch } from "@/app/hooks/useSymbolSearch";
import { cn } from "@/lib/utils";

type Props = {
  accessToken: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (symbol: string) => void;
  placeholder?: string;
  limit?: number;
  className?: string;
};

export function SymbolSearchField({
  accessToken,
  value,
  onChange,
  onSelect,
  placeholder = "Search symbol or company, e.g. AAPL",
  limit = 8,
  className,
}: Props) {
  const { results, isLoading, error, refetch } = useSymbolSearch(value, {
    accessToken,
    limit,
  });

  const trimmed = value.trim();
  const showPanel = !!trimmed;
  const hasResults = !isLoading && !error && results.length > 0;
  const showEmptyState =
    !isLoading && !error && results.length === 0 && trimmed.length > 0;

  const handleSelect = (symbol: string) => {
    onSelect(symbol.toUpperCase());
    onChange("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || !trimmed) return;
    event.preventDefault();
    handleSelect(trimmed);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
          <Search className="h-4 w-4" aria-hidden />
        </span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground"
        />
      </div>

      {showPanel && (
        <div className="overflow-hidden rounded-lg border border-border bg-background text-sm shadow-sm">
          {isLoading && (
            <p className="px-3 py-2 text-xs text-muted">Searching symbols…</p>
          )}

          {error && !isLoading && (
            <div className="space-y-2 px-3 py-2">
              <p className="text-xs text-muted">
                Could not search symbols. You can still press Enter to add{" "}
                {trimmed.toUpperCase()}.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="text-xs font-medium text-accent-strong hover:underline"
              >
                Retry search
              </button>
            </div>
          )}

          {showEmptyState && (
            <div className="flex items-start gap-2 px-3 py-2 text-xs text-muted">
              <SearchX className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <p>
                No matches for {trimmed.toUpperCase()}. Press Enter to add it
                anyway.
              </p>
            </div>
          )}

          {hasResults && (
            <div>
              {results.map((item) => (
                <button
                  key={item.symbol}
                  type="button"
                  onClick={() => handleSelect(item.symbol)}
                  className="block w-full px-3 py-2 text-left text-sm transition hover:bg-muted-bg"
                >
                  <span className="font-mono font-semibold text-foreground">
                    {item.symbol}
                  </span>
                  {item.name && (
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {item.name}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
