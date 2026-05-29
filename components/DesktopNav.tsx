"use client";

import { NavList, MainView } from "@/components/NavList";
import { TomcrestLogo } from "@/components/brand/TomcrestLogo";

import { appSidebarClass } from "@/lib/appUi";
import type { SymbolAlertSummary } from "@/lib/intelligence";
import { cn } from "@/lib/utils";

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
    <aside
      className={cn(
        "sticky top-0 hidden h-screen w-64 flex-col border-r p-3 font-mono text-sm text-foreground md:flex",
        appSidebarClass,
      )}
    >
      <div className="app-panel mb-3 px-3 py-3">
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
