"use client";

import { useRouter, usePathname } from "next/navigation";

export type MainView = "portfolio" | "symbol";

interface NavListProps {
  loading: boolean;
  symbols: string[];
  selectedSymbol: string | null; // can keep for now if used elsewhere
  setSelectedSymbol: (s: string | null) => void;
  selectedView: MainView;
  setSelectedView: (v: MainView) => void;
  containerClassName?: string;
  portfolioButtonClassName?: string;
  symbolButtonClassName?: string;
}

export function NavList({
  loading,
  symbols,
  selectedSymbol,
  setSelectedSymbol,
  selectedView,
  setSelectedView,
  containerClassName = "",
  portfolioButtonClassName = "",
  symbolButtonClassName = "",
}: NavListProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isPortfolio = pathname === "/portfolio";
  const activeSymbol = pathname.startsWith("/positions/")
    ? pathname.split("/").at(-1)
    : null;

  return (
    <div
      className={[
        "flex h-full flex-col rounded-2xl bg-secondary/60 py-3",
        containerClassName,
      ].join(" ")}
    >
      <button
        type="button"
        disabled={loading}
        onClick={() => {
          setSelectedView("portfolio");
          setSelectedSymbol(null);
          router.push("/portfolio");
        }}
        className={[
          "group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium transition-all",
          isPortfolio
            ? "bg-neutral-800 text-neutral-50 shadow-inner"
            : "text-neutral-300 hover:bg-neutral-800/60",
          portfolioButtonClassName,
        ].join(" ")}
      >
        <span
          className={[
            "flex h-6 w-6 items-center justify-center rounded-lg border text-[11px] font-semibold",
            isPortfolio
              ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-300"
              : "border-neutral-700 bg-neutral-900/60 text-neutral-300",
          ].join(" ")}
        >
          P
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span>My portfolio</span>
          <span className="truncate text-[10px] text-neutral-500">
            Overview
          </span>
        </div>
        {isPortfolio && (
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        )}
      </button>

      <div className="my-3 h-px bg-neutral-800/80" />

      <div className="mb-1 flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
          Positions
        </span>
        {symbols.length > 0 && (
          <span className="rounded-full bg-neutral-900/70 px-2 py-px text-[10px] text-neutral-400">
            {symbols.length}
          </span>
        )}
      </div>

      {loading && (
        <div className="px-2 py-2 text-[11px] text-neutral-500">
          Loading symbols…
        </div>
      )}

      {!loading && symbols.length === 0 && (
        <div className="px-2 py-2 text-[11px] text-neutral-500">
          No symbols yet. Connect Schwab to load holdings.
        </div>
      )}

      <div className="mt-1 space-y-1 overflow-y-auto pr-1">
        {symbols.map((sym) => {
          const isActive = activeSymbol === sym;

          return (
            <button
              key={sym}
              type="button"
              disabled={loading}
              onClick={() => {
                setSelectedView("symbol");
                setSelectedSymbol(sym);
                router.push(`/portfolio/positions/${sym}`);
              }}
              className={[
                "group flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition-all",
                isActive
                  ? "bg-neutral-800 text-neutral-50 shadow-inner"
                  : "text-neutral-300 hover:bg-neutral-800/60",
                symbolButtonClassName,
              ].join(" ")}
            >
              <span className="flex items-center gap-2">
                <span className="text-xs font-mono">{sym}</span>
              </span>

              {isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
