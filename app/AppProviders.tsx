// app/AppProviders.tsx
"use client";

import { Suspense } from "react";
import { SessionProvider } from "next-auth/react";
import { PostHogPageView } from "@/components/PostHogPageView";
import { ProductAnalytics } from "@/components/ProductAnalytics";
import { PositionsProvider } from "./Providers";
import { ToastProvider } from "./contexts/ToastContext";
import { StrategyProvider } from "./contexts/StrategyContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <ProductAnalytics />
      <ToastProvider>
        <PositionsProvider>
          <StrategyProvider>{children}</StrategyProvider>
        </PositionsProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
