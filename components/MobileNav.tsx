"use client";

import { Dispatch, SetStateAction } from "react";
import { NavList, MainView } from "@/components/NavList";

interface MobileNavProps {
  mobileNavOpen: boolean;
  setMobileNavOpen: Dispatch<SetStateAction<boolean>>;
  loading: boolean;
  symbols: string[];
  selectedSymbol: string | null;
  setSelectedSymbol: (s: string | null) => void;
  selectedView: MainView;
  setSelectedView: (v: MainView) => void;
}

export function MobileNav({
  mobileNavOpen,
  setMobileNavOpen,
  loading,
  symbols,
  selectedSymbol,
  setSelectedSymbol,
  selectedView,
  setSelectedView,
}: MobileNavProps) {
  if (!mobileNavOpen) return null;

  const handleSetView = (v: MainView) => {
    setSelectedView(v);
    setMobileNavOpen(false);
  };

  const handleSetSymbol = (s: string | null) => {
    setSelectedSymbol(s);
    setSelectedView("symbol");
    setMobileNavOpen(false);
  };

  return (
    <div className="fixed inset-0 z-40 flex md:hidden">
      <div
        className="fixed inset-0 bg-black/40"
        onClick={() => setMobileNavOpen(false)}
      />
      <aside className="relative z-50 flex h-full w-64 flex-col border-r border-border bg-secondary">
        <div className="flex items-center justify-between px-4 py-3">
          <div />
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="text-xs text-neutral-400 hover:text-neutral-200"
          >
            Close
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-3">
          <NavList
            loading={loading}
            symbols={symbols}
            selectedSymbol={selectedSymbol}
            setSelectedSymbol={handleSetSymbol}
            selectedView={selectedView}
            setSelectedView={handleSetView}
            containerClassName="flex flex-col gap-2"
            portfolioButtonClassName="w-full rounded-md px-2 py-2 text-left text-sm font-medium transition-colors"
            symbolButtonClassName="w-full rounded-md px-2 py-2 text-left text-sm transition-colors"
          />
        </nav>
      </aside>
    </div>
  );
}
