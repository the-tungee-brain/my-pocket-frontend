"use client";

export type MainView = "portfolio" | "symbol";

interface NavListProps {
  loading: boolean;
  symbols: string[];
  selectedSymbol: string | null;
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
  return (
    <div className={containerClassName}>
      <button
        type="button"
        disabled={loading}
        onClick={() => setSelectedView("portfolio")}
        className={[
          portfolioButtonClassName,
          selectedView === "portfolio"
            ? "bg-neutral-800 text-neutral-50"
            : "text-neutral-300 hover:bg-neutral-800/50",
        ].join(" ")}
      >
        My portfolio
      </button>

      <div className="my-1 h-px bg-neutral-800" />

      {symbols.length > 0 && (
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Positions
        </div>
      )}

      {loading && (
        <div className="px-2 py-1 text-xs text-neutral-500">
          Loading symbols…
        </div>
      )}

      {!loading && symbols.length === 0 && (
        <div className="px-2 py-1 text-xs text-neutral-500">
          No symbols yet.
        </div>
      )}

      <div className="space-y-1">
        {symbols.map((sym) => {
          const isActive = selectedView === "symbol" && selectedSymbol === sym;

          return (
            <button
              key={sym}
              type="button"
              disabled={loading}
              onClick={() => {
                setSelectedSymbol(sym);
                setSelectedView("symbol");
              }}
              className={[
                symbolButtonClassName,
                isActive
                  ? "bg-neutral-800 text-neutral-50"
                  : "text-neutral-300 hover:bg-neutral-800/50",
              ].join(" ")}
            >
              {sym}
            </button>
          );
        })}
      </div>
    </div>
  );
}
