"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Command, Search, X } from "lucide-react";
import { useSymbolSearch } from "@/app/hooks/useSymbolSearch";
import { useResearchSearchShortcut } from "@/app/hooks/useResearchSearchShortcut";
import { rememberAssetType } from "@/lib/researchAssetType";
import { symbolHubPath } from "@/lib/symbolRoutes";
import type { TickerSymbolItem } from "@/app/hooks/useSymbolSearch";
import { cn } from "@/lib/utils";

type HeaderSymbolSearchProps = {
  accessToken: string | null | undefined;
  className?: string;
};

export function HeaderSymbolSearch({
  accessToken,
  className,
}: HeaderSymbolSearchProps) {
  const router = useRouter();
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const { results, isLoading, error } = useSymbolSearch(query, {
    accessToken: accessToken ?? undefined,
    limit: 8,
  });

  const trimmed = query.trim();
  const hasResults = !isLoading && !error && results.length > 0;
  const showPanel = open && !!trimmed;
  const showClear = query.length > 0;

  useResearchSearchShortcut({
    onFocus: () => {
      inputRef.current?.focus();
      setOpen(true);
    },
  });

  useEffect(() => {
    setActiveIndex(-1);
  }, [query, results]);

  useEffect(() => {
    if (!showPanel) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [showPanel]);

  const navigateToSymbol = useCallback(
    (item: TickerSymbolItem | { symbol: string }) => {
      const upper = item.symbol.toUpperCase();
      if ("assetType" in item && item.assetType) {
        rememberAssetType(upper, item.assetType);
      }
      setQuery("");
      setOpen(false);
      setActiveIndex(-1);
      router.push(symbolHubPath(upper, "overview"));
    },
    [router],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (event.key === "Enter" && trimmed) {
      event.preventDefault();
      if (hasResults) {
        navigateToSymbol(results[activeIndex >= 0 ? activeIndex : 0]);
      } else {
        navigateToSymbol({ symbol: trimmed });
      }
      return;
    }

    if (!hasResults) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) =>
        index < results.length - 1 ? index + 1 : 0,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        index > 0 ? index - 1 : results.length - 1,
      );
    }
  };

  return (
    <div ref={rootRef} className={cn("relative min-w-0", className)}>
      <label htmlFor={`${listboxId}-input`} className="sr-only">
        Search ticker symbol
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-muted">
          <Search className="h-4 w-4" aria-hidden />
        </span>
        <input
          ref={inputRef}
          id={`${listboxId}-input`}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search ticker…"
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={showPanel ? listboxId : undefined}
          aria-autocomplete="list"
          className={cn(
            "h-9 w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-sm text-foreground placeholder:text-muted focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30",
            "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
            showClear && "pr-9",
            "md:pr-8",
            showClear && "md:pr-14",
          )}
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {showClear ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setOpen(false);
                setActiveIndex(-1);
                inputRef.current?.focus();
              }}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted transition hover:bg-muted-bg hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ) : null}
          <kbd className="pointer-events-none hidden h-5 min-w-5 shrink-0 items-center justify-center gap-0.5 rounded border border-border bg-muted-bg px-1 font-mono text-[10px] font-medium leading-none text-muted md:flex">
            <Command className="size-2.5 shrink-0" strokeWidth={2} aria-hidden="true" />
            <span className="inline-flex h-2.5 items-center leading-none">K</span>
          </kbd>
        </div>
      </div>

      {showPanel && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-background py-1 text-sm shadow-lg scrollbar-dark"
        >
          {isLoading && (
            <p className="px-3 py-2 text-xs text-muted">Searching…</p>
          )}

          {error && !isLoading && (
            <p className="px-3 py-2 text-xs text-muted">
              Search unavailable. Press Enter for {trimmed.toUpperCase()}.
            </p>
          )}

          {!isLoading && !error && results.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted">
              No matches. Press Enter to open {trimmed.toUpperCase()}.
            </p>
          )}

          {hasResults &&
            results.map((item, index) => (
              <button
                key={item.symbol}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => navigateToSymbol(item)}
                className={cn(
                  "block w-full px-3 py-2 text-left transition hover:bg-muted-bg",
                  index === activeIndex && "bg-muted-bg",
                )}
              >
                <span className="font-mono font-semibold text-foreground">
                  {item.symbol}
                </span>
                {item.title ? (
                  <span className="mt-0.5 block truncate text-xs text-muted">
                    {item.title}
                  </span>
                ) : null}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
