// app/AppProviders.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { PositionsProvider } from "./Providers";
import { TabProvider } from "./contexts/TabContext";
import { ToastProvider } from "./contexts/ToastContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <TabProvider>
          <PositionsProvider>{children}</PositionsProvider>
        </TabProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
