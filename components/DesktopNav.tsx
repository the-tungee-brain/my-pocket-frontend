"use client";

import React from "react";
import { NavList, MainView } from "@/components/NavList";

interface DesktopNavProps {
  loading: boolean;
  symbols: string[];
  selectedSymbol: string | null;
  setSelectedSymbol: React.Dispatch<React.SetStateAction<string | null>>;
  selectedView: MainView;
  setSelectedView: React.Dispatch<React.SetStateAction<MainView>>;
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
    <aside className="sticky top-0 hidden h-screen w-48 border-r border-border bg-secondary p-3 text-sm text-foreground md:flex md:flex-col">
      <NavList
        loading={loading}
        symbols={symbols}
        selectedSymbol={selectedSymbol}
        setSelectedSymbol={setSelectedSymbol}
        selectedView={selectedView}
        setSelectedView={setSelectedView}
        containerClassName="flex-1 flex flex-col gap-2 overflow-y-auto"
        portfolioButtonClassName="w-full rounded-md px-2 py-2 text-left text-sm font-medium transition-colors"
        symbolButtonClassName="w-full rounded-md px-2 py-2 text-left text-sm transition-colors"
      />
    </aside>
  );
}
