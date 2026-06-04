// app/AppProviders.tsx
"use client";

import { Suspense } from "react";
import { SessionProvider } from "next-auth/react";
import { PostHogInit } from "@/components/PostHogInit";
import { PostHogPageView } from "@/components/PostHogPageView";
import { ProductAnalytics } from "@/components/ProductAnalytics";
import { QueryProvider } from "./QueryProvider";
import { PositionsProvider } from "./Providers";
import { ToastProvider } from "./contexts/ToastContext";
import { StrategyProvider } from "./contexts/StrategyContext";
import { WatchlistProvider } from "./contexts/WatchlistContext";
import { WatchlistSaveSymbolDialog } from "@/components/watchlist/WatchlistSaveSymbolDialog";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PostHogInit />
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <ProductAnalytics />
      <ToastProvider>
        <QueryProvider>
          <WatchlistProvider>
            <PositionsProvider>
              <StrategyProvider>
                {children}
                <WatchlistSaveSymbolDialog />
              </StrategyProvider>
            </PositionsProvider>
          </WatchlistProvider>
        </QueryProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
