// app/AppProviders.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { PositionsProvider } from "./Providers";
import { TabProvider } from "./contexts/TabContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TabProvider>
        <PositionsProvider>{children}</PositionsProvider>
      </TabProvider>
    </SessionProvider>
  );
}
