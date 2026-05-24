"use client";

import { Wallet } from "lucide-react";
import { NavList, MainView } from "@/components/NavList";

interface DesktopNavProps {
  loading: boolean;
  symbols: string[];
  selectedSymbol: string | null;
  setSelectedSymbol: (s: string | null) => void;
  selectedView: MainView;
  setSelectedView: (v: MainView) => void;
}

export function DesktopNav({
  loading,
  symbols,
  selectedSymbol,
  setSelectedSymbol,
  selectedView,
  setSelectedView,
}: DesktopNavProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-border bg-secondary p-3 text-sm text-foreground md:flex">
      <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-border bg-background/60 px-3 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
          <Wallet className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold tracking-tight">
            PowerPocket
          </div>
          <div className="truncate text-[11px] text-muted">
            Portfolio workspace
          </div>
        </div>
      </div>

      <NavList
        loading={loading}
        symbols={symbols}
        selectedSymbol={selectedSymbol}
        setSelectedSymbol={setSelectedSymbol}
        selectedView={selectedView}
        setSelectedView={setSelectedView}
        containerClassName="flex-1 flex flex-col gap-2 overflow-y-auto scrollbar-dark"
        portfolioButtonClassName="w-full rounded-md px-2 py-2 text-left text-sm font-medium transition-colors"
        symbolButtonClassName="w-full rounded-md px-2 py-2 text-left text-sm transition-colors"
      />
    </aside>
  );
}
