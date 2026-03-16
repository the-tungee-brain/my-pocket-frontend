"use client";

import { Dispatch, SetStateAction } from "react";

interface DesktopNavProps {
  loading: boolean;
  symbols: string[];
  selectedSymbol: string | null;
  setSelectedSymbol: Dispatch<SetStateAction<string | null>>;
}

export function DesktopNav({
  loading,
  symbols,
  selectedSymbol,
  setSelectedSymbol,
}: DesktopNavProps) {
  return (
    <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-56 md:flex-col border-r border-border bg-secondary">
      <div className="px-4 py-3 text-xs uppercase tracking-wide text-neutral-400">
        Holdings
      </div>
      <nav className="flex-1 overflow-y-auto">
        {loading && (
          <div className="px-4 py-2 text-xs text-neutral-500">
            Loading symbols…
          </div>
        )}
        {!loading && symbols.length === 0 && (
          <div className="px-4 py-2 text-xs text-neutral-500">
            No symbols yet.
          </div>
        )}
        {symbols.map((sym) => {
          const isActive = sym === selectedSymbol;
          return (
            <button
              key={sym}
              type="button"
              onClick={() => setSelectedSymbol(sym)}
              className={[
                "w-full px-4 py-2 text-left text-sm transition-colors",
                "hover:bg-neutral-800",
                isActive ? "bg-neutral-800 text-white" : "text-neutral-300",
              ].join(" ")}
            >
              {sym}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
