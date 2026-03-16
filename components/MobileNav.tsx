"use client";

import { Dispatch, SetStateAction } from "react";

interface MobileNavProps {
  mobileNavOpen: boolean;
  setMobileNavOpen: Dispatch<SetStateAction<boolean>>;
  loading: boolean;
  symbols: string[];
  selectedSymbol: string | null;
  setSelectedSymbol: Dispatch<SetStateAction<string | null>>;
}

export function MobileNav({
  mobileNavOpen,
  setMobileNavOpen,
  loading,
  symbols,
  selectedSymbol,
  setSelectedSymbol,
}: MobileNavProps) {
  if (!mobileNavOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex md:hidden">
      <div
        className="fixed inset-0 bg-black/40"
        onClick={() => setMobileNavOpen(false)}
      />
      <aside className="relative z-50 flex h-full w-64 flex-col border-r border-border bg-secondary">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-xs uppercase tracking-wide text-neutral-400">
            Holdings
          </span>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="text-xs text-neutral-400 hover:text-neutral-200"
          >
            Close
          </button>
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
                onClick={() => {
                  setSelectedSymbol(sym);
                  setMobileNavOpen(false);
                }}
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
    </div>
  );
}
