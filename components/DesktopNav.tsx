"use client";

import { TomcrestLogo } from "@/components/brand/TomcrestLogo";
import { type MainView, NavList } from "@/components/NavList";

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
        "sticky top-0 hidden h-screen w-64 flex-col border-r px-3 py-4 text-sm text-foreground md:flex",
        appSidebarClass,
      )}
    >
      <div className="mb-5 px-2">
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
        containerClassName="flex-1 flex flex-col gap-1 overflow-y-auto scrollbar-dark"
        portfolioButtonClassName="w-full px-2 py-2 text-left text-sm font-medium transition-colors"
      />
    </aside>
  );
}
