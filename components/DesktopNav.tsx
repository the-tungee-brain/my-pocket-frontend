"use client";

import { NavList, MainView } from "@/components/NavList";
import { TomcrestLogo } from "@/components/brand/TomcrestLogo";

import type { SymbolAlertSummary } from "@/lib/intelligence";

interface DesktopNavProps {
  loading: boolean;
  symbols: string[];
  selectedSymbol: string | null;
  setSelectedSymbol: (s: string | null) => void;
  selectedView: MainView;
  setSelectedView: (v: MainView) => void;
  symbolAlertMap?: Record<string, SymbolAlertSummary>;
}

export function DesktopNav({
  loading,
  symbols,
  selectedSymbol,
  setSelectedSymbol,
  selectedView,
  setSelectedView,
  symbolAlertMap,
}: DesktopNavProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-border bg-secondary p-3 text-sm text-foreground md:flex">
      <div className="mb-3 rounded-xl border border-border bg-background/60 px-3 py-3">
        <TomcrestLogo size="md" showSubtitle />
      </div>

      <NavList
        loading={loading}
        symbols={symbols}
        selectedSymbol={selectedSymbol}
        setSelectedSymbol={setSelectedSymbol}
        selectedView={selectedView}
        setSelectedView={setSelectedView}
        symbolAlertMap={symbolAlertMap}
        containerClassName="flex-1 flex flex-col gap-2 overflow-y-auto px-1 scrollbar-dark"
        portfolioButtonClassName="w-full rounded-md px-2 py-2 text-left text-sm font-medium transition-colors"
      />
    </aside>
  );
}
