"use client";

import { ReactNode } from "react";
import { SchwabConnectCard } from "@/components/SchwabConnectCard";
import { DesktopNav } from "@/components/DesktopNav";
import { MobileNav } from "@/components/MobileNav";
import {
  AccountPositionList,
  Position,
  PositionMap,
} from "@/components/AccountPositionList";
import { Insights } from "@/components/Insights";
import { PortfolioOverview } from "@/components/PortfolioOverview";

type MainView = "portfolio" | "symbol";

interface PositionsLayoutProps {
  loading: boolean;
  error: string | null;
  positionMap: PositionMap;
  symbols: string[];
  selectedSymbol: string | null;
  setSelectedSymbol: React.Dispatch<React.SetStateAction<string | null>>;
  selectedView: MainView;
  setSelectedView: React.Dispatch<React.SetStateAction<MainView>>;
  positionsForSelectedSymbol: Position[] | null;
  allPositions: Position[];
  accessToken: string;
  mobileNavOpen: boolean;
  setMobileNavOpen: React.Dispatch<React.SetStateAction<boolean>>;
  topChildren?: ReactNode;
  bottomChildren?: ReactNode;
}

export function PositionsLayout({
  loading,
  error,
  positionMap,
  symbols,
  selectedSymbol,
  setSelectedSymbol,
  selectedView,
  setSelectedView,
  positionsForSelectedSymbol,
  allPositions,
  accessToken,
  mobileNavOpen,
  setMobileNavOpen,
  topChildren,
  bottomChildren,
}: PositionsLayoutProps) {
  const hasNoPositions =
    !loading &&
    Object.values(positionMap).every((arr) => (arr ?? []).length === 0);

  return (
    <main className="flex min-h-screen text-neutral-50">
      <DesktopNav
        loading={loading}
        symbols={symbols}
        selectedSymbol={selectedSymbol}
        setSelectedSymbol={setSelectedSymbol}
        selectedView={selectedView}
        setSelectedView={setSelectedView}
      />

      <MobileNav
        mobileNavOpen={mobileNavOpen}
        setMobileNavOpen={setMobileNavOpen}
        loading={loading}
        symbols={symbols}
        selectedSymbol={selectedSymbol}
        setSelectedSymbol={setSelectedSymbol}
        selectedView={selectedView}
        setSelectedView={setSelectedView}
      />

      <section className="flex min-h-screen flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border bg-secondary px-4 py-3 md:hidden space-x-4">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="rounded-md border border-border px-2 py-1 text-xs"
          >
            Menu
          </button>
          <SchwabConnectCard />
        </div>

        <div className="hidden border-b border-border bg-secondary px-4 py-3 md:block">
          <SchwabConnectCard />
        </div>

        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4">
            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

            {hasNoPositions && !loading && !error && (
              <p className="text-sm text-neutral-400">
                No positions found yet. Once Schwab is connected and you have
                holdings, they'll appear here.
              </p>
            )}

            {!hasNoPositions && (
              <>
                {selectedView === "portfolio" ? (
                  <>
                    <PortfolioOverview />

                    <Insights
                      symbol={null}
                      positions={allPositions}
                      accessToken={accessToken}
                      thinkingMessage="Analyzing this portfolio"
                    />

                    {topChildren}
                  </>
                ) : (
                  <>
                    <AccountPositionList
                      positionsForSelectedSymbol={positionsForSelectedSymbol}
                      selectedSymbol={selectedSymbol}
                    />

                    <Insights
                      symbol={selectedSymbol}
                      positions={positionsForSelectedSymbol}
                      accessToken={accessToken}
                      thinkingMessage={`Analyzing your ${selectedSymbol} positions`}
                    />

                    {topChildren}
                  </>
                )}
              </>
            )}
          </div>

          {bottomChildren}
        </div>
      </section>
    </main>
  );
}
